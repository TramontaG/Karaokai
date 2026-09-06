mod projects;
mod runtime_installer;

use runtime_installer::{BootstrapReport, ModelStatus, RuntimeComponentStatus};
use tauri::{AppHandle, State};

#[tauri::command]
fn create_local_project(
    app: AppHandle,
    source_path: String,
    storage_directory: Option<String>,
    whisper_model_id: String,
    demucs_model_id: String,
) -> Result<projects::Project, String> {
    projects::create_local_project(
        app,
        source_path,
        storage_directory,
        whisper_model_id,
        demucs_model_id,
    )
}

#[tauri::command]
fn load_project(
    app: AppHandle,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<projects::Project, String> {
    projects::load_project(app, project_id, storage_directory)
}

#[tauri::command]
fn project_audio_sources(
    app: AppHandle,
    registry: State<'_, projects::ProjectAudioSourceRegistry>,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<projects::ProjectAudioSources, String> {
    projects::project_audio_sources(app, registry.inner(), project_id, storage_directory)
}

#[tauri::command]
fn read_project_audio(
    registry: State<'_, projects::ProjectAudioSourceRegistry>,
    source_id: String,
) -> Result<tauri::ipc::Response, String> {
    let path = registry
        .get(&source_id)
        .ok_or_else(|| "Audio source is not registered for this project".to_string())?;
    let bytes = std::fs::read(path)
        .map_err(|error| format!("Unable to read project audio: {error}"))?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[tauri::command]
fn list_projects(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<projects::ProjectSummary>, String> {
    projects::list_projects(app, storage_directory)
}

#[tauri::command]
fn save_project(
    app: AppHandle,
    project: projects::Project,
    storage_directory: Option<String>,
) -> Result<(), String> {
    projects::save_project(app, project, storage_directory)
}

#[tauri::command]
fn delete_project(
    app: AppHandle,
    project_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    projects::delete_project(app, project_id, storage_directory)
}

async fn run_blocking<T, F>(operation: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(operation)
        .await
        .map_err(|error| format!("Background operation failed: {error}"))?
}

#[tauri::command]
fn bootstrap_app(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<BootstrapReport, String> {
    runtime_installer::bootstrap_app(app, storage_directory)
}

#[tauri::command]
async fn list_models(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<ModelStatus>, String> {
    run_blocking(move || runtime_installer::list_models(app, storage_directory)).await
}

#[tauri::command]
fn start_model_download(
    app: AppHandle,
    model_id: String,
    storage_directory: Option<String>,
) -> Result<String, String> {
    runtime_installer::start_model_download(app, model_id, storage_directory)
}

#[tauri::command]
fn start_runtime_install(
    app: AppHandle,
    model_id: String,
    storage_directory: Option<String>,
) -> Result<String, String> {
    runtime_installer::start_runtime_install(app, model_id, storage_directory)
}

#[tauri::command]
async fn clear_downloaded_data(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<(), String> {
    run_blocking(move || runtime_installer::clear_downloaded_data(app, storage_directory)).await
}

#[tauri::command]
async fn list_runtime_components(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<RuntimeComponentStatus>, String> {
    run_blocking(move || runtime_installer::list_runtime_components(app, storage_directory)).await
}

#[tauri::command]
async fn run_runtime_checkup(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<RuntimeComponentStatus>, String> {
    run_blocking(move || runtime_installer::run_runtime_checkup(app, storage_directory)).await
}

#[tauri::command]
async fn install_runtime_component(
    app: AppHandle,
    component_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    run_blocking(move || {
        runtime_installer::install_runtime_component(app, component_id, storage_directory)
    })
    .await
}

#[tauri::command]
fn open_managed_location(
    app: AppHandle,
    target_kind: String,
    target_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    runtime_installer::open_managed_location(app, target_kind, target_id, storage_directory)
}

#[tauri::command]
async fn remove_runtime_component(
    app: AppHandle,
    component_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    run_blocking(move || {
        runtime_installer::remove_runtime_component(app, component_id, storage_directory)
    })
    .await
}

#[tauri::command]
async fn remove_model(
    app: AppHandle,
    model_id: String,
    storage_directory: Option<String>,
) -> Result<(), String> {
    run_blocking(move || runtime_installer::remove_model(app, model_id, storage_directory)).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(projects::ProjectAudioSourceRegistry::default())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_local_project,
            load_project,
            project_audio_sources,
            read_project_audio,
            list_projects,
            save_project,
            delete_project,
            bootstrap_app,
            list_models,
            start_model_download,
            start_runtime_install,
            clear_downloaded_data,
            list_runtime_components,
            run_runtime_checkup,
            install_runtime_component,
            open_managed_location,
            remove_runtime_component,
            remove_model
        ])
        .run(tauri::generate_context!())
        .expect("error while running KaraokAI");
}
