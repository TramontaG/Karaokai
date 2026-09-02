mod runtime_installer;

use runtime_installer::{BootstrapReport, ModelStatus};
use tauri::AppHandle;

#[tauri::command]
fn bootstrap_app(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<BootstrapReport, String> {
    runtime_installer::bootstrap_app(app, storage_directory)
}

#[tauri::command]
fn list_models(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<Vec<ModelStatus>, String> {
    runtime_installer::list_models(app, storage_directory)
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
fn clear_downloaded_data(
    app: AppHandle,
    storage_directory: Option<String>,
) -> Result<(), String> {
    runtime_installer::clear_downloaded_data(app, storage_directory)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            bootstrap_app,
            list_models,
            start_model_download,
            start_runtime_install,
            clear_downloaded_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running KaraokAI");
}
