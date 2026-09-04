use flate2::read::GzDecoder;
use reqwest::blocking::Client;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::{Duration, Instant},
};
use tar::Archive;
use tauri::{AppHandle, Emitter, Manager};
use zip::ZipArchive;

const APP_DIRECTORY_NAME: &str = "KaraokAI";
const INSTALL_PROGRESS_EVENT: &str = "runtime-install-progress";
const RUNTIME_INSTALL_JOB_ID: &str = "runtime-bootstrap";
const UV_VERSION: &str = "0.12.9";
const PYTHON_VERSION: &str = "3.11.16";
const IMAGEIO_FFMPEG_VERSION: &str = "0.6.0";
const FFMPEG_RUNTIME_VERSION: &str = "7.0.2";
const YT_DLP_VERSION: &str = "2026.8.19";
const ML_WORKER_VERSION: &str = "0.1.0";
const TORCH_VERSION: &str = "2.5.1";
const TORCHAUDIO_VERSION: &str = "2.5.1";
const PYTORCH_CPU_INDEX: &str = "https://download.pytorch.org/whl/cpu";
const WHISPER_STANDARD_FILES: [&str; 4] = [
    "config.json",
    "model.bin",
    "tokenizer.json",
    "vocabulary.txt",
];
const WHISPER_LARGE_V3_FILES: [&str; 5] = [
    "config.json",
    "model.bin",
    "preprocessor_config.json",
    "tokenizer.json",
    "vocabulary.json",
];

static RUNTIME_INSTALL_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BootstrapReport {
    data_directory: String,
    directories: Vec<String>,
    operating_system: String,
    architecture: String,
    runtime_profile: String,
}

#[derive(Clone)]
struct ModelDefinition {
    id: &'static str,
    name: &'static str,
    repository: &'static str,
    revision: &'static str,
    size_label: &'static str,
    files: &'static [&'static str],
}

#[derive(Clone)]
struct DemucsModelDefinition {
    id: &'static str,
    name: &'static str,
    model_name: &'static str,
    size_label: &'static str,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ModelStatus {
    id: String,
    name: String,
    category: String,
    kind: String,
    size_label: String,
    installed: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeComponentStatus {
    id: String,
    name: String,
    installed: bool,
    installed_version: Option<String>,
    available_version: String,
    platform: String,
    size_label: String,
    install_path: String,
    sha256: Option<String>,
    verified: bool,
    update_available: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct InstallEvent {
    job_id: String,
    component_id: String,
    stage: String,
    progress: f64,
    completed_bytes: u64,
    total_bytes: Option<u64>,
    message: String,
    error: Option<InstallError>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct InstallError {
    code: String,
    stage: String,
    recoverable: bool,
    message: String,
}

struct ModelFilePlan {
    url: String,
    destination: PathBuf,
    weight: f64,
}

struct UvAsset {
    filename: &'static str,
    sha256: &'static str,
    format: &'static str,
}

fn whisper_models() -> [ModelDefinition; 5] {
    [
        ModelDefinition {
            id: "whisper-tiny",
            name: "Whisper Tiny",
            repository: "Systran/faster-whisper-tiny",
            revision: "d90ca5fe260221311c53c58e660288d3deb8d356",
            size_label: "~78 MB",
            files: &WHISPER_STANDARD_FILES,
        },
        ModelDefinition {
            id: "whisper-base",
            name: "Whisper Base",
            repository: "Systran/faster-whisper-base",
            revision: "ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66",
            size_label: "~145 MB",
            files: &WHISPER_STANDARD_FILES,
        },
        ModelDefinition {
            id: "whisper-small",
            name: "Whisper Small",
            repository: "Systran/faster-whisper-small",
            revision: "536b0662742c02347bc0e980a01041f333bce120",
            size_label: "~465 MB",
            files: &WHISPER_STANDARD_FILES,
        },
        ModelDefinition {
            id: "whisper-medium",
            name: "Whisper Medium",
            repository: "Systran/faster-whisper-medium",
            revision: "08e178d48790749d25932bbc082711ddcfdfbc4f",
            size_label: "~1.5 GB",
            files: &WHISPER_STANDARD_FILES,
        },
        ModelDefinition {
            id: "whisper-large-v3",
            name: "Whisper Large v3",
            repository: "Systran/faster-whisper-large-v3",
            revision: "edaa852ec7e145841d8ffdb056a99866b5f0a478",
            size_label: "~3.1 GB",
            files: &WHISPER_LARGE_V3_FILES,
        },
    ]
}

fn demucs_models() -> [DemucsModelDefinition; 3] {
    [
        DemucsModelDefinition {
            id: "demucs-htdemucs",
            name: "HTDemucs",
            model_name: "htdemucs",
            size_label: "~80 MB",
        },
        DemucsModelDefinition {
            id: "demucs-htdemucs-ft",
            name: "HTDemucs Fine-tuned",
            model_name: "htdemucs_ft",
            size_label: "~320 MB",
        },
        DemucsModelDefinition {
            id: "demucs-mdx-extra",
            name: "MDX Extra",
            model_name: "mdx_extra",
            size_label: "~160 MB",
        },
    ]
}

fn find_model(model_id: &str) -> Result<ModelDefinition, String> {
    whisper_models()
        .into_iter()
        .find(|model| model.id == model_id)
        .ok_or_else(|| format!("Unknown model: {model_id}"))
}

fn find_demucs_model(model_id: &str) -> Result<DemucsModelDefinition, String> {
    demucs_models()
        .into_iter()
        .find(|model| model.id == model_id)
        .ok_or_else(|| format!("Unknown model: {model_id}"))
}

fn uv_asset() -> Result<UvAsset, String> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("linux", "x86_64") => Ok(UvAsset {
            filename: "uv-x86_64-unknown-linux-gnu.tar.gz",
            sha256: "ec7a99cd05e0cd7f80243f135ce1361c76835cb0ee60055d14d20eba8eba1460",
            format: "tar.gz",
        }),
        ("linux", "aarch64") => Ok(UvAsset {
            filename: "uv-aarch64-unknown-linux-gnu.tar.gz",
            sha256: "c36fe17937ff6bd16dc42fc13854b5465999fcab2efe0af559381e945e3c6001",
            format: "tar.gz",
        }),
        ("macos", "x86_64") => Ok(UvAsset {
            filename: "uv-x86_64-apple-darwin.tar.gz",
            sha256: "e1ca175824f1056589ce9908f7631879ebc3c36535b5e63dc06510beb370b4c1",
            format: "tar.gz",
        }),
        ("macos", "aarch64") => Ok(UvAsset {
            filename: "uv-aarch64-apple-darwin.tar.gz",
            sha256: "301f72afaf54060f92da7016cb0115bd077f43a9c8e39c1d8170a0bac80fd398",
            format: "tar.gz",
        }),
        ("windows", "x86_64") => Ok(UvAsset {
            filename: "uv-x86_64-pc-windows-msvc.zip",
            sha256: "ddbfcee1ac615a0499f6aa97b5ec8ebdf3ee4a7714a48055ec2ba0030e3cf810",
            format: "zip",
        }),
        ("windows", "aarch64") => Ok(UvAsset {
            filename: "uv-aarch64-pc-windows-msvc.zip",
            sha256: "d3360363a3cb671f2c854f4ef48cf4a57fe8664f8ec6a248076d68b797a8acc0",
            format: "zip",
        }),
        (operating_system, architecture) => Err(format!(
            "Unsupported runtime platform: {operating_system}/{architecture}"
        )),
    }
}

fn data_directory(app: &AppHandle, storage_directory: Option<String>) -> Result<PathBuf, String> {
    match storage_directory {
        Some(directory) if !directory.trim().is_empty() => {
            let parent = PathBuf::from(directory);
            if !parent.is_absolute() {
                return Err("The selected storage directory must be an absolute path".to_string());
            }
            Ok(parent.join(APP_DIRECTORY_NAME))
        }
        _ => app
            .path()
            .app_data_dir()
            .map_err(|error| format!("Unable to resolve the app data directory: {error}")),
    }
}

fn model_directory(root: &Path, model_id: &str) -> PathBuf {
    root.join("models").join("whisper").join(model_id)
}

fn model_installed(directory: &Path, model: &ModelDefinition) -> bool {
    model.files.iter().all(|file| {
        directory
            .join(file)
            .metadata()
            .map(|metadata| metadata.is_file() && metadata.len() > 0)
            .unwrap_or(false)
    })
}

fn uv_binary(root: &Path) -> PathBuf {
    root.join("runtime")
        .join("tools")
        .join(if cfg!(windows) { "uv.exe" } else { "uv" })
}

fn environment_python(root: &Path) -> PathBuf {
    if cfg!(windows) {
        root.join("runtime")
            .join("python-environment")
            .join("Scripts")
            .join("python.exe")
    } else {
        root.join("runtime")
            .join("python-environment")
            .join("bin")
            .join("python")
    }
}

fn ffmpeg_binary(root: &Path) -> PathBuf {
    root.join("runtime").join("ffmpeg").join(if cfg!(windows) {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    })
}

fn python_install_directory(root: &Path) -> PathBuf {
    root.join("runtime").join("python")
}

fn python_environment_directory(root: &Path) -> PathBuf {
    root.join("runtime").join("python-environment")
}

fn install_log_path(root: &Path) -> PathBuf {
    root.join("config").join("runtime-installer.log")
}

fn build_client() -> Result<Client, String> {
    Client::builder()
        .user_agent("KaraokAI/0.1 runtime-installer")
        .connect_timeout(Duration::from_secs(30))
        .timeout(Duration::from_secs(60 * 60))
        .build()
        .map_err(|error| format!("Unable to create the download client: {error}"))
}

fn emit_install_event(app: &AppHandle, event: InstallEvent) -> Result<(), String> {
    app.emit(INSTALL_PROGRESS_EVENT, event)
        .map_err(|error| error.to_string())
}

fn emit_progress(
    app: &AppHandle,
    job_id: &str,
    component_id: &str,
    stage: &str,
    progress: f64,
    completed_bytes: u64,
    total_bytes: Option<u64>,
) {
    let event = InstallEvent {
        job_id: job_id.to_string(),
        component_id: component_id.to_string(),
        stage: stage.to_string(),
        progress,
        completed_bytes,
        total_bytes,
        message: component_id.to_string(),
        error: None,
    };
    if let Err(error) = emit_install_event(app, event) {
        eprintln!("Unable to emit install progress: {error}");
    }
}

fn emit_failure(app: &AppHandle, job_id: &str, component_id: &str, stage: &str, message: String) {
    let event = InstallEvent {
        job_id: job_id.to_string(),
        component_id: component_id.to_string(),
        stage: "failed".to_string(),
        progress: 0.0,
        completed_bytes: 0,
        total_bytes: None,
        message: component_id.to_string(),
        error: Some(InstallError {
            code: "RUNTIME_INSTALL_FAILED".to_string(),
            stage: stage.to_string(),
            recoverable: true,
            message,
        }),
    };
    let _ = emit_install_event(app, event);
}

fn append_install_log(root: &Path, message: &str) {
    let log_directory = root.join("config");
    if fs::create_dir_all(&log_directory).is_err() {
        return;
    }
    if let Ok(mut log) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(install_log_path(root))
    {
        let _ = writeln!(log, "{message}");
    }
}

fn whisper_url(model: &ModelDefinition, file: &str) -> String {
    format!(
        "https://huggingface.co/{}/resolve/{}/{file}",
        model.repository, model.revision
    )
}

fn plan_model_files(root: &Path, model: &ModelDefinition) -> Result<Vec<ModelFilePlan>, String> {
    let directory = model_directory(root, model.id);
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create {}: {error}", directory.display()))?;

    Ok(model
        .files
        .iter()
        .map(|file| ModelFilePlan {
            url: whisper_url(model, file),
            destination: directory.join(file),
            weight: match *file {
                "model.bin" => 0.97,
                "tokenizer.json" => 0.02,
                _ => 0.005,
            },
        })
        .collect())
}

fn valid_file(path: &Path) -> bool {
    path.metadata()
        .map(|metadata| metadata.is_file() && metadata.len() > 0)
        .unwrap_or(false)
}

fn partial_path(destination: &Path) -> Result<PathBuf, String> {
    let filename = destination
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| format!("Invalid destination: {}", destination.display()))?;
    Ok(destination.with_file_name(format!("{filename}.part")))
}

fn download_with_unknown_size<F>(
    client: &Client,
    url: &str,
    destination: &Path,
    mut on_progress: F,
) -> Result<u64, String>
where
    F: FnMut(u64, Option<u64>),
{
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Unable to create {}: {error}", parent.display()))?;
    }

    let mut response = client
        .get(url)
        .send()
        .map_err(|error| format!("Unable to download {url}: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Unable to download {url}: {error}"))?;
    let total = response.content_length().filter(|size| *size > 0);
    let partial = partial_path(destination)?;
    let mut output = fs::File::create(&partial)
        .map_err(|error| format!("Unable to create {}: {error}", partial.display()))?;
    let mut buffer = [0_u8; 128 * 1024];
    let mut completed = 0_u64;
    let mut last_event = Instant::now();

    loop {
        let read = response
            .read(&mut buffer)
            .map_err(|error| format!("Unable to read {url}: {error}"))?;
        if read == 0 {
            break;
        }
        output
            .write_all(&buffer[..read])
            .map_err(|error| format!("Unable to write {}: {error}", partial.display()))?;
        completed = completed.saturating_add(read as u64);
        if last_event.elapsed() >= Duration::from_millis(100) || total == Some(completed) {
            on_progress(completed, total);
            last_event = Instant::now();
        }
    }

    output
        .flush()
        .map_err(|error| format!("Unable to finish {}: {error}", partial.display()))?;
    if completed == 0 {
        return Err(format!("The download from {url} was empty"));
    }
    if let Some(expected) = total {
        if completed != expected {
            return Err(format!(
                "Incomplete download for {url}: expected {expected}, received {completed}"
            ));
        }
    }
    on_progress(completed, total);

    if destination.exists() {
        fs::remove_file(destination)
            .map_err(|error| format!("Unable to replace {}: {error}", destination.display()))?;
    }
    fs::rename(&partial, destination)
        .map_err(|error| format!("Unable to activate {}: {error}", destination.display()))?;
    Ok(completed)
}

fn install_model(
    app: &AppHandle,
    job_id: &str,
    client: &Client,
    root: &Path,
    model: &ModelDefinition,
    plans: &[ModelFilePlan],
    start_progress: f64,
    progress_span: f64,
) -> Result<(), String> {
    let mut completed_weight = 0.0;
    let total_weight = plans.iter().map(|plan| plan.weight).sum::<f64>();
    for plan in plans {
        let weight = plan.weight / total_weight;
        let file_start = start_progress + completed_weight * progress_span;
        let file_end = file_start + weight * progress_span;
        completed_weight += weight;

        if valid_file(&plan.destination) {
            emit_progress(app, job_id, model.id, "downloading", file_end, 0, None);
            continue;
        }
        let filename = plan
            .destination
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("model file");
        append_install_log(root, &format!("DOWNLOAD {} {filename}", model.id));
        emit_progress(app, job_id, model.id, "downloading", file_start, 0, None);
        download_with_unknown_size(client, &plan.url, &plan.destination, |downloaded, total| {
            let fraction = total
                .map(|size| downloaded as f64 / size as f64)
                .unwrap_or_else(|| downloaded as f64 / (downloaded as f64 + 5_000_000.0));
            emit_progress(
                app,
                job_id,
                model.id,
                "downloading",
                file_start + fraction * (file_end - file_start),
                downloaded,
                total,
            );
        })?;
    }
    if !plans.iter().all(|plan| valid_file(&plan.destination)) {
        return Err(format!(
            "Model {} did not pass installation validation",
            model.id
        ));
    }
    Ok(())
}

fn sha256(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path)
        .map_err(|error| format!("Unable to open {}: {error}", path.display()))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 128 * 1024];
    loop {
        let read = file
            .read(&mut buffer)
            .map_err(|error| format!("Unable to verify {}: {error}", path.display()))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn valid_sha256(path: &Path, expected: &str) -> bool {
    sha256(path)
        .map(|checksum| checksum.eq_ignore_ascii_case(expected))
        .unwrap_or(false)
}

fn find_file(directory: &Path, names: &[&str], extensions: &[&str]) -> Option<PathBuf> {
    let entries = fs::read_dir(directory).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_file(&path, names, extensions) {
                return Some(found);
            }
            continue;
        }
        let filename = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("");
        let extension = path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("");
        if names.contains(&filename) || extensions.contains(&extension) {
            return Some(path);
        }
    }
    None
}

fn extract_zip(archive_path: &Path, destination: &Path) -> Result<(), String> {
    let archive_file = fs::File::open(archive_path)
        .map_err(|error| format!("Unable to open {}: {error}", archive_path.display()))?;
    let mut archive = ZipArchive::new(archive_file)
        .map_err(|error| format!("Invalid archive {}: {error}", archive_path.display()))?;
    fs::create_dir_all(destination)
        .map_err(|error| format!("Unable to create {}: {error}", destination.display()))?;
    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|error| format!("Unable to read archive entry: {error}"))?;
        let relative_path = entry
            .enclosed_name()
            .ok_or_else(|| format!("Unsafe path in archive: {}", entry.name()))?;
        if entry
            .unix_mode()
            .map(|mode| mode & 0o170000 == 0o120000)
            .unwrap_or(false)
        {
            return Err(format!(
                "Symbolic links are not allowed in runtime archives: {}",
                entry.name()
            ));
        }
        let output_path = destination.join(relative_path);
        if entry.is_dir() {
            fs::create_dir_all(&output_path)
                .map_err(|error| format!("Unable to create {}: {error}", output_path.display()))?;
            continue;
        }
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("Unable to create {}: {error}", parent.display()))?;
        }
        let mut output = fs::File::create(&output_path)
            .map_err(|error| format!("Unable to create {}: {error}", output_path.display()))?;
        std::io::copy(&mut entry, &mut output)
            .map_err(|error| format!("Unable to extract {}: {error}", output_path.display()))?;
    }
    Ok(())
}

fn extract_tar_gz(archive_path: &Path, destination: &Path) -> Result<(), String> {
    let archive_file = fs::File::open(archive_path)
        .map_err(|error| format!("Unable to open {}: {error}", archive_path.display()))?;
    let decoder = GzDecoder::new(archive_file);
    let mut archive = Archive::new(decoder);
    fs::create_dir_all(destination)
        .map_err(|error| format!("Unable to create {}: {error}", destination.display()))?;
    let entries = archive
        .entries()
        .map_err(|error| format!("Unable to read {}: {error}", archive_path.display()))?;
    for entry in entries {
        let mut entry = entry.map_err(|error| format!("Unable to read archive entry: {error}"))?;
        let entry_type = entry.header().entry_type();
        if entry_type.is_symlink() || entry_type.is_hard_link() {
            return Err("Links are not allowed in runtime archives".to_string());
        }
        let unpacked = entry
            .unpack_in(destination)
            .map_err(|error| format!("Unable to extract runtime archive: {error}"))?;
        if !unpacked {
            return Err("Unsafe path in runtime archive".to_string());
        }
    }
    Ok(())
}

#[cfg(unix)]
fn make_executable(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    let mut permissions = path
        .metadata()
        .map_err(|error| format!("Unable to inspect {}: {error}", path.display()))?
        .permissions();
    permissions.set_mode(permissions.mode() | 0o700);
    fs::set_permissions(path, permissions)
        .map_err(|error| format!("Unable to make {} executable: {error}", path.display()))
}

#[cfg(not(unix))]
fn make_executable(_path: &Path) -> Result<(), String> {
    Ok(())
}

fn command_succeeds(binary: &Path, arguments: &[&str]) -> bool {
    binary
        .metadata()
        .map(|metadata| metadata.is_file())
        .unwrap_or(false)
        && Command::new(binary)
            .args(arguments)
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
}

fn command_output(binary: &Path, arguments: &[&str]) -> Option<String> {
    let output = Command::new(binary).args(arguments).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8(output.stdout).ok()?;
    Some(stdout.trim().to_string())
}

fn platform_label() -> String {
    let operating_system = match std::env::consts::OS {
        "macos" => "macos",
        value => value,
    };
    let architecture = match std::env::consts::ARCH {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        value => value,
    };
    format!("{operating_system}-{architecture}")
}

fn versions_match(installed: &str, expected: &str) -> bool {
    fn normalize(version: &str) -> Vec<String> {
        version
            .trim()
            .trim_start_matches('v')
            .split('.')
            .map(|part| {
                part.parse::<u64>()
                    .map(|number| number.to_string())
                    .unwrap_or_else(|_| part.to_ascii_lowercase())
            })
            .collect()
    }

    normalize(installed) == normalize(expected)
}

fn run_logged_command(
    app: &AppHandle,
    root: &Path,
    job_id: &str,
    component_id: &str,
    start_progress: f64,
    end_progress: f64,
    label: &str,
    command: &mut Command,
) -> Result<(), String> {
    append_install_log(root, &format!("RUN {label}"));
    let log_path = install_log_path(root);
    let log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|error| format!("Unable to open {}: {error}", log_path.display()))?;
    let stderr_log = log
        .try_clone()
        .map_err(|error| format!("Unable to clone installer log: {error}"))?;
    command
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(stderr_log));
    emit_progress(
        app,
        job_id,
        component_id,
        "installing",
        start_progress,
        0,
        None,
    );
    let mut child = command
        .spawn()
        .map_err(|error| format!("Unable to start {label}: {error}"))?;
    let mut ticks = 0_u64;
    loop {
        if let Some(status) = child
            .try_wait()
            .map_err(|error| format!("Unable to monitor {label}: {error}"))?
        {
            if !status.success() {
                return Err(format!(
                    "{label} failed with {status}. Details: {}",
                    log_path.display()
                ));
            }
            emit_progress(
                app,
                job_id,
                component_id,
                "installing",
                end_progress,
                0,
                None,
            );
            append_install_log(root, &format!("COMPLETE {label}"));
            return Ok(());
        }

        ticks = ticks.saturating_add(1);
        let fraction = ticks as f64 / (ticks as f64 + 80.0);
        let progress = start_progress + (end_progress - start_progress) * fraction;
        emit_progress(
            app,
            job_id,
            component_id,
            "installing",
            progress.min(end_progress - 0.1),
            0,
            None,
        );
        thread::sleep(Duration::from_millis(500));
    }
}

fn configure_uv(command: &mut Command, root: &Path) {
    command
        .current_dir(root)
        .env("UV_CACHE_DIR", root.join("cache").join("uv"))
        .env("UV_PYTHON_INSTALL_DIR", python_install_directory(root))
        .env("UV_PYTHON_INSTALL_BIN", "0")
        .env("UV_PYTHON_INSTALL_REGISTRY", "0")
        .env("UV_MANAGED_PYTHON", "1")
        .env("UV_NO_CONFIG", "1")
        .env("UV_NO_PROGRESS", "1");
}

fn uv_command(root: &Path) -> Command {
    let mut command = Command::new(uv_binary(root));
    configure_uv(&mut command, root);
    command
}

fn configure_python(command: &mut Command, root: &Path) {
    command
        .current_dir(root)
        .env("HF_HOME", root.join("cache").join("huggingface"))
        .env("MPLCONFIGDIR", root.join("cache").join("matplotlib"))
        .env("PYTHONNOUSERSITE", "1")
        .env("TORCH_HOME", root.join("models").join("demucs"))
        .env("XDG_CACHE_HOME", root.join("cache").join("python"));
}

fn python_command(root: &Path) -> Command {
    let mut command = Command::new(environment_python(root));
    configure_python(&mut command, root);
    command
}

fn ensure_uv(app: &AppHandle, root: &Path, client: &Client) -> Result<(), String> {
    if command_succeeds(&uv_binary(root), &["--version"]) {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "uv",
            "installing",
            8.0,
            0,
            None,
        );
        return Ok(());
    }
    let asset = uv_asset()?;
    let url = format!(
        "https://github.com/astral-sh/uv/releases/download/{UV_VERSION}/{}",
        asset.filename
    );
    let downloads = root.join("cache").join("downloads");
    let archive_path = downloads.join(asset.filename);
    fs::create_dir_all(&downloads)
        .map_err(|error| format!("Unable to create {}: {error}", downloads.display()))?;

    if !valid_sha256(&archive_path, asset.sha256) {
        append_install_log(root, &format!("DOWNLOAD uv {url}"));
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "uv",
            "downloading",
            1.0,
            0,
            None,
        );
        download_with_unknown_size(client, &url, &archive_path, |downloaded, total| {
            let fraction = total
                .map(|size| downloaded as f64 / size as f64)
                .unwrap_or_else(|| downloaded as f64 / (downloaded as f64 + 5_000_000.0));
            emit_progress(
                app,
                RUNTIME_INSTALL_JOB_ID,
                "uv",
                "downloading",
                1.0 + fraction * 5.0,
                downloaded,
                total,
            );
        })?;
    }
    if !valid_sha256(&archive_path, asset.sha256) {
        return Err("The uv download did not pass SHA-256 validation".to_string());
    }

    let staging = root.join("cache").join("staging").join("uv");
    if staging.exists() {
        fs::remove_dir_all(&staging)
            .map_err(|error| format!("Unable to clear {}: {error}", staging.display()))?;
    }
    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "uv",
        "installing",
        6.5,
        0,
        None,
    );
    match asset.format {
        "zip" => extract_zip(&archive_path, &staging)?,
        "tar.gz" => extract_tar_gz(&archive_path, &staging)?,
        format => return Err(format!("Unsupported uv archive format: {format}")),
    }
    let source = find_file(&staging, &["uv", "uv.exe"], &[])
        .ok_or_else(|| "The official uv archive does not contain its executable".to_string())?;
    let destination = uv_binary(root);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Unable to create {}: {error}", parent.display()))?;
    }
    fs::copy(&source, &destination)
        .map_err(|error| format!("Unable to install {}: {error}", destination.display()))?;
    make_executable(&destination)?;
    if !command_succeeds(&destination, &["--version"]) {
        return Err("The uv runtime did not pass its healthcheck".to_string());
    }
    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "uv",
        "installing",
        8.0,
        0,
        None,
    );
    Ok(())
}

fn ensure_python(app: &AppHandle, root: &Path) -> Result<(), String> {
    let installed_python = find_file(
        &python_install_directory(root),
        &["python", "python.exe", "python3", "python3.11"],
        &[],
    );
    if installed_python
        .as_deref()
        .map(|python| command_succeeds(python, &["--version"]))
        .unwrap_or(false)
    {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "python",
            "installing",
            20.0,
            0,
            None,
        );
        return Ok(());
    }

    let mut command = uv_command(root);
    command
        .arg("python")
        .arg("install")
        .arg(PYTHON_VERSION)
        .arg("--install-dir")
        .arg(python_install_directory(root))
        .arg("--managed-python")
        .arg("--no-bin")
        .arg("--no-config");
    if cfg!(windows) {
        command.arg("--no-registry");
    }
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "python",
        8.0,
        20.0,
        "private Python installation",
        &mut command,
    )
}

fn ensure_python_environment(app: &AppHandle, root: &Path) -> Result<(), String> {
    if command_succeeds(&environment_python(root), &["--version"]) {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "python-environment",
            "installing",
            24.0,
            0,
            None,
        );
        return Ok(());
    }

    let mut command = uv_command(root);
    command
        .arg("venv")
        .arg(python_environment_directory(root))
        .arg("--python")
        .arg(PYTHON_VERSION)
        .arg("--managed-python")
        .arg("--no-config");
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "python-environment",
        20.0,
        24.0,
        "isolated Python environment creation",
        &mut command,
    )
}

fn python_imports_succeed(root: &Path, modules: &str) -> bool {
    let mut command = python_command(root);
    command
        .arg("-c")
        .arg(format!("import {modules}"))
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn ensure_torch(app: &AppHandle, root: &Path) -> Result<(), String> {
    if python_imports_succeed(root, "torch, torchaudio") {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "ml-worker",
            "installing",
            47.0,
            0,
            None,
        );
        return Ok(());
    }

    let mut command = uv_command(root);
    command
        .arg("pip")
        .arg("install")
        .arg("--python")
        .arg(environment_python(root))
        .arg(format!("torch=={TORCH_VERSION}"))
        .arg(format!("torchaudio=={TORCHAUDIO_VERSION}"));
    if !cfg!(target_os = "macos") {
        command.arg("--index-url").arg(PYTORCH_CPU_INDEX);
    }
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "ml-worker",
        24.0,
        47.0,
        "PyTorch installation",
        &mut command,
    )
}

fn ensure_ffmpeg(app: &AppHandle, root: &Path) -> Result<(), String> {
    if command_succeeds(&ffmpeg_binary(root), &["-version"]) {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "ffmpeg",
            "installing",
            56.0,
            0,
            None,
        );
        return Ok(());
    }

    let mut install = uv_command(root);
    install
        .arg("pip")
        .arg("install")
        .arg("--python")
        .arg(environment_python(root))
        .arg(format!("imageio-ffmpeg=={IMAGEIO_FFMPEG_VERSION}"));
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "ffmpeg",
        47.0,
        54.0,
        "FFmpeg wheel installation",
        &mut install,
    )?;

    let destination = ffmpeg_binary(root);
    let script = "from pathlib import Path; import imageio_ffmpeg, shutil, sys; target=Path(sys.argv[1]); target.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(imageio_ffmpeg.get_ffmpeg_exe(), target)";
    let mut copy = python_command(root);
    copy.arg("-c").arg(script).arg(&destination);
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "ffmpeg",
        54.0,
        55.0,
        "private FFmpeg activation",
        &mut copy,
    )?;
    make_executable(&destination)?;
    if !command_succeeds(&destination, &["-version"]) {
        return Err("The private FFmpeg runtime did not pass its healthcheck".to_string());
    }
    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "ffmpeg",
        "installing",
        56.0,
        0,
        None,
    );
    Ok(())
}

fn yt_dlp_version(root: &Path) -> Option<String> {
    let mut command = python_command(root);
    let output = command.args(["-m", "yt_dlp", "--version"]).output().ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8(output.stdout)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn python_distribution_version(root: &Path, distribution: &str) -> Option<String> {
    let mut command = python_command(root);
    let output = command
        .arg("-c")
        .arg("from importlib.metadata import version; import sys; print(version(sys.argv[1]))")
        .arg(distribution)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8(output.stdout)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn ensure_yt_dlp(app: &AppHandle, root: &Path) -> Result<(), String> {
    if yt_dlp_version(root)
        .as_deref()
        .map(|version| versions_match(version, YT_DLP_VERSION))
        .unwrap_or(false)
    {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "yt-dlp",
            "installing",
            61.0,
            0,
            None,
        );
        return Ok(());
    }

    let mut install = uv_command(root);
    install
        .arg("pip")
        .arg("install")
        .arg("--python")
        .arg(environment_python(root))
        .arg(format!("yt-dlp=={YT_DLP_VERSION}"));
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "yt-dlp",
        56.0,
        60.0,
        "yt-dlp installation",
        &mut install,
    )?;
    if !yt_dlp_version(root)
        .as_deref()
        .map(|version| versions_match(version, YT_DLP_VERSION))
        .unwrap_or(false)
    {
        return Err("The private yt-dlp installation did not pass its healthcheck".to_string());
    }
    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "yt-dlp",
        "installing",
        61.0,
        0,
        None,
    );
    Ok(())
}

fn install_yt_dlp_package(root: &Path) -> Result<(), String> {
    if !command_succeeds(&uv_binary(root), &["--version"]) {
        return Err("The private uv installer is not available".to_string());
    }
    if !command_succeeds(&environment_python(root), &["--version"]) {
        return Err("The private Python runtime is not available".to_string());
    }

    if yt_dlp_version(root)
        .as_deref()
        .map(|version| versions_match(version, YT_DLP_VERSION))
        .unwrap_or(false)
    {
        return Ok(());
    }

    append_install_log(root, "START standalone yt-dlp installation");
    let mut install = uv_command(root);
    let output = install
        .arg("pip")
        .arg("install")
        .arg("--python")
        .arg(environment_python(root))
        .arg("--upgrade")
        .arg(format!("yt-dlp=={YT_DLP_VERSION}"))
        .output()
        .map_err(|error| format!("Unable to start yt-dlp installation: {error}"))?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
        append_install_log(root, &format!("FAILED standalone yt-dlp {message}"));
        return Err(if message.is_empty() {
            "The yt-dlp installer exited with an error".to_string()
        } else {
            message
        });
    }
    if !yt_dlp_version(root)
        .as_deref()
        .map(|version| versions_match(version, YT_DLP_VERSION))
        .unwrap_or(false)
    {
        return Err("The private yt-dlp installation did not pass its healthcheck".to_string());
    }
    append_install_log(root, "COMPLETE standalone yt-dlp installation");
    Ok(())
}

fn worker_resource_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let bundled = app
        .path()
        .resource_dir()
        .map_err(|error| format!("Unable to resolve application resources: {error}"))?
        .join("worker");
    if bundled.join("pyproject.toml").is_file() {
        return Ok(bundled);
    }
    let current_directory = std::env::current_dir()
        .map_err(|error| format!("Unable to resolve development directory: {error}"))?;
    for development in [
        current_directory.join("worker"),
        current_directory.join("..").join("worker"),
    ] {
        if development.join("pyproject.toml").is_file() {
            return Ok(development);
        }
    }
    Err("The KaraokAI worker source is missing from the application resources".to_string())
}

fn copy_directory(source: &Path, destination: &Path) -> Result<(), String> {
    fs::create_dir_all(destination)
        .map_err(|error| format!("Unable to create {}: {error}", destination.display()))?;
    for entry in fs::read_dir(source)
        .map_err(|error| format!("Unable to read {}: {error}", source.display()))?
    {
        let entry = entry.map_err(|error| format!("Unable to read worker resource: {error}"))?;
        let file_type = entry
            .file_type()
            .map_err(|error| format!("Unable to inspect worker resource: {error}"))?;
        let target = destination.join(entry.file_name());
        if file_type.is_symlink() {
            return Err("Links are not allowed in the worker resources".to_string());
        }
        if file_type.is_dir() {
            copy_directory(&entry.path(), &target)?;
        } else if file_type.is_file() {
            fs::copy(entry.path(), &target)
                .map_err(|error| format!("Unable to copy {}: {error}", target.display()))?;
        }
    }
    Ok(())
}

fn prepare_worker_source(app: &AppHandle, root: &Path) -> Result<PathBuf, String> {
    let resource = worker_resource_directory(app)?;
    let destination = root.join("runtime").join("worker-source");
    if destination.exists() {
        fs::remove_dir_all(&destination)
            .map_err(|error| format!("Unable to clear {}: {error}", destination.display()))?;
    }
    fs::create_dir_all(&destination)
        .map_err(|error| format!("Unable to create {}: {error}", destination.display()))?;
    fs::copy(
        resource.join("pyproject.toml"),
        destination.join("pyproject.toml"),
    )
    .map_err(|error| format!("Unable to copy worker project metadata: {error}"))?;
    copy_directory(
        &resource.join("karaoke_worker"),
        &destination.join("karaoke_worker"),
    )?;
    if !destination.join("pyproject.toml").is_file() {
        return Err("The writable worker source is incomplete".to_string());
    }
    Ok(destination)
}

fn worker_healthcheck(root: &Path) -> bool {
    let mut command = python_command(root);
    command
        .args(["-m", "karaoke_worker", "--healthcheck"])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn ensure_worker(app: &AppHandle, root: &Path) -> Result<(), String> {
    if worker_healthcheck(root) {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "ml-worker",
            "installing",
            77.0,
            0,
            None,
        );
        return Ok(());
    }

    let source = prepare_worker_source(app, root)?;
    let mut command = uv_command(root);
    command
        .arg("pip")
        .arg("install")
        .arg("--python")
        .arg(environment_python(root))
        .arg(source);
    if !cfg!(target_os = "macos") {
        command
            .arg("--extra-index-url")
            .arg(PYTORCH_CPU_INDEX)
            .arg("--index-strategy")
            .arg("unsafe-best-match");
    }
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "ml-worker",
        61.0,
        76.0,
        "KaraokAI ML dependencies installation",
        &mut command,
    )?;
    if !worker_healthcheck(root) {
        return Err("The isolated ML worker did not pass its healthcheck".to_string());
    }
    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "ml-worker",
        "installing",
        77.0,
        0,
        None,
    );
    Ok(())
}

fn demucs_model_marker(root: &Path, model_id: &str) -> PathBuf {
    root.join("models")
        .join("demucs")
        .join("installed")
        .join(format!("{model_id}.json"))
}

fn mark_demucs_model_installed(root: &Path, model: &DemucsModelDefinition) -> Result<(), String> {
    let marker = demucs_model_marker(root, model.id);
    if let Some(parent) = marker.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Unable to create {}: {error}", parent.display()))?;
    }
    let contents = serde_json::to_vec_pretty(&serde_json::json!({
        "id": model.id,
        "model": model.model_name,
        "source": "Meta Demucs model repository"
    }))
    .map_err(|error| format!("Unable to serialize Demucs state: {error}"))?;
    fs::write(&marker, contents)
        .map_err(|error| format!("Unable to save {}: {error}", marker.display()))
}

fn demucs_model_installed(root: &Path, model: &DemucsModelDefinition) -> bool {
    if valid_file(&demucs_model_marker(root, model.id)) {
        return true;
    }
    let dedicated_directory = root.join("models").join("demucs").join(model.id);
    if find_file(&dedicated_directory, &[], &["th", "ckpt"]).is_some() {
        return true;
    }
    model.id == "demucs-htdemucs"
        && find_file(
            &root.join("models").join("demucs").join("hub"),
            &[],
            &["th", "ckpt"],
        )
        .and_then(|path| path.metadata().ok())
        .map(|metadata| metadata.is_file() && metadata.len() > 0)
        .unwrap_or(false)
}

fn ensure_demucs_model(app: &AppHandle, root: &Path) -> Result<(), String> {
    let model = find_demucs_model("demucs-htdemucs")?;
    if demucs_model_installed(root, &model) {
        mark_demucs_model_installed(root, &model)?;
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "demucs-htdemucs",
            "installing",
            85.0,
            0,
            None,
        );
        return Ok(());
    }

    let torch_home = root.join("models").join("demucs").join(model.id);
    fs::create_dir_all(&torch_home)
        .map_err(|error| format!("Unable to create {}: {error}", torch_home.display()))?;
    let mut command = python_command(root);
    command.env("TORCH_HOME", &torch_home);
    command
        .arg("-c")
        .arg("from demucs.pretrained import get_model; get_model('htdemucs')");
    run_logged_command(
        app,
        root,
        RUNTIME_INSTALL_JOB_ID,
        "demucs-htdemucs",
        77.0,
        85.0,
        "HTDemucs model download",
        &mut command,
    )?;
    if find_file(&torch_home, &[], &["th", "ckpt"]).is_none() {
        return Err("The HTDemucs model was not found after installation".to_string());
    }
    mark_demucs_model_installed(root, &model)?;
    Ok(())
}

fn runtime_components_installed(root: &Path) -> bool {
    let default_demucs = find_demucs_model("demucs-htdemucs").ok();
    command_succeeds(&uv_binary(root), &["--version"])
        && command_succeeds(&environment_python(root), &["--version"])
        && command_succeeds(&ffmpeg_binary(root), &["-version"])
        && yt_dlp_version(root)
            .as_deref()
            .map(|version| versions_match(version, YT_DLP_VERSION))
            .unwrap_or(false)
        && worker_healthcheck(root)
        && default_demucs
            .as_ref()
            .map(|model| demucs_model_installed(root, model))
            .unwrap_or(false)
}

fn write_runtime_state(root: &Path, model: &ModelDefinition) -> Result<(), String> {
    let state = serde_json::json!({
        "installer": {
            "name": "uv",
            "version": UV_VERSION,
            "source": format!("https://github.com/astral-sh/uv/releases/tag/{UV_VERSION}")
        },
        "python": {
            "version": PYTHON_VERSION,
            "source": "Astral python-build-standalone via uv"
        },
        "ffmpeg": {
            "package": "imageio-ffmpeg",
            "version": IMAGEIO_FFMPEG_VERSION,
            "source": "PyPI"
        },
        "ytDlp": {
            "version": YT_DLP_VERSION,
            "source": "PyPI"
        },
        "mlWorker": {
            "source": "PyPI and the official PyTorch wheel index",
            "torch": TORCH_VERSION,
            "torchaudio": TORCHAUDIO_VERSION
        },
        "demucs": {
            "model": "htdemucs",
            "source": "Meta Demucs model repository"
        },
        "whisper": {
            "model": model.id,
            "repository": model.repository,
            "revision": model.revision,
            "source": "Hugging Face"
        }
    });
    let path = root.join("config").join("runtime-state.json");
    let contents = serde_json::to_vec_pretty(&state)
        .map_err(|error| format!("Unable to serialize runtime state: {error}"))?;
    fs::write(&path, contents)
        .map_err(|error| format!("Unable to save {}: {error}", path.display()))
}

fn install_runtime(app: &AppHandle, root: &Path, model: &ModelDefinition) -> Result<(), String> {
    if model_installed(&model_directory(root, model.id), model)
        && runtime_components_installed(root)
    {
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            "runtime",
            "completed",
            100.0,
            0,
            None,
        );
        return Ok(());
    }

    let client = build_client()?;
    ensure_uv(app, root, &client)?;
    ensure_python(app, root)?;
    ensure_python_environment(app, root)?;
    ensure_torch(app, root)?;
    ensure_ffmpeg(app, root)?;
    ensure_yt_dlp(app, root)?;
    ensure_worker(app, root)?;
    ensure_demucs_model(app, root)?;

    let model_plans = plan_model_files(root, model)?;
    install_model(
        app,
        RUNTIME_INSTALL_JOB_ID,
        &client,
        root,
        model,
        &model_plans,
        85.0,
        12.0,
    )?;

    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "validating",
        "installing",
        98.0,
        0,
        None,
    );
    if !model_installed(&model_directory(root, model.id), model) {
        return Err(format!("Model {} is not installed", model.id));
    }
    if !runtime_components_installed(root) {
        return Err("The runtime did not pass final validation".to_string());
    }
    write_runtime_state(root, model)?;

    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "runtime",
        "completed",
        100.0,
        0,
        None,
    );
    Ok(())
}

fn ffmpeg_version(root: &Path) -> Option<String> {
    let output = command_output(&ffmpeg_binary(root), &["-version"])?;
    output
        .lines()
        .next()?
        .split_whitespace()
        .nth(2)
        .map(|version| version.to_string())
}

fn runtime_component_statuses(root: &Path) -> Vec<RuntimeComponentStatus> {
    let platform = platform_label();
    let ffmpeg_installed_version = ffmpeg_version(root);
    let ffmpeg_verified = ffmpeg_installed_version.is_some();
    let worker_installed_version = python_distribution_version(root, "karaoke-worker");
    let worker_update_available = worker_installed_version
        .as_deref()
        .map(|version| version != ML_WORKER_VERSION)
        .unwrap_or(false);
    let worker_verified =
        worker_installed_version.as_deref() == Some(ML_WORKER_VERSION) && worker_healthcheck(root);
    let yt_dlp_installed_version = yt_dlp_version(root);
    let yt_dlp_verified = yt_dlp_installed_version
        .as_deref()
        .map(|version| versions_match(version, YT_DLP_VERSION))
        .unwrap_or(false);
    let worker_checksum = sha256(
        &root
            .join("runtime")
            .join("worker-source")
            .join("pyproject.toml"),
    )
    .ok();

    vec![
        RuntimeComponentStatus {
            id: "ffmpeg".to_string(),
            name: "FFmpeg".to_string(),
            installed: ffmpeg_installed_version.is_some(),
            update_available: ffmpeg_installed_version
                .as_deref()
                .map(|version| !version.starts_with(FFMPEG_RUNTIME_VERSION))
                .unwrap_or(false),
            installed_version: ffmpeg_installed_version,
            available_version: FFMPEG_RUNTIME_VERSION.to_string(),
            platform: platform.clone(),
            size_label: "~78 MB".to_string(),
            install_path: ffmpeg_binary(root).display().to_string(),
            sha256: sha256(&ffmpeg_binary(root)).ok(),
            verified: ffmpeg_verified,
        },
        RuntimeComponentStatus {
            id: "ml-worker".to_string(),
            name: "ML Worker".to_string(),
            installed: worker_installed_version.is_some(),
            installed_version: worker_installed_version,
            available_version: ML_WORKER_VERSION.to_string(),
            platform: platform.clone(),
            size_label: "~1.2 GB".to_string(),
            install_path: python_environment_directory(root).display().to_string(),
            sha256: worker_checksum,
            verified: worker_verified,
            update_available: worker_update_available,
        },
        RuntimeComponentStatus {
            id: "yt-dlp".to_string(),
            name: "yt-dlp".to_string(),
            installed: yt_dlp_installed_version.is_some(),
            update_available: yt_dlp_installed_version
                .as_deref()
                .map(|version| !versions_match(version, YT_DLP_VERSION))
                .unwrap_or(false),
            installed_version: yt_dlp_installed_version,
            available_version: YT_DLP_VERSION.to_string(),
            platform,
            size_label: "~20 MB".to_string(),
            install_path: python_environment_directory(root).display().to_string(),
            sha256: None,
            verified: yt_dlp_verified,
        },
    ]
}

fn runtime_component_inventory(root: &Path) -> Vec<RuntimeComponentStatus> {
    let platform = platform_label();
    let ffmpeg_installed_version = ffmpeg_version(root);
    let worker_installed_version = python_distribution_version(root, "karaoke-worker");
    let yt_dlp_installed_version = python_distribution_version(root, "yt-dlp");
    let worker_update_available = worker_installed_version
        .as_deref()
        .map(|version| version != ML_WORKER_VERSION)
        .unwrap_or(false);
    let worker_verified = worker_installed_version.as_deref() == Some(ML_WORKER_VERSION);
    let yt_dlp_verified = yt_dlp_installed_version
        .as_deref()
        .map(|version| versions_match(version, YT_DLP_VERSION))
        .unwrap_or(false);

    vec![
        RuntimeComponentStatus {
            id: "ffmpeg".to_string(),
            name: "FFmpeg".to_string(),
            installed: ffmpeg_installed_version.is_some(),
            update_available: ffmpeg_installed_version
                .as_deref()
                .map(|version| !version.starts_with(FFMPEG_RUNTIME_VERSION))
                .unwrap_or(false),
            verified: ffmpeg_installed_version.is_some(),
            installed_version: ffmpeg_installed_version,
            available_version: FFMPEG_RUNTIME_VERSION.to_string(),
            platform: platform.clone(),
            size_label: "~78 MB".to_string(),
            install_path: ffmpeg_binary(root).display().to_string(),
            sha256: None,
        },
        RuntimeComponentStatus {
            id: "ml-worker".to_string(),
            name: "ML Worker".to_string(),
            installed: worker_installed_version.is_some(),
            installed_version: worker_installed_version,
            available_version: ML_WORKER_VERSION.to_string(),
            platform: platform.clone(),
            size_label: "~1.2 GB".to_string(),
            install_path: python_environment_directory(root).display().to_string(),
            sha256: None,
            verified: worker_verified,
            update_available: worker_update_available,
        },
        RuntimeComponentStatus {
            id: "yt-dlp".to_string(),
            name: "yt-dlp".to_string(),
            installed: yt_dlp_installed_version.is_some(),
            update_available: yt_dlp_installed_version
                .as_deref()
                .map(|version| !versions_match(version, YT_DLP_VERSION))
                .unwrap_or(false),
            installed_version: yt_dlp_installed_version,
            available_version: YT_DLP_VERSION.to_string(),
            platform,
            size_label: "~20 MB".to_string(),
            install_path: python_environment_directory(root).display().to_string(),
            sha256: None,
            verified: yt_dlp_verified,
        },
    ]
}

pub(crate) fn list_runtime_components(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<RuntimeComponentStatus>, String> {
    let root = data_directory(&app, storage_directory)?;
    Ok(runtime_component_inventory(&root))
}

pub(crate) fn run_runtime_checkup(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<RuntimeComponentStatus>, String> {
    let root = data_directory(&app, storage_directory)?;
    Ok(runtime_component_statuses(&root))
}

pub(crate) fn install_runtime_component(
    app: AppHandle,
    component_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = data_directory(&app, storage_directory)?;
    match component_id.as_str() {
        "yt-dlp" => install_yt_dlp_package(&root),
        _ => Err(format!(
            "Standalone installation is not available for: {component_id}"
        )),
    }
}

pub(crate) fn open_managed_location(
    app: AppHandle,
    target_kind: String,
    target_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = data_directory(&app, storage_directory)?;
    let target = match (target_kind.as_str(), target_id.as_str()) {
        ("dependency", "ffmpeg") => root.join("runtime").join("ffmpeg"),
        ("dependency", "ml-worker") | ("dependency", "yt-dlp") => {
            python_environment_directory(&root)
        }
        ("model", model_id) if model_id.starts_with("whisper-") => model_directory(&root, model_id),
        ("model", model_id) if model_id.starts_with("demucs-") => {
            root.join("models").join("demucs")
        }
        _ => return Err("Unknown managed location".to_string()),
    };
    if !target.exists() {
        return Err(format!(
            "The managed location does not exist: {}",
            target.display()
        ));
    }

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = Command::new("explorer");
        command.arg(&target);
        command
    };
    #[cfg(target_os = "macos")]
    let mut command = {
        let mut command = Command::new("open");
        command.arg(&target);
        command
    };
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut command = Command::new("xdg-open");
        command.arg(&target);
        command
    };

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Unable to open {}: {error}", target.display()))
}

pub(crate) fn remove_runtime_component(
    app: AppHandle,
    component_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = data_directory(&app, storage_directory)?;
    match component_id.as_str() {
        "ffmpeg" => {
            let directory = root.join("runtime").join("ffmpeg");
            if directory.exists() {
                fs::remove_dir_all(&directory).map_err(|error| {
                    format!("Unable to remove {}: {error}", directory.display())
                })?;
            }
        }
        "ml-worker" | "yt-dlp" => {
            let package = if component_id == "ml-worker" {
                "karaoke-worker"
            } else {
                "yt-dlp"
            };
            let mut command = uv_command(&root);
            let output = command
                .arg("pip")
                .arg("uninstall")
                .arg("--python")
                .arg(environment_python(&root))
                .arg(package)
                .output()
                .map_err(|error| format!("Unable to remove {package}: {error}"))?;
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
            }
        }
        _ => return Err(format!("Unknown runtime component: {component_id}")),
    }
    Ok(())
}

pub(crate) fn list_models(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<ModelStatus>, String> {
    let root = data_directory(&app, storage_directory)?;
    let mut models = whisper_models()
        .iter()
        .map(|model| ModelStatus {
            id: model.id.to_string(),
            name: model.name.to_string(),
            category: "Speech Recognition".to_string(),
            kind: "whisper".to_string(),
            size_label: model.size_label.to_string(),
            installed: model_installed(&model_directory(&root, model.id), model),
        })
        .collect::<Vec<_>>();
    models.extend(demucs_models().iter().map(|model| ModelStatus {
        id: model.id.to_string(),
        name: model.name.to_string(),
        category: "Stem Separation".to_string(),
        kind: "demucs".to_string(),
        size_label: model.size_label.to_string(),
        installed: demucs_model_installed(&root, model),
    }));
    Ok(models)
}

pub(crate) fn start_model_download(
    app: AppHandle,
    model_id: String,
    storage_directory: Option<String>,
) -> Result<String, String> {
    if let Ok(model) = find_model(&model_id) {
        return start_whisper_model_download(app, model, storage_directory);
    }
    let model = find_demucs_model(&model_id)?;
    let root = data_directory(&app, storage_directory)?;
    let job_id = format!("model-{}", model.id);
    let task_job_id = job_id.clone();
    emit_progress(&app, &job_id, model.id, "started", 1.0, 0, None);
    append_install_log(&root, &format!("START {} model", model.id));

    thread::spawn(move || {
        let result = (|| -> Result<(), String> {
            if !command_succeeds(&environment_python(&root), &["--version"]) {
                return Err("The private Python runtime is not installed".to_string());
            }
            emit_progress(&app, &task_job_id, model.id, "downloading", 10.0, 0, None);
            let mut command = python_command(&root);
            command.env(
                "TORCH_HOME",
                root.join("models").join("demucs").join(model.id),
            );
            command.arg("-c").arg(format!(
                "from demucs.pretrained import get_model; get_model('{}')",
                model.model_name
            ));
            run_logged_command(
                &app,
                &root,
                &task_job_id,
                model.id,
                10.0,
                98.0,
                "Demucs model download",
                &mut command,
            )?;
            mark_demucs_model_installed(&root, &model)?;
            emit_progress(&app, &task_job_id, model.id, "completed", 100.0, 0, None);
            Ok(())
        })();

        match result {
            Ok(()) => append_install_log(&root, &format!("COMPLETE {} model", model.id)),
            Err(message) => {
                append_install_log(&root, &format!("FAILED {} {message}", model.id));
                emit_failure(&app, &task_job_id, model.id, "model-download", message);
            }
        }
    });
    Ok(job_id)
}

fn start_whisper_model_download(
    app: AppHandle,
    model: ModelDefinition,
    storage_directory: Option<String>,
) -> Result<String, String> {
    let root = data_directory(&app, storage_directory)?;
    let job_id = format!("model-{}", model.id);
    let task_job_id = job_id.clone();
    emit_progress(&app, &job_id, model.id, "started", 1.0, 0, None);
    append_install_log(&root, &format!("START {} model", model.id));

    thread::spawn(move || {
        let result = (|| -> Result<(), String> {
            let client = build_client()?;
            let plans = plan_model_files(&root, &model)?;
            install_model(
                &app,
                &task_job_id,
                &client,
                &root,
                &model,
                &plans,
                1.0,
                98.0,
            )?;
            emit_progress(&app, &task_job_id, model.id, "completed", 100.0, 0, None);
            Ok(())
        })();

        match result {
            Ok(()) => append_install_log(&root, &format!("COMPLETE {} model", model.id)),
            Err(message) => {
                append_install_log(&root, &format!("FAILED {} {message}", model.id));
                emit_failure(&app, &task_job_id, model.id, "model-download", message);
            }
        }
    });
    Ok(job_id)
}

pub(crate) fn remove_model(
    app: AppHandle,
    model_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = data_directory(&app, storage_directory)?;
    let target = if find_model(&model_id).is_ok() {
        model_directory(&root, &model_id)
    } else {
        find_demucs_model(&model_id)?;
        let marker = demucs_model_marker(&root, &model_id);
        if marker.exists() {
            fs::remove_file(&marker)
                .map_err(|error| format!("Unable to remove {}: {error}", marker.display()))?;
        }
        if model_id == "demucs-htdemucs" {
            let legacy_hub = root.join("models").join("demucs").join("hub");
            if legacy_hub.exists() {
                fs::remove_dir_all(&legacy_hub).map_err(|error| {
                    format!("Unable to remove {}: {error}", legacy_hub.display())
                })?;
            }
        }
        root.join("models").join("demucs").join(&model_id)
    };
    if target.exists() {
        fs::remove_dir_all(&target)
            .map_err(|error| format!("Unable to remove {}: {error}", target.display()))?;
    }
    Ok(())
}

pub(crate) fn start_runtime_install(
    app: AppHandle,
    model_id: String,
    storage_directory: Option<String>,
) -> Result<String, String> {
    if RUNTIME_INSTALL_RUNNING
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("The runtime installation is already running".to_string());
    }

    let model = match find_model(&model_id) {
        Ok(model) => model,
        Err(error) => {
            RUNTIME_INSTALL_RUNNING.store(false, Ordering::Release);
            return Err(error);
        }
    };
    let root = match data_directory(&app, storage_directory) {
        Ok(root) => root,
        Err(error) => {
            RUNTIME_INSTALL_RUNNING.store(false, Ordering::Release);
            return Err(error);
        }
    };
    append_install_log(
        &root,
        &format!("START {RUNTIME_INSTALL_JOB_ID} {}", model.id),
    );
    emit_progress(&app, RUNTIME_INSTALL_JOB_ID, "uv", "started", 1.0, 0, None);

    thread::spawn(move || {
        let result = install_runtime(&app, &root, &model);
        match result {
            Ok(()) => append_install_log(&root, &format!("COMPLETE {RUNTIME_INSTALL_JOB_ID}")),
            Err(message) => {
                append_install_log(&root, &format!("FAILED {RUNTIME_INSTALL_JOB_ID} {message}"));
                emit_failure(
                    &app,
                    RUNTIME_INSTALL_JOB_ID,
                    "runtime",
                    "runtime-install",
                    message,
                );
            }
        }
        RUNTIME_INSTALL_RUNNING.store(false, Ordering::Release);
    });
    Ok(RUNTIME_INSTALL_JOB_ID.to_string())
}

pub(crate) fn clear_downloaded_data(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = data_directory(&app, storage_directory.clone())?;
    for directory in ["runtime", "models", "cache"] {
        let target = root.join(directory);
        if target.exists() {
            fs::remove_dir_all(&target)
                .map_err(|error| format!("Unable to remove {}: {error}", target.display()))?;
        }
    }
    let runtime_state = root.join("config").join("runtime-state.json");
    if runtime_state.exists() {
        fs::remove_file(&runtime_state)
            .map_err(|error| format!("Unable to remove {}: {error}", runtime_state.display()))?;
    }
    bootstrap_app(app, storage_directory)?;
    Ok(())
}

pub(crate) fn bootstrap_app(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<BootstrapReport, String> {
    let root = data_directory(&app, storage_directory)?;
    let runtime_directories = [
        "runtime/tools",
        "runtime/python",
        "runtime/python-environment",
        "runtime/ffmpeg",
        "models/demucs",
        "models/whisper",
        "cache/downloads",
        "cache/staging",
        "cache/uv",
        "cache/huggingface",
        "cache/matplotlib",
        "cache/python",
        "projects",
        "config",
    ];
    let directories = runtime_directories
        .iter()
        .map(|relative_path| {
            let directory = root.join(relative_path);
            fs::create_dir_all(&directory)
                .map_err(|error| format!("Unable to create {}: {error}", directory.display()))?;
            Ok(directory.display().to_string())
        })
        .collect::<Result<Vec<_>, String>>()?;

    Ok(BootstrapReport {
        data_directory: root.display().to_string(),
        directories,
        operating_system: std::env::consts::OS.to_string(),
        architecture: std::env::consts::ARCH.to_string(),
        runtime_profile: "cpu".to_string(),
    })
}
