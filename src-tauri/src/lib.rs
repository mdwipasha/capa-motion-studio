use std::{env, fs, path::PathBuf, process::Command};
use tauri::{AppHandle, Manager};

#[derive(serde::Serialize)]
struct RuntimeStatus {
    python: bool,
    ffmpeg: bool,
    ai_model: bool,
    portable_mode: bool,
    data_directory: String,
    log_directory: String,
}

#[derive(serde::Serialize)]
struct ReleaseInfo {
    version: &'static str,
    build_date: &'static str,
    license: &'static str,
}

fn portable_directory() -> Option<PathBuf> {
    let executable = env::current_exe().ok()?;
    let folder = executable.parent()?.to_path_buf();
    folder.join("portable.flag").exists().then_some(folder)
}

fn data_directory(app: &AppHandle) -> Result<(PathBuf, bool), String> {
    if let Some(folder) = portable_directory() {
        let data = folder.join("data");
        fs::create_dir_all(&data).map_err(|error| error.to_string())?;
        return Ok((data, true));
    }
    let data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    fs::create_dir_all(&data).map_err(|error| error.to_string())?;
    Ok((data, false))
}

fn command_available(command: &str, argument: &str) -> bool {
    Command::new(command).arg(argument).output().is_ok()
}

fn log_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let (data, _) = data_directory(app)?;
    let folder = data.join("logs");
    fs::create_dir_all(&folder).map_err(|error| error.to_string())?;
    Ok(folder)
}

#[tauri::command]
fn get_release_info() -> ReleaseInfo {
    ReleaseInfo { version: env!("CARGO_PKG_VERSION"), build_date: option_env!("CAPAMOTION_BUILD_DATE").unwrap_or("release"), license: "MIT" }
}

#[tauri::command]
fn check_runtime(app: AppHandle) -> Result<RuntimeStatus, String> {
    let (data, portable_mode) = data_directory(&app)?;
    let logs = log_directory(&app)?;
    Ok(RuntimeStatus {
        python: command_available("python", "--version"),
        ffmpeg: command_available("ffmpeg", "-version"),
        ai_model: data.join("models").join("mediapipe-pose.model").exists(),
        portable_mode,
        data_directory: data.display().to_string(),
        log_directory: logs.display().to_string(),
    })
}

#[tauri::command]
fn write_application_log(app: AppHandle, category: String, message: String) -> Result<(), String> {
    let safe_category: String = category.chars().filter(|character| character.is_ascii_alphanumeric() || *character == '-').collect();
    let file = log_directory(&app)?.join(format!("{}.log", if safe_category.is_empty() { "application" } else { &safe_category }));
    let entry = format!("{} {}\n", chrono_like_timestamp(), message.replace(['\r', '\n'], " "));
    use std::io::Write;
    fs::OpenOptions::new().create(true).append(true).open(file).map_err(|error| error.to_string())?.write_all(entry.as_bytes()).map_err(|error| error.to_string())
}

fn chrono_like_timestamp() -> String {
    match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) { Ok(value) => format!("[{}]", value.as_secs()), Err(_) => "[unknown]".to_string() }
}

#[tauri::command]
fn open_log_folder(app: AppHandle) -> Result<(), String> {
    let folder = log_directory(&app)?;
    Command::new("explorer").arg(folder).spawn().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn check_for_updates() -> String {
    "Update checks are ready. Configure the signed GitHub Releases endpoint and updater public key before publishing the first release.".to_string()
}

#[tauri::command]
fn get_launch_project() -> Option<String> {
    env::args().skip(1).find_map(|argument| {
        let path = PathBuf::from(argument);
        (path.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("rma")) && path.is_file()).then(|| fs::read_to_string(path).ok()).flatten()
    })
}

#[tauri::command]
fn install_placeholder_model(app: AppHandle) -> Result<(), String> {
    let (data, _) = data_directory(&app)?;
    let models = data.join("models");
    fs::create_dir_all(&models).map_err(|error| error.to_string())?;
    fs::write(models.join("mediapipe-pose.model"), b"CapaMotion local model placeholder").map_err(|error| error.to_string())
}

#[tauri::command]
fn remove_placeholder_model(app: AppHandle) -> Result<(), String> {
    let (data, _) = data_directory(&app)?;
    let file = data.join("models").join("mediapipe-pose.model");
    if file.exists() { fs::remove_file(file).map_err(|error| error.to_string())?; }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_release_info, check_runtime, write_application_log, open_log_folder, check_for_updates, get_launch_project, install_placeholder_model, remove_placeholder_model])
        .run(tauri::generate_context!())
        .expect("error while running CapaMotion");
}
