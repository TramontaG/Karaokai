use crate::runtime_installer::{
    project_data_directory, project_ffmpeg_command, project_pipeline_models, project_python_command,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    fs,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{Mutex, OnceLock},
    thread,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter};

static PROCESSING_QUEUE: OnceLock<Mutex<()>> = OnceLock::new();

#[derive(Default)]
pub(crate) struct ProjectAudioSourceRegistry(Mutex<HashMap<String, PathBuf>>);

impl ProjectAudioSourceRegistry {
    pub(crate) fn register(&self, project_id: &str, file_name: &str, path: PathBuf) -> String {
        let key = format!("{project_id}/{file_name}");
        if let Ok(mut sources) = self.0.lock() {
            sources.insert(key.clone(), path);
        }
        key
    }

    pub(crate) fn get(&self, key: &str) -> Option<PathBuf> {
        self.0.lock().ok()?.get(key).cloned()
    }
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Project {
    version: u8,
    id: String,
    name: String,
    created_at: String,
    updated_at: String,
    duration: u64,
    thumbnail: Option<String>,
    tracks: Vec<Value>,
    processing: Vec<Value>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectSummary {
    id: String,
    name: String,
    duration: u64,
    size_bytes: u64,
    created_at: String,
    updated_at: String,
    processing: Vec<Value>,
    thumbnail: Option<String>,
}

fn directory_size(path: &Path) -> u64 {
    fs::read_dir(path)
        .ok()
        .into_iter()
        .flatten()
        .filter_map(Result::ok)
        .map(|entry| {
            let path = entry.path();
            match fs::symlink_metadata(&path) {
                Ok(metadata) if metadata.is_file() => metadata.len(),
                Ok(metadata) if metadata.is_dir() => directory_size(&path),
                _ => 0,
            }
        })
        .sum()
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectAudioSources {
    instrumental: Option<String>,
    vocals: Option<String>,
}

fn project_directory(root: &Path, project_id: &str) -> Result<PathBuf, String> {
    if project_id.is_empty()
        || !project_id
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '-')
    {
        return Err("Invalid project id".to_string());
    }
    Ok(root.join("projects").join(project_id))
}

fn epoch_millis() -> Result<u128, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .map_err(|error| error.to_string())
}

fn source_extension(source: &Path) -> Result<&str, String> {
    source
        .extension()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "The audio file must have an extension".to_string())
}

pub(crate) fn create_local_project(
    app: AppHandle,
    source_path: String,
    storage_directory: Option<String>,
    whisper_model_id: String,
    demucs_model_id: String,
) -> Result<Project, String> {
    let source = PathBuf::from(source_path);
    if !source.is_file() {
        return Err("The selected audio file does not exist".to_string());
    }
    let root = project_data_directory(&app, storage_directory)?;
    let timestamp = epoch_millis()?;
    let id = format!("project-{timestamp}");
    let directory = project_directory(&root, &id)?;
    let audio = directory.join("audio");
    fs::create_dir_all(directory.join("assets")).map_err(|error| error.to_string())?;
    fs::create_dir_all(directory.join("thumbnails")).map_err(|error| error.to_string())?;
    fs::create_dir_all(directory.join("cache")).map_err(|error| error.to_string())?;
    fs::create_dir_all(&audio).map_err(|error| error.to_string())?;
    let copied_source = audio.join(format!("source.{}", source_extension(&source)?));
    fs::copy(&source, &copied_source).map_err(|error| format!("Unable to copy audio: {error}"))?;
    let name = source
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("Untitled")
        .to_string();
    let now = timestamp.to_string();
    let project = Project {
        version: 1,
        id,
        name,
        created_at: now.clone(),
        updated_at: now,
        duration: 0,
        thumbnail: None,
        tracks: vec![
            json!({"id":"background-main","type":"background","name":"Background","visible":true,"locked":false,"zIndex":-10,"source":"solid-color"}),
            json!({"id":"audio-main","type":"audio","name":"Instrumental","visible":true,"locked":false,"zIndex":0,"source":copied_source.file_name().unwrap_or_default().to_string_lossy(),"volume":1.0,"muted":false}),
        ],
        processing: vec![
            json!({"id":"import","status":"completed"}),
            json!({"id":"separation","status":"pending", "modelId": demucs_model_id}),
            json!({"id":"transcription","status":"pending", "modelId": whisper_model_id}),
            json!({"id":"subtitles","status":"pending"}),
        ],
    };
    save_to_directory(&directory, &project)?;
    start_processing(
        app,
        root,
        directory,
        project.id.clone(),
        whisper_model_id,
        demucs_model_id,
    );
    Ok(project)
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProcessingEvent {
    project_id: String,
    stage: String,
    status: String,
    progress: f64,
    message: String,
}

fn emit_processing(
    app: &AppHandle,
    project_id: &str,
    stage: &str,
    status: &str,
    progress: f64,
    message: &str,
) {
    let _ = app.emit(
        "project-processing-progress",
        ProcessingEvent {
            project_id: project_id.to_string(),
            stage: stage.to_string(),
            status: status.to_string(),
            progress,
            message: message.to_string(),
        },
    );
}

fn update_stage(
    directory: &Path,
    stage: &str,
    status: &str,
    progress: f64,
    message: &str,
) -> Result<(), String> {
    let path = directory.join("project.json");
    let content = fs::read(&path).map_err(|error| format!("Unable to read project: {error}"))?;
    let mut project: Value = serde_json::from_slice(&content)
        .map_err(|error| format!("Invalid project file: {error}"))?;
    let stages = project
        .get_mut("processing")
        .and_then(Value::as_array_mut)
        .ok_or_else(|| "Project processing state is missing".to_string())?;
    let entry = stages
        .iter_mut()
        .find(|entry| entry.get("id").and_then(Value::as_str) == Some(stage))
        .ok_or_else(|| format!("Unknown processing stage: {stage}"))?;
    entry["status"] = Value::String(status.to_string());
    entry["progress"] = json!(progress.clamp(0.0, 100.0));
    entry["message"] = Value::String(message.to_string());
    project["updatedAt"] = Value::String(epoch_millis()?.to_string());
    let output = serde_json::to_vec_pretty(&project).map_err(|error| error.to_string())?;
    fs::write(path, output).map_err(|error| format!("Unable to save project: {error}"))
}

fn apply_pipeline_result(directory: &Path) -> Result<(), String> {
    let path = directory.join("project.json");
    let content = fs::read(&path).map_err(|error| format!("Unable to read project: {error}"))?;
    let mut project: Value = serde_json::from_slice(&content)
        .map_err(|error| format!("Invalid project file: {error}"))?;
    let transcription = fs::read(directory.join("cache").join("transcription.json"))
        .map_err(|error| format!("Unable to read transcription: {error}"))?;
    let transcription: Value = serde_json::from_slice(&transcription)
        .map_err(|error| format!("Invalid transcription result: {error}"))?;
    let phrases = transcription
        .get("phrases")
        .cloned()
        .unwrap_or_else(|| json!([]));
    let tracks = project
        .get_mut("tracks")
        .and_then(Value::as_array_mut)
        .ok_or_else(|| "Project tracks are missing".to_string())?;
    if let Some(audio) = tracks
        .iter_mut()
        .find(|track| track.get("id").and_then(Value::as_str) == Some("audio-main"))
    {
        audio["source"] = Value::String("instrumental.wav".to_string());
    }
    tracks.retain(|track| track.get("id").and_then(Value::as_str) != Some("subtitles-main"));
    tracks.push(json!({
        "id": "subtitles-main", "type": "subtitle", "name": "Karaoke", "visible": true,
        "locked": false, "zIndex": 20,
        "style": {"unreadColor": "#FFFFFF", "readColor": "#FF0044", "x": 0, "y": 30},
        "phrases": phrases
    }));
    let duration = transcription
        .get("duration")
        .and_then(Value::as_u64)
        .or_else(|| {
            transcription
                .get("phrases")
                .and_then(Value::as_array)
                .and_then(|phrases| {
                    phrases
                        .iter()
                        .filter_map(|phrase| phrase.get("end").and_then(Value::as_u64))
                        .max()
                })
        })
        .unwrap_or(0);
    project["duration"] = json!(duration);
    project["updatedAt"] = Value::String(epoch_millis()?.to_string());
    let output = serde_json::to_vec_pretty(&project).map_err(|error| error.to_string())?;
    fs::write(path, output).map_err(|error| format!("Unable to save project: {error}"))
}

fn start_processing(
    app: AppHandle,
    root: PathBuf,
    directory: PathBuf,
    project_id: String,
    whisper_model_id: String,
    demucs_model_id: String,
) {
    thread::spawn(move || {
        let _ = update_stage(
            &directory,
            "separation",
            "pending",
            0.0,
            "Queued for audio processing",
        );
        emit_processing(
            &app,
            &project_id,
            "separation",
            "pending",
            0.0,
            "Queued for audio processing",
        );
        let queue = PROCESSING_QUEUE.get_or_init(|| Mutex::new(()));
        let _queue_guard = queue
            .lock()
            .map_err(|_| "Project processing queue is unavailable".to_string());
        let _queue_guard = match _queue_guard {
            Ok(guard) => guard,
            Err(message) => {
                let _ = update_stage(&directory, "separation", "failed", 0.0, &message);
                emit_processing(&app, &project_id, "separation", "failed", 0.0, &message);
                return;
            }
        };
        let result = (|| -> Result<(), String> {
            let (whisper_model_path, demucs_model) =
                project_pipeline_models(&app, &root, &whisper_model_id, &demucs_model_id)?;
            let source = fs::read_dir(directory.join("audio"))
                .map_err(|error| format!("Unable to read project audio: {error}"))?
                .filter_map(Result::ok)
                .map(|entry| entry.path())
                .find(|path| {
                    path.file_name()
                        .and_then(|name| name.to_str())
                        .map(|name| name.starts_with("source."))
                        .unwrap_or(false)
                })
                .ok_or_else(|| "Project source audio is missing".to_string())?;
            update_stage(&directory, "separation", "running", 0.0, "Preparing Demucs")?;
            emit_processing(
                &app,
                &project_id,
                "separation",
                "running",
                0.0,
                "Preparing Demucs",
            );
            let mut command = project_python_command(&root);
            command.env(
                "TORCH_HOME",
                root.join("models").join("demucs").join(&demucs_model_id),
            );
            command
                .args(["-m", "karaoke_worker", "--project-pipeline", "--source"])
                .arg(source)
                .args(["--project-directory"])
                .arg(&directory)
                .args(["--demucs-model", &demucs_model, "--whisper-model-path"])
                .arg(whisper_model_path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());
            let mut child = command
                .spawn()
                .map_err(|error| format!("Unable to start project worker: {error}"))?;
            let output = child
                .stdout
                .take()
                .ok_or_else(|| "Unable to read project worker output".to_string())?;
            let reader = BufReader::new(output);
            let mut worker_error: Option<String> = None;
            for line in reader.lines() {
                let line =
                    line.map_err(|error| format!("Unable to read project worker output: {error}"))?;
                let event: Value = match serde_json::from_str(&line) {
                    Ok(event) => event,
                    Err(_) => continue,
                };
                if event.get("type").and_then(Value::as_str) == Some("project.progress") {
                    let stage = event
                        .get("stage")
                        .and_then(Value::as_str)
                        .unwrap_or("separation");
                    let progress = event.get("progress").and_then(Value::as_f64).unwrap_or(0.0);
                    let message = event.get("message").and_then(Value::as_str).unwrap_or("");
                    let status = if progress >= 100.0 {
                        "completed"
                    } else {
                        "running"
                    };
                    update_stage(&directory, stage, status, progress, message)?;
                    emit_processing(&app, &project_id, stage, status, progress, message);
                }
                if event.get("type").and_then(Value::as_str) == Some("project.failed") {
                    worker_error = event
                        .get("error")
                        .and_then(Value::as_str)
                        .map(str::to_string);
                }
            }
            let status = child
                .wait()
                .map_err(|error| format!("Unable to wait for project worker: {error}"))?;
            if !status.success() {
                return Err(
                    worker_error.unwrap_or_else(|| format!("Project worker exited with {status}"))
                );
            }
            apply_pipeline_result(&directory)?;
            Ok(())
        })();
        if let Err(message) = result {
            let stage = ["subtitles", "transcription", "separation"]
                .into_iter()
                .find(|stage| {
                    let content = fs::read(directory.join("project.json")).ok();
                    content
                        .and_then(|content| serde_json::from_slice::<Value>(&content).ok())
                        .and_then(|project| {
                            project.get("processing").and_then(Value::as_array).cloned()
                        })
                        .and_then(|stages| {
                            stages.into_iter().find(|entry| {
                                entry.get("id").and_then(Value::as_str) == Some(*stage)
                            })
                        })
                        .and_then(|entry| {
                            entry
                                .get("status")
                                .and_then(Value::as_str)
                                .map(str::to_string)
                        })
                        .as_deref()
                        == Some("running")
                })
                .unwrap_or("separation");
            let _ = update_stage(&directory, stage, "failed", 0.0, &message);
            emit_processing(&app, &project_id, stage, "failed", 0.0, &message);
        } else {
            emit_processing(
                &app,
                &project_id,
                "subtitles",
                "completed",
                100.0,
                "Karaoke ready",
            );
        }
    });
}

fn save_to_directory(directory: &Path, project: &Project) -> Result<(), String> {
    let content = serde_json::to_vec_pretty(project).map_err(|error| error.to_string())?;
    fs::write(directory.join("project.json"), content)
        .map_err(|error| format!("Unable to save project: {error}"))
}

pub(crate) fn load_project(
    app: AppHandle,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<Project, String> {
    let root = project_data_directory(&app, storage_directory)?;
    let content = fs::read(project_directory(&root, &project_id)?.join("project.json"))
        .map_err(|error| format!("Unable to read project: {error}"))?;
    serde_json::from_slice(&content).map_err(|error| format!("Invalid project file: {error}"))
}

pub(crate) fn project_audio_sources(
    app: AppHandle,
    registry: &ProjectAudioSourceRegistry,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<ProjectAudioSources, String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project_id)?;
    let preview_directory = directory.join("cache").join("preview-audio");
    fs::create_dir_all(&preview_directory)
        .map_err(|error| format!("Unable to create audio preview cache: {error}"))?;
    let preview_file = |stem: &str| -> Result<Option<String>, String> {
        let source = directory.join("audio").join(format!("{stem}.wav"));
        if !source.is_file() {
            return Ok(None);
        }
        let preview = preview_directory.join(format!("{stem}.mp3"));
        let source_modified = source.metadata().and_then(|value| value.modified()).ok();
        let preview_current = preview
            .metadata()
            .ok()
            .filter(|value| value.len() > 0)
            .and_then(|value| value.modified().ok())
            .zip(source_modified)
            .map(|(preview_time, source_time)| preview_time >= source_time)
            .unwrap_or(false);
        if !preview_current {
            let status = project_ffmpeg_command(&root)
                .args(["-hide_banner", "-loglevel", "error", "-y", "-i"])
                .arg(&source)
                .args(["-vn", "-codec:a", "libmp3lame", "-b:a", "192k"])
                .arg(&preview)
                .status()
                .map_err(|error| format!("Unable to create the {stem} preview: {error}"))?;
            if !status.success() || !preview.is_file() {
                return Err(format!("Unable to create the {stem} audio preview"));
            }
        }
        Ok(Some(registry.register(
            &project_id,
            &format!("{stem}.mp3"),
            preview,
        )))
    };
    Ok(ProjectAudioSources {
        instrumental: preview_file("instrumental")?,
        vocals: preview_file("vocals")?,
    })
}

pub(crate) fn list_projects(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<ProjectSummary>, String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = root.join("projects");
    let mut projects = fs::read_dir(&directory)
        .map_err(|error| format!("Unable to read projects: {error}"))?
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let content = fs::read(entry.path().join("project.json")).ok()?;
            let project: Project = serde_json::from_slice(&content).ok()?;
            Some(ProjectSummary {
                id: project.id,
                name: project.name,
                duration: project.duration,
                size_bytes: directory_size(&entry.path()),
                created_at: project.created_at,
                updated_at: project.updated_at,
                processing: project.processing,
                thumbnail: project.thumbnail,
            })
        })
        .collect::<Vec<_>>();
    projects.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
    Ok(projects)
}

pub(crate) fn save_project(
    app: AppHandle,
    project: Project,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project.id)?;
    if !directory.is_dir() {
        return Err("Project does not exist".to_string());
    }
    save_to_directory(&directory, &project)
}

pub(crate) fn rename_project(
    app: AppHandle,
    project_id: String,
    name: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Project name cannot be empty".to_string());
    }
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project_id)?;
    let mut project: Project = serde_json::from_slice(
        &fs::read(directory.join("project.json"))
            .map_err(|error| format!("Unable to read project: {error}"))?,
    )
    .map_err(|error| format!("Invalid project file: {error}"))?;
    project.name = name.to_string();
    project.updated_at = epoch_millis()?.to_string();
    save_to_directory(&directory, &project)
}

pub(crate) fn delete_project(
    app: AppHandle,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project_id)?;
    if !directory.is_dir() {
        return Err("Project does not exist".to_string());
    }
    fs::remove_dir_all(&directory).map_err(|error| format!("Unable to delete project: {error}"))
}

fn first_phrase_start(project: &Project) -> Option<u64> {
    project
        .tracks
        .iter()
        .filter(|track| track.get("type").and_then(Value::as_str) == Some("subtitle"))
        .filter_map(|track| track.get("phrases").and_then(Value::as_array))
        .flatten()
        .filter_map(|phrase| phrase.get("start").and_then(Value::as_u64))
        .min()
}

fn project_background_asset(project: &Project) -> Option<String> {
    project
        .tracks
        .iter()
        .find(|track| track.get("type").and_then(Value::as_str) == Some("background"))
        .and_then(|background| {
            ["videoAsset", "imageAsset", "asset"]
                .iter()
                .find_map(|field| background.get(*field).and_then(Value::as_str))
        })
        .map(str::to_string)
}

fn is_video_asset(asset: &str) -> bool {
    matches!(
        Path::new(asset)
            .extension()
            .and_then(|extension| extension.to_str())
            .map(|extension| extension.to_ascii_lowercase())
            .as_deref(),
        Some("mp4" | "mov" | "webm" | "mkv")
    )
}

pub(crate) fn generate_project_thumbnail(
    app: AppHandle,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<Option<String>, String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project_id)?;
    let project: Project = serde_json::from_slice(
        &fs::read(directory.join("project.json"))
            .map_err(|error| format!("Unable to read project: {error}"))?,
    )
    .map_err(|error| format!("Invalid project file: {error}"))?;
    let Some(first_phrase_at) = first_phrase_start(&project) else {
        return Ok(None);
    };
    let Some(asset) = project_background_asset(&project) else {
        return Ok(None);
    };
    let asset_name = Path::new(&asset)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .ok_or_else(|| "Invalid project background asset".to_string())?;
    let source = directory.join("assets").join(asset_name);
    if !source.is_file() {
        return Ok(None);
    }
    let thumbnails = directory.join("thumbnails");
    fs::create_dir_all(&thumbnails).map_err(|error| error.to_string())?;
    let thumbnail = if is_video_asset(&asset) {
        let thumbnail = "first-phrase.jpg".to_string();
        let status = project_ffmpeg_command(&root)
            .args([
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-stream_loop",
                "-1",
                "-ss",
            ])
            .arg(format!("{}", first_phrase_at as f64 / 1000.0))
            .arg("-i")
            .arg(&source)
            .args(["-frames:v", "1"])
            .arg(thumbnails.join(&thumbnail))
            .status()
            .map_err(|error| format!("Unable to capture the project background: {error}"))?;
        if !status.success() {
            return Err("Unable to capture the project background".to_string());
        }
        thumbnail
    } else {
        let extension = Path::new(asset_name)
            .extension()
            .and_then(|extension| extension.to_str())
            .unwrap_or("jpg");
        let thumbnail = format!("first-phrase.{extension}");
        fs::copy(&source, thumbnails.join(&thumbnail))
            .map_err(|error| format!("Unable to save project thumbnail: {error}"))?;
        thumbnail
    };
    let mut updated = project;
    updated.thumbnail = Some(thumbnail.clone());
    save_to_directory(&directory, &updated)?;
    Ok(Some(thumbnail))
}

pub(crate) fn read_project_thumbnail(
    app: AppHandle,
    project_id: String,
    thumbnail: String,
    storage_directory: Option<String>,
) -> Result<Vec<u8>, String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project_id)?;
    let thumbnail = Path::new(&thumbnail)
        .file_name()
        .ok_or_else(|| "Invalid project thumbnail".to_string())?;
    fs::read(directory.join("thumbnails").join(thumbnail))
        .map_err(|error| format!("Unable to read project thumbnail: {error}"))
}

pub(crate) fn save_project_thumbnail(
    app: AppHandle,
    project_id: String,
    bytes: Vec<u8>,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project_id)?;
    fs::create_dir_all(directory.join("thumbnails")).map_err(|error| error.to_string())?;
    fs::write(directory.join("thumbnails").join("preview.jpg"), bytes)
        .map_err(|error| format!("Unable to save project thumbnail: {error}"))?;
    let mut project: Project = serde_json::from_slice(
        &fs::read(directory.join("project.json"))
            .map_err(|error| format!("Unable to read project: {error}"))?,
    )
    .map_err(|error| format!("Invalid project file: {error}"))?;
    project.thumbnail = Some("preview.jpg".to_string());
    save_to_directory(&directory, &project)
}

fn copy_directory(source: &Path, destination: &Path) -> Result<(), String> {
    fs::create_dir_all(destination).map_err(|error| error.to_string())?;
    for entry in fs::read_dir(source).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        let target = destination.join(entry.file_name());
        if path.is_dir() {
            copy_directory(&path, &target)?;
        } else {
            fs::copy(&path, &target).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

pub(crate) fn duplicate_project(
    app: AppHandle,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<Project, String> {
    let root = project_data_directory(&app, storage_directory)?;
    let source = project_directory(&root, &project_id)?;
    let timestamp = epoch_millis()?;
    let id = format!("project-{timestamp}-copy");
    let destination = project_directory(&root, &id)?;
    if destination.exists() {
        return Err("Unable to create duplicate project".to_string());
    }
    copy_directory(&source, &destination)?;
    let mut project: Project = serde_json::from_slice(
        &fs::read(destination.join("project.json"))
            .map_err(|error| format!("Unable to read duplicated project: {error}"))?,
    )
    .map_err(|error| format!("Invalid duplicated project: {error}"))?;
    project.id = id;
    project.name = format!("{} (copy)", project.name);
    project.created_at = timestamp.to_string();
    project.updated_at = timestamp.to_string();
    save_to_directory(&destination, &project)?;
    Ok(project)
}

pub(crate) fn open_project_folder(
    app: AppHandle,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    let root = project_data_directory(&app, storage_directory)?;
    let directory = project_directory(&root, &project_id)?;
    if !directory.is_dir() {
        return Err("Project does not exist".to_string());
    }
    #[cfg(target_os = "windows")]
    let mut command = Command::new("explorer");
    #[cfg(target_os = "macos")]
    let mut command = Command::new("open");
    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    let mut command = Command::new("xdg-open");
    command
        .arg(directory)
        .spawn()
        .map_err(|error| format!("Unable to open project folder: {error}"))?;
    Ok(())
}
