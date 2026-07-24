use std::{env, fs, net::TcpStream, path::PathBuf, process::{Command, Stdio}, time::Duration};
use tauri::{AppHandle, Manager};

const POSE_MODEL_FILE: &str = "pose_landmarker_lite.task";
const POSE_MODEL_URL: &str = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeStatus {
    python: bool,
    ffmpeg: bool,
    ai_model: bool,
    ai_model_path: String,
    portable_mode: bool,
    data_directory: String,
    log_directory: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
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

fn ai_service_available() -> bool {
    TcpStream::connect_timeout(&"127.0.0.1:8765".parse().expect("valid loopback socket"), Duration::from_millis(250)).is_ok()
}

fn app_root() -> Option<PathBuf> {
    env::current_exe().ok().and_then(|path| path.parent().map(PathBuf::from))
}

fn log_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let (data, _) = data_directory(app)?;
    let folder = data.join("logs");
    fs::create_dir_all(&folder).map_err(|error| error.to_string())?;
    Ok(folder)
}

fn model_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let (data, _) = data_directory(app)?;
    let folder = data.join("models");
    fs::create_dir_all(&folder).map_err(|error| error.to_string())?;
    Ok(folder)
}

fn pose_model_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(model_directory(app)?.join(POSE_MODEL_FILE))
}

#[tauri::command]
fn get_release_info() -> ReleaseInfo {
    ReleaseInfo { version: env!("CARGO_PKG_VERSION"), build_date: option_env!("CAPAMOTION_BUILD_DATE").unwrap_or("release"), license: "MIT" }
}

#[tauri::command]
fn check_runtime(app: AppHandle) -> Result<RuntimeStatus, String> {
    let (data, portable_mode) = data_directory(&app)?;
    let logs = log_directory(&app)?;
    let model = pose_model_path(&app)?;
    Ok(RuntimeStatus {
        python: command_available("python", "--version"),
        ffmpeg: command_available("ffmpeg", "-version"),
        ai_model: model.exists(),
        ai_model_path: model.display().to_string(),
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
    download_ai_model(app).map(|_| ())
}

#[tauri::command]
fn ensure_ai_service(app: AppHandle) -> Result<String, String> {
    if ai_service_available() {
        return Ok("AI service is already running.".to_string());
    }
    let model = pose_model_path(&app)?;
    if !model.exists() {
        return Err("Download the AI model before running Video to Animation.".to_string());
    }
    let root = app_root().ok_or_else(|| "Unable to resolve application folder.".to_string())?;
    let sidecar = root.join("capamotion-ai.exe");
    if sidecar.exists() {
        Command::new(sidecar)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| format!("Unable to start bundled AI runtime: {error}"))?;
        return Ok("Started bundled AI runtime.".to_string());
    }
    if !command_available("python", "--version") {
        return Err("AI model is installed, but no bundled AI runtime or Python runtime was found. Package capamotion-ai.exe with the release build or install Python dependencies for development.".to_string());
    }
    let dev_server = env::current_dir().ok().map(|path| path.join("python").join("server.py")).filter(|path| path.exists());
    let server = dev_server.ok_or_else(|| "Python is available, but python/server.py was not found from the current application folder.".to_string())?;
    Command::new("python")
        .arg(server)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| format!("Unable to start local Python AI service: {error}"))?;
    Ok("Started local Python AI service.".to_string())
}

#[tauri::command]
fn remove_placeholder_model(app: AppHandle) -> Result<(), String> {
    let file = pose_model_path(&app)?;
    if file.exists() { fs::remove_file(file).map_err(|error| error.to_string())?; }
    Ok(())
}

#[tauri::command]
fn download_ai_model(app: AppHandle) -> Result<String, String> {
    let model_path = pose_model_path(&app)?;
    let temp_path = model_path.with_extension("task.download");
    if temp_path.exists() {
        fs::remove_file(&temp_path).map_err(|error| error.to_string())?;
    }
    let script = format!(
        "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '{}' -OutFile '{}'",
        POSE_MODEL_URL,
        temp_path.display().to_string().replace('\'', "''")
    );
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &script])
        .output()
        .map_err(|error| format!("Unable to start model download: {error}"))?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let _ = fs::remove_file(&temp_path);
        return Err(if message.is_empty() { "AI model download failed.".to_string() } else { message });
    }
    let size = fs::metadata(&temp_path).map_err(|error| error.to_string())?.len();
    if size < 1_000_000 {
        let _ = fs::remove_file(&temp_path);
        return Err("Downloaded AI model is incomplete.".to_string());
    }
    fs::rename(&temp_path, &model_path).map_err(|error| error.to_string())?;
    Ok(model_path.display().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_release_info, check_runtime, ensure_ai_service, write_application_log, open_log_folder, check_for_updates, get_launch_project, install_placeholder_model, remove_placeholder_model, download_ai_model])
        .run(tauri::generate_context!())
        .expect("error while running CapaMotion");
}
