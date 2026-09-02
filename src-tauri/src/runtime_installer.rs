use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter, Manager};
use zip::ZipArchive;

const APP_DIRECTORY_NAME: &str = "KaraokAI";
const INSTALL_PROGRESS_EVENT: &str = "runtime-install-progress";
const RUNTIME_INSTALL_JOB_ID: &str = "runtime-bootstrap";
const RUNTIME_RELEASE_TAG: &str = "runtime-v0.1.3";
const RELEASE_BASE_URL: &str = "https://github.com/TramontaG/Karaokai/releases/download";
const WHISPER_FILES: [&str; 4] = [
    "config.json",
    "model.bin",
    "tokenizer.json",
    "vocabulary.txt",
];
const RUNTIME_COMPONENTS: [&str; 3] = ["ffmpeg", "ml-worker", "demucs-htdemucs"];

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
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ModelStatus {
    id: String,
    name: String,
    category: String,
    size_label: String,
    installed: bool,
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

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeManifest {
    version: u32,
    release_tag: String,
    assets: Vec<RuntimeAsset>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeAsset {
    id: String,
    version: String,
    asset: String,
    sha256: String,
    size: u64,
    platform: String,
    architecture: String,
    format: String,
    install_directory: String,
}

struct ModelFilePlan {
    url: String,
    destination: PathBuf,
    size: u64,
}

struct ByteProgress {
    completed: u64,
    total: u64,
    start: f64,
    span: f64,
}

impl ByteProgress {
    fn percentage(&self, current_file_bytes: u64) -> f64 {
        if self.total == 0 {
            return self.start + self.span;
        }

        let completed = self.completed.saturating_add(current_file_bytes);
        let fraction = completed as f64 / self.total as f64;
        (self.start + fraction * self.span).min(self.start + self.span)
    }

    fn finish_file(&mut self, size: u64) {
        self.completed = self.completed.saturating_add(size).min(self.total);
    }
}

fn whisper_models() -> [ModelDefinition; 5] {
    [
        ModelDefinition {
            id: "whisper-tiny",
            name: "Whisper Tiny",
            repository: "Systran/faster-whisper-tiny",
            revision: "d90ca5fe260221311c53c58e660288d3deb8d356",
            size_label: "~78 MB",
        },
        ModelDefinition {
            id: "whisper-base",
            name: "Whisper Base",
            repository: "Systran/faster-whisper-base",
            revision: "ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66",
            size_label: "~145 MB",
        },
        ModelDefinition {
            id: "whisper-small",
            name: "Whisper Small",
            repository: "Systran/faster-whisper-small",
            revision: "536b0662742c02347bc0e980a01041f333bce120",
            size_label: "~465 MB",
        },
        ModelDefinition {
            id: "whisper-medium",
            name: "Whisper Medium",
            repository: "Systran/faster-whisper-medium",
            revision: "08e178d48790749d25932bbc082711ddcfdfbc4f",
            size_label: "~1.5 GB",
        },
        ModelDefinition {
            id: "whisper-large-v3",
            name: "Whisper Large v3",
            repository: "Systran/faster-whisper-large-v3",
            revision: "edaa852ec7e145841d8ffdb056a99866b5f0a478",
            size_label: "~3.1 GB",
        },
    ]
}

fn find_model(model_id: &str) -> Result<ModelDefinition, String> {
    whisper_models()
        .into_iter()
        .find(|model| model.id == model_id)
        .ok_or_else(|| format!("Unknown model: {model_id}"))
}

fn data_directory(
    app: &AppHandle,
    storage_directory: Option<String>,
) -> Result<PathBuf, String> {
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

fn model_installed(directory: &Path) -> bool {
    WHISPER_FILES.iter().all(|file| {
        directory
            .join(file)
            .metadata()
            .map(|metadata| metadata.is_file() && metadata.len() > 0)
            .unwrap_or(false)
    })
}

fn runtime_target(root: &Path, component_id: &str) -> Result<PathBuf, String> {
    match component_id {
        "ffmpeg" => Ok(root.join("runtime").join("ffmpeg")),
        "ml-worker" => Ok(root.join("runtime").join("workers")),
        "demucs-htdemucs" => Ok(root.join("models").join("demucs").join("htdemucs")),
        _ => Err(format!("Unknown runtime component: {component_id}")),
    }
}

fn expected_install_directory(component_id: &str) -> Result<&'static str, String> {
    match component_id {
        "ffmpeg" => Ok("runtime/ffmpeg"),
        "ml-worker" => Ok("runtime/workers"),
        "demucs-htdemucs" => Ok("models/demucs/htdemucs"),
        _ => Err(format!("Unknown runtime component: {component_id}")),
    }
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

fn emit_failure(
    app: &AppHandle,
    job_id: &str,
    component_id: &str,
    stage: &str,
    message: String,
) {
    let event = InstallEvent {
        job_id: job_id.to_string(),
        component_id: component_id.to_string(),
        stage: "failed".to_string(),
        progress: 0.0,
        completed_bytes: 0,
        total_bytes: None,
        message: "runtime".to_string(),
        error: Some(InstallError {
            code: "DOWNLOAD_FAILED".to_string(),
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

    let log_path = log_directory.join("runtime-installer.log");
    if let Ok(mut log) = OpenOptions::new().create(true).append(true).open(log_path) {
        let _ = writeln!(log, "{message}");
    }
}

fn validate_remote_name(value: &str, field: &str) -> Result<(), String> {
    if value.is_empty()
        || !value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || ".-_".contains(character))
    {
        return Err(format!("Invalid {field} in runtime manifest: {value}"));
    }
    Ok(())
}

fn manifest_url() -> String {
    format!(
        "{RELEASE_BASE_URL}/{RUNTIME_RELEASE_TAG}/runtime-manifest.json"
    )
}

fn runtime_asset_url(asset: &RuntimeAsset) -> Result<String, String> {
    validate_remote_name(&asset.version, "asset version")?;
    validate_remote_name(&asset.asset, "asset filename")?;
    Ok(format!(
        "{RELEASE_BASE_URL}/{}/{}",
        asset.version, asset.asset
    ))
}

fn fetch_runtime_manifest(client: &Client) -> Result<RuntimeManifest, String> {
    let url = manifest_url();
    let mut response = client
        .get(&url)
        .send()
        .map_err(|error| format!("Unable to download the runtime manifest: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Unable to download the runtime manifest: {error}"))?;
    let mut body = String::new();
    response
        .read_to_string(&mut body)
        .map_err(|error| format!("Unable to read the runtime manifest: {error}"))?;
    let manifest: RuntimeManifest = serde_json::from_str(&body)
        .map_err(|error| format!("Invalid runtime manifest: {error}"))?;

    if manifest.version != 1 {
        return Err(format!(
            "Unsupported runtime manifest version: {}",
            manifest.version
        ));
    }
    if manifest.release_tag != RUNTIME_RELEASE_TAG {
        return Err(format!(
            "Runtime manifest tag mismatch: expected {RUNTIME_RELEASE_TAG}, received {}",
            manifest.release_tag
        ));
    }

    Ok(manifest)
}

fn select_runtime_assets(manifest: &RuntimeManifest) -> Result<Vec<RuntimeAsset>, String> {
    let platform = std::env::consts::OS;
    let architecture = std::env::consts::ARCH;

    RUNTIME_COMPONENTS
        .iter()
        .map(|component_id| {
            let asset = manifest
                .assets
                .iter()
                .filter(|asset| {
                    asset.id == *component_id
                        && (asset.platform == platform || asset.platform == "any")
                        && (asset.architecture == architecture || asset.architecture == "any")
                })
                .max_by_key(|asset| {
                    u8::from(asset.platform == platform) * 2
                        + u8::from(asset.architecture == architecture)
                })
                .cloned()
                .ok_or_else(|| {
                    format!(
                        "The runtime release does not provide {component_id} for {platform}/{architecture}"
                    )
                })?;

            validate_runtime_asset(&asset)?;
            Ok(asset)
        })
        .collect()
}

fn validate_runtime_asset(asset: &RuntimeAsset) -> Result<(), String> {
    validate_remote_name(&asset.asset, "asset filename")?;
    validate_remote_name(&asset.version, "asset version")?;
    if asset.version != RUNTIME_RELEASE_TAG {
        return Err(format!("Unexpected version for runtime asset {}", asset.id));
    }
    if asset.format != "zip" {
        return Err(format!("Unsupported archive format for {}", asset.id));
    }
    if asset.size == 0 {
        return Err(format!("Invalid size for runtime asset {}", asset.id));
    }
    if asset.sha256.len() != 64
        || !asset
            .sha256
            .chars()
            .all(|character| character.is_ascii_hexdigit())
    {
        return Err(format!("Invalid SHA-256 for runtime asset {}", asset.id));
    }
    if asset.install_directory != expected_install_directory(&asset.id)? {
        return Err(format!(
            "Unexpected installation directory for runtime asset {}",
            asset.id
        ));
    }
    Ok(())
}

fn whisper_url(model: &ModelDefinition, file: &str) -> String {
    format!(
        "https://huggingface.co/{}/resolve/{}/{file}",
        model.repository, model.revision
    )
}

fn remote_file_size(client: &Client, url: &str) -> Result<u64, String> {
    let response = client
        .head(url)
        .send()
        .map_err(|error| format!("Unable to inspect download: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Unable to inspect download: {error}"))?;
    response
        .content_length()
        .filter(|size| *size > 0)
        .ok_or_else(|| "The download server did not provide a file size".to_string())
}

fn plan_model_files(
    client: &Client,
    root: &Path,
    model: &ModelDefinition,
) -> Result<Vec<ModelFilePlan>, String> {
    let directory = model_directory(root, model.id);
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create {}: {error}", directory.display()))?;

    WHISPER_FILES
        .iter()
        .map(|file| {
            let url = whisper_url(model, file);
            let size = remote_file_size(client, &url)
                .map_err(|error| format!("Unable to inspect {file}: {error}"))?;
            Ok(ModelFilePlan {
                url,
                destination: directory.join(file),
                size,
            })
        })
        .collect()
}

fn valid_file(path: &Path, expected_size: u64) -> bool {
    path.metadata()
        .map(|metadata| metadata.is_file() && metadata.len() == expected_size)
        .unwrap_or(false)
}

fn partial_path(destination: &Path) -> Result<PathBuf, String> {
    let filename = destination
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| format!("Invalid destination: {}", destination.display()))?;
    Ok(destination.with_file_name(format!("{filename}.part")))
}

fn download_to<F>(
    client: &Client,
    url: &str,
    destination: &Path,
    expected_size: u64,
    mut on_progress: F,
) -> Result<(), String>
where
    F: FnMut(u64),
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
    let response_size = response.content_length().unwrap_or(expected_size);
    if response_size != expected_size {
        return Err(format!(
            "Unexpected download size for {url}: expected {expected_size}, received {response_size}"
        ));
    }

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

        if last_event.elapsed() >= Duration::from_millis(100) || completed == expected_size {
            on_progress(completed);
            last_event = Instant::now();
        }
    }

    output
        .flush()
        .map_err(|error| format!("Unable to finish {}: {error}", partial.display()))?;
    if completed != expected_size {
        return Err(format!(
            "Incomplete download for {url}: expected {expected_size}, received {completed}"
        ));
    }

    if destination.exists() {
        fs::remove_file(destination)
            .map_err(|error| format!("Unable to replace {}: {error}", destination.display()))?;
    }
    fs::rename(&partial, destination)
        .map_err(|error| format!("Unable to activate {}: {error}", destination.display()))?;
    Ok(())
}

fn install_model(
    app: &AppHandle,
    job_id: &str,
    client: &Client,
    model: &ModelDefinition,
    plans: &[ModelFilePlan],
    progress: &mut ByteProgress,
) -> Result<(), String> {
    for plan in plans {
        if valid_file(&plan.destination, plan.size) {
            continue;
        }

        emit_progress(
            app,
            job_id,
            model.id,
            "downloading",
            progress.percentage(0),
            progress.completed,
            Some(progress.total),
        );
        download_to(
            client,
            &plan.url,
            &plan.destination,
            plan.size,
            |downloaded| {
                emit_progress(
                    app,
                    job_id,
                    model.id,
                    "downloading",
                    progress.percentage(downloaded),
                    progress.completed.saturating_add(downloaded),
                    Some(progress.total),
                );
            },
        )?;
        progress.finish_file(plan.size);
    }

    if !plans
        .iter()
        .all(|plan| valid_file(&plan.destination, plan.size))
    {
        return Err(format!("Model {} did not pass installation validation", model.id));
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

fn valid_cached_asset(path: &Path, asset: &RuntimeAsset) -> bool {
    valid_file(path, asset.size)
        && sha256(path)
            .map(|checksum| checksum.eq_ignore_ascii_case(&asset.sha256))
            .unwrap_or(false)
}

fn verify_asset(path: &Path, asset: &RuntimeAsset) -> Result<(), String> {
    let metadata = path
        .metadata()
        .map_err(|error| format!("Unable to inspect {}: {error}", path.display()))?;
    if metadata.len() != asset.size {
        return Err(format!(
            "Size verification failed for {}: expected {}, received {}",
            asset.asset,
            asset.size,
            metadata.len()
        ));
    }
    let checksum = sha256(path)?;
    if !checksum.eq_ignore_ascii_case(&asset.sha256) {
        return Err(format!("SHA-256 verification failed for {}", asset.asset));
    }
    Ok(())
}

fn extract_archive(archive_path: &Path, destination: &Path) -> Result<(), String> {
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
            return Err(format!("Symbolic links are not allowed in runtime archives: {}", entry.name()));
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

        #[cfg(unix)]
        if let Some(mode) = entry.unix_mode() {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&output_path, fs::Permissions::from_mode(mode & 0o777))
                .map_err(|error| format!("Unable to set permissions on {}: {error}", output_path.display()))?;
        }
    }
    Ok(())
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

        let filename = path.file_name().and_then(|name| name.to_str()).unwrap_or("");
        let extension = path.extension().and_then(|value| value.to_str()).unwrap_or("");
        if names.contains(&filename) || extensions.contains(&extension) {
            return Some(path);
        }
    }
    None
}

fn component_binary(directory: &Path, component_id: &str) -> Option<PathBuf> {
    match component_id {
        "ffmpeg" => find_file(directory, &["ffmpeg", "ffmpeg.exe"], &[]),
        "ml-worker" => find_file(
            directory,
            &["karaoke-worker", "karaoke-worker.exe"],
            &[],
        ),
        _ => None,
    }
}

fn validate_component(directory: &Path, component_id: &str) -> Result<(), String> {
    match component_id {
        "ffmpeg" | "ml-worker" => {
            component_binary(directory, component_id).ok_or_else(|| {
                format!("The {component_id} archive does not contain its executable")
            })?;
        }
        "demucs-htdemucs" => {
            find_file(directory, &[], &["th", "ckpt"])
                .ok_or_else(|| "The HTDemucs archive does not contain model weights".to_string())?;
        }
        _ => return Err(format!("Unknown runtime component: {component_id}")),
    }
    Ok(())
}

fn validate_component_health(directory: &Path, component_id: &str) -> Result<(), String> {
    validate_component(directory, component_id)?;
    let (binary, argument) = match component_id {
        "ffmpeg" => (component_binary(directory, component_id), "-version"),
        "ml-worker" => (component_binary(directory, component_id), "--healthcheck"),
        "demucs-htdemucs" => return Ok(()),
        _ => return Err(format!("Unknown runtime component: {component_id}")),
    };
    let binary = binary.ok_or_else(|| format!("Missing executable for {component_id}"))?;
    let output = Command::new(&binary)
        .arg(argument)
        .output()
        .map_err(|error| format!("Unable to start {}: {error}", binary.display()))?;
    if !output.status.success() {
        return Err(format!("The {component_id} healthcheck failed"));
    }
    if component_id == "ml-worker" {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let healthy = stdout.lines().any(|line| {
            serde_json::from_str::<serde_json::Value>(line)
                .ok()
                .and_then(|value| value.get("status").cloned())
                .and_then(|status| status.as_str().map(|value| value == "ready"))
                .unwrap_or(false)
        });
        if !healthy {
            return Err("The ML worker returned an invalid healthcheck response".to_string());
        }
    }
    Ok(())
}

#[cfg(unix)]
fn make_component_executable(directory: &Path, component_id: &str) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;

    if let Some(binary) = component_binary(directory, component_id) {
        let mut permissions = binary
            .metadata()
            .map_err(|error| format!("Unable to inspect {}: {error}", binary.display()))?
            .permissions();
        permissions.set_mode(permissions.mode() | 0o700);
        fs::set_permissions(&binary, permissions)
            .map_err(|error| format!("Unable to make {} executable: {error}", binary.display()))?;
    }
    Ok(())
}

#[cfg(not(unix))]
fn make_component_executable(_directory: &Path, _component_id: &str) -> Result<(), String> {
    Ok(())
}

fn activate_directory(staging: &Path, target: &Path) -> Result<(), String> {
    let backup = target.with_extension("backup");
    if backup.exists() {
        fs::remove_dir_all(&backup)
            .map_err(|error| format!("Unable to remove {}: {error}", backup.display()))?;
    }
    if target.exists() {
        fs::rename(target, &backup)
            .map_err(|error| format!("Unable to back up {}: {error}", target.display()))?;
    }

    if let Err(error) = fs::rename(staging, target) {
        if backup.exists() {
            let _ = fs::rename(&backup, target);
        }
        return Err(format!("Unable to activate {}: {error}", target.display()));
    }

    if backup.exists() {
        fs::remove_dir_all(&backup)
            .map_err(|error| format!("Unable to remove {}: {error}", backup.display()))?;
    }
    Ok(())
}

fn install_runtime_asset(root: &Path, archive: &Path, asset: &RuntimeAsset) -> Result<(), String> {
    let staging = root.join("cache").join("staging").join(&asset.id);
    if staging.exists() {
        fs::remove_dir_all(&staging)
            .map_err(|error| format!("Unable to clear {}: {error}", staging.display()))?;
    }
    extract_archive(archive, &staging)?;
    validate_component(&staging, &asset.id)?;
    make_component_executable(&staging, &asset.id)?;

    let target = runtime_target(root, &asset.id)?;
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Unable to create {}: {error}", parent.display()))?;
    }
    activate_directory(&staging, &target)?;
    validate_component_health(&target, &asset.id)
}

fn runtime_components_installed(root: &Path) -> bool {
    RUNTIME_COMPONENTS.iter().all(|component_id| {
        runtime_target(root, component_id)
            .and_then(|directory| validate_component_health(&directory, component_id))
            .is_ok()
    })
}

fn install_runtime(
    app: &AppHandle,
    root: &Path,
    model: &ModelDefinition,
) -> Result<(), String> {
    if model_installed(&model_directory(root, model.id)) && runtime_components_installed(root) {
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
    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "manifest",
        "started",
        1.0,
        0,
        None,
    );
    let manifest = fetch_runtime_manifest(&client)?;
    let assets = select_runtime_assets(&manifest)?;
    let model_plans = plan_model_files(&client, root, model)?;
    let missing_model_bytes = model_plans
        .iter()
        .filter(|plan| !valid_file(&plan.destination, plan.size))
        .map(|plan| plan.size)
        .sum::<u64>();
    let downloads_directory = root.join("cache").join("downloads");
    fs::create_dir_all(&downloads_directory).map_err(|error| {
        format!(
            "Unable to create {}: {error}",
            downloads_directory.display()
        )
    })?;
    let missing_asset_bytes = assets
        .iter()
        .filter(|asset| {
            let target = runtime_target(root, &asset.id).ok();
            let installed = target
                .as_deref()
                .map(|directory| validate_component_health(directory, &asset.id).is_ok())
                .unwrap_or(false);
            let cached = downloads_directory.join(&asset.asset);
            !installed && !valid_cached_asset(&cached, asset)
        })
        .map(|asset| asset.size)
        .sum::<u64>();
    let mut progress = ByteProgress {
        completed: 0,
        total: missing_model_bytes.saturating_add(missing_asset_bytes),
        start: 2.0,
        span: 92.0,
    };

    install_model(
        app,
        RUNTIME_INSTALL_JOB_ID,
        &client,
        model,
        &model_plans,
        &mut progress,
    )?;

    for (index, asset) in assets.iter().enumerate() {
        let target = runtime_target(root, &asset.id)?;
        if validate_component_health(&target, &asset.id).is_ok() {
            continue;
        }

        let archive = downloads_directory.join(&asset.asset);
        if !valid_cached_asset(&archive, asset) {
            let url = runtime_asset_url(asset)?;
            emit_progress(
                app,
                RUNTIME_INSTALL_JOB_ID,
                &asset.id,
                "downloading",
                progress.percentage(0),
                progress.completed,
                Some(progress.total),
            );
            download_to(&client, &url, &archive, asset.size, |downloaded| {
                emit_progress(
                    app,
                    RUNTIME_INSTALL_JOB_ID,
                    &asset.id,
                    "downloading",
                    progress.percentage(downloaded),
                    progress.completed.saturating_add(downloaded),
                    Some(progress.total),
                );
            })?;
            progress.finish_file(asset.size);
        }
        verify_asset(&archive, asset)?;

        let extraction_progress = 95.0 + index as f64;
        emit_progress(
            app,
            RUNTIME_INSTALL_JOB_ID,
            &asset.id,
            "installing",
            extraction_progress,
            progress.completed,
            Some(progress.total),
        );
        install_runtime_asset(root, &archive, asset)?;
    }

    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "validating",
        "installing",
        99.0,
        progress.completed,
        Some(progress.total),
    );
    if !model_installed(&model_directory(root, model.id)) {
        return Err(format!("Model {} is not installed", model.id));
    }
    if !runtime_components_installed(root) {
        return Err("The runtime did not pass final validation".to_string());
    }

    fs::write(
        root.join("config").join("runtime-version"),
        format!("{}\n", manifest.release_tag),
    )
    .map_err(|error| format!("Unable to save the runtime version: {error}"))?;
    emit_progress(
        app,
        RUNTIME_INSTALL_JOB_ID,
        "runtime",
        "completed",
        100.0,
        progress.total,
        Some(progress.total),
    );
    Ok(())
}

pub(crate) fn list_models(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<ModelStatus>, String> {
    let root = data_directory(&app, storage_directory)?;
    Ok(whisper_models()
        .iter()
        .map(|model| ModelStatus {
            id: model.id.to_string(),
            name: model.name.to_string(),
            category: "Speech Recognition".to_string(),
            size_label: model.size_label.to_string(),
            installed: model_installed(&model_directory(&root, model.id)),
        })
        .collect())
}

pub(crate) fn start_model_download(
    app: AppHandle,
    model_id: String,
    storage_directory: Option<String>,
) -> Result<String, String> {
    let model = find_model(&model_id)?;
    let root = data_directory(&app, storage_directory)?;
    let job_id = format!("model-{}", model.id);
    let task_job_id = job_id.clone();
    emit_progress(&app, &job_id, model.id, "started", 1.0, 0, None);
    append_install_log(&root, &format!("START {} model", model.id));

    std::thread::spawn(move || {
        let result = (|| -> Result<(), String> {
            let client = build_client()?;
            let plans = plan_model_files(&client, &root, &model)?;
            let total = plans
                .iter()
                .filter(|plan| !valid_file(&plan.destination, plan.size))
                .map(|plan| plan.size)
                .sum();
            let mut progress = ByteProgress {
                completed: 0,
                total,
                start: 1.0,
                span: 98.0,
            };
            install_model(
                &app,
                &task_job_id,
                &client,
                &model,
                &plans,
                &mut progress,
            )?;
            emit_progress(
                &app,
                &task_job_id,
                model.id,
                "completed",
                100.0,
                progress.total,
                Some(progress.total),
            );
            Ok(())
        })();

        match result {
            Ok(()) => append_install_log(&root, &format!("COMPLETE {} model", model.id)),
            Err(message) => {
                append_install_log(&root, &format!("FAILED {} {message}", model.id));
                emit_failure(
                    &app,
                    &task_job_id,
                    model.id,
                    "model-download",
                    message,
                );
            }
        }
    });
    Ok(job_id)
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
    append_install_log(&root, &format!("START {RUNTIME_INSTALL_JOB_ID} {}", model.id));
    emit_progress(
        &app,
        RUNTIME_INSTALL_JOB_ID,
        "manifest",
        "started",
        1.0,
        0,
        None,
    );

    std::thread::spawn(move || {
        let result = install_runtime(&app, &root, &model);
        match result {
            Ok(()) => append_install_log(&root, &format!("COMPLETE {RUNTIME_INSTALL_JOB_ID}")),
            Err(message) => {
                append_install_log(
                    &root,
                    &format!("FAILED {RUNTIME_INSTALL_JOB_ID} {message}"),
                );
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
    let runtime_version = root.join("config").join("runtime-version");
    if runtime_version.exists() {
        fs::remove_file(&runtime_version).map_err(|error| {
            format!("Unable to remove {}: {error}", runtime_version.display())
        })?;
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
        "runtime/ffmpeg",
        "runtime/workers",
        "models/demucs",
        "models/whisper",
        "cache/downloads",
        "cache/staging",
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
