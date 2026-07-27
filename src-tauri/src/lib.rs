use std::{env, fs, io::{Read, Write}, net::TcpStream, path::{Path, PathBuf}, process::{Command, Stdio}, time::Duration};
use tauri::{AppHandle, Emitter, Manager};

const POSE_MODEL_FILE: &str = "pose_landmarker_lite.task";
const POSE_MODEL_URL: &str = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const AI_RUNTIME_EXE: &str = "capamotion-ai.exe";
const FFMPEG_EXE: &str = "ffmpeg.exe";
const FFPROBE_EXE: &str = "ffprobe.exe";

fn ai_runtime_url() -> &'static str {
    option_env!("CAPAMOTION_AI_RUNTIME_URL").unwrap_or("")
}

fn ai_runtime_download_configured() -> bool {
    !ai_runtime_url().trim().is_empty()
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeStatus {
    python: bool,
    ffmpeg: bool,
    ai_runtime: bool,
    ai_runtime_ready: bool,
    ai_runtime_mode: String,
    ai_runtime_path: String,
    ai_runtime_download_url: String,
    ai_runtime_download_configured: bool,
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

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeDownloadProgress {
    progress: u8,
    message: String,
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

fn runtime_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let (data, _) = data_directory(app)?;
    let folder = data.join("runtimes").join("ai");
    fs::create_dir_all(&folder).map_err(|error| error.to_string())?;
    Ok(folder)
}

fn pose_model_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(model_directory(app)?.join(POSE_MODEL_FILE))
}

fn bundled_runtime_candidates(app: &AppHandle) -> Result<Vec<PathBuf>, String> {
    let mut candidates = Vec::new();
    if let Some(root) = app_root() {
        candidates.push(root.join(AI_RUNTIME_EXE));
        candidates.push(root.join("ai-runtime").join(AI_RUNTIME_EXE));
    }
    if let Ok(resources) = app.path().resource_dir() {
        candidates.push(resources.join("ai-runtime").join(AI_RUNTIME_EXE));
    }
    candidates.push(runtime_directory(app)?.join(AI_RUNTIME_EXE));
    Ok(candidates)
}

fn find_ai_runtime(app: &AppHandle) -> Result<Option<PathBuf>, String> {
    Ok(bundled_runtime_candidates(app)?.into_iter().find(|path| path.exists()))
}

fn bundled_tool_available(app: &AppHandle, tool: &str) -> Result<bool, String> {
    Ok(find_ai_runtime(app)?.and_then(|runtime| runtime.parent().map(|folder| folder.join(tool))).is_some_and(|path| path.exists()))
}

fn ai_runtime_mode(app: &AppHandle, python: bool, ffmpeg: bool) -> Result<String, String> {
    if find_ai_runtime(app)?.is_some() {
        return Ok("bundled".to_string());
    }
    if python && ffmpeg {
        return Ok("system-python".to_string());
    }
    Ok("missing".to_string())
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
    let runtime = find_ai_runtime(&app)?;
    let python = command_available("python", "--version");
    let system_ffmpeg = command_available("ffmpeg", "-version");
    let ffmpeg = system_ffmpeg || bundled_tool_available(&app, FFMPEG_EXE)?;
    let mode = ai_runtime_mode(&app, python, system_ffmpeg)?;
    Ok(RuntimeStatus {
        python,
        ffmpeg,
        ai_runtime: runtime.is_some(),
        ai_runtime_ready: runtime.is_some() || (python && system_ffmpeg),
        ai_runtime_mode: mode,
        ai_runtime_path: runtime.unwrap_or_else(|| runtime_directory(&app).unwrap_or_default().join(AI_RUNTIME_EXE)).display().to_string(),
        ai_runtime_download_url: ai_runtime_url().to_string(),
        ai_runtime_download_configured: ai_runtime_download_configured(),
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
    if let Some(sidecar) = find_ai_runtime(&app)? {
        let runtime_folder = sidecar.parent().ok_or_else(|| "Unable to resolve AI runtime folder.".to_string())?.to_path_buf();
        let current_path = env::var_os("PATH").unwrap_or_default();
        let mut runtime_path = std::ffi::OsString::from(runtime_folder.as_os_str());
        runtime_path.push(";");
        runtime_path.push(current_path);
        Command::new(sidecar)
            .env("PATH", runtime_path)
            .env("CAPAMOTION_AI_MODEL_PATH", model.display().to_string())
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

fn escape_powershell_literal(value: &str) -> String {
    value.replace('\'', "''")
}

fn emit_runtime_progress(app: &AppHandle, progress: u8, message: impl Into<String>) {
    let _ = app.emit("ai-runtime-download-progress", RuntimeDownloadProgress { progress, message: message.into() });
}

fn download_file_with_progress(app: &AppHandle, url: &str, destination: &Path) -> Result<(), String> {
    emit_runtime_progress(app, 2, "Connecting to runtime download...");
    let client = reqwest::blocking::Client::builder()
        .timeout(None)
        .build()
        .map_err(|error| format!("Unable to prepare runtime downloader: {error}"))?;
    let mut response = client.get(url).send().map_err(|error| format!("Unable to download AI runtime: {error}"))?;
    if !response.status().is_success() {
        return Err(format!("AI runtime download failed with HTTP status {}.", response.status()));
    }
    let total = response.content_length().unwrap_or(0);
    let mut file = fs::File::create(destination).map_err(|error| error.to_string())?;
    let mut downloaded = 0_u64;
    let mut buffer = [0_u8; 1024 * 128];
    loop {
        let count = response.read(&mut buffer).map_err(|error| format!("AI runtime download interrupted: {error}"))?;
        if count == 0 {
            break;
        }
        file.write_all(&buffer[..count]).map_err(|error| error.to_string())?;
        downloaded += count as u64;
        if total > 0 {
            let percent = 5 + ((downloaded.saturating_mul(70) / total).min(70) as u8);
            emit_runtime_progress(app, percent, format!("Downloading runtime {}%", percent));
        }
    }
    file.flush().map_err(|error| error.to_string())?;
    let size = fs::metadata(destination).map_err(|error| error.to_string())?.len();
    if size < 1_000_000 {
        return Err("Downloaded AI runtime archive is incomplete.".to_string());
    }
    emit_runtime_progress(app, 78, "Runtime archive downloaded.");
    Ok(())
}

fn extract_zip_with_progress(app: &AppHandle, archive: &Path, destination: &Path) -> Result<(), String> {
    emit_runtime_progress(app, 80, "Extracting runtime archive...");
    let file = fs::File::open(archive).map_err(|error| error.to_string())?;
    let mut zip = zip::ZipArchive::new(file).map_err(|error| format!("AI runtime archive is not a valid zip file: {error}"))?;
    let total = zip.len().max(1);
    for index in 0..zip.len() {
        let mut entry = zip.by_index(index).map_err(|error| error.to_string())?;
        let Some(enclosed_name) = entry.enclosed_name().map(|path| path.to_owned()) else {
            continue;
        };
        let output_path = destination.join(enclosed_name);
        if entry.is_dir() {
            fs::create_dir_all(&output_path).map_err(|error| error.to_string())?;
        } else {
            if let Some(parent) = output_path.parent() {
                fs::create_dir_all(parent).map_err(|error| error.to_string())?;
            }
            let mut output = fs::File::create(&output_path).map_err(|error| error.to_string())?;
            std::io::copy(&mut entry, &mut output).map_err(|error| error.to_string())?;
        }
        let percent = 80 + (((index + 1) * 15 / total) as u8).min(15);
        emit_runtime_progress(app, percent, format!("Extracting runtime {}%", percent));
    }
    emit_runtime_progress(app, 96, "Runtime archive extracted.");
    Ok(())
}

fn powershell_download(url: &str, destination: &PathBuf) -> Result<(), String> {
    let script = format!(
        "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '{}' -OutFile '{}'",
        escape_powershell_literal(url),
        escape_powershell_literal(&destination.display().to_string())
    );
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &script])
        .output()
        .map_err(|error| format!("Unable to start download: {error}"))?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if message.is_empty() { "Download failed.".to_string() } else { message });
    }
    Ok(())
}

fn find_file_recursive(folder: &PathBuf, file_name: &str) -> Option<PathBuf> {
    for entry in fs::read_dir(folder).ok()? {
        let path = entry.ok()?.path();
        if path.is_file() && path.file_name().is_some_and(|name| name.to_string_lossy().eq_ignore_ascii_case(file_name)) {
            return Some(path);
        }
        if path.is_dir() {
            if let Some(found) = find_file_recursive(&path, file_name) {
                return Some(found);
            }
        }
    }
    None
}

fn download_ai_runtime_blocking(app: AppHandle) -> Result<String, String> {
    if !ai_runtime_download_configured() {
        return Err("AI runtime download is not configured for this build. Build the runtime zip, publish it, then rebuild CapaMotion with CAPAMOTION_AI_RUNTIME_URL pointing to that zip.".to_string());
    }
    let runtime_dir = runtime_directory(&app)?;
    let parent = runtime_dir.parent().ok_or_else(|| "Unable to resolve runtime directory.".to_string())?.to_path_buf();
    fs::create_dir_all(&parent).map_err(|error| error.to_string())?;
    let archive = parent.join("capamotion-ai-runtime.zip.download");
    let staging = parent.join("ai.download");
    if archive.exists() {
        fs::remove_file(&archive).map_err(|error| error.to_string())?;
    }
    if staging.exists() {
        fs::remove_dir_all(&staging).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&staging).map_err(|error| error.to_string())?;
    emit_runtime_progress(&app, 1, "Preparing AI runtime installation...");
    download_file_with_progress(&app, ai_runtime_url(), &archive)?;
    extract_zip_with_progress(&app, &archive, &staging)?;
    let sidecar = find_file_recursive(&staging, AI_RUNTIME_EXE).ok_or_else(|| format!("AI runtime archive does not contain {AI_RUNTIME_EXE}."))?;
    let sidecar_folder = sidecar.parent().ok_or_else(|| "AI runtime archive has an invalid layout.".to_string())?.to_path_buf();
    if !sidecar_folder.join(FFMPEG_EXE).exists() || !sidecar_folder.join(FFPROBE_EXE).exists() {
        let _ = fs::remove_file(&archive);
        let _ = fs::remove_dir_all(&staging);
        return Err("AI runtime archive must include capamotion-ai.exe, ffmpeg.exe, and ffprobe.exe in the same folder.".to_string());
    }
    if runtime_dir.exists() {
        fs::remove_dir_all(&runtime_dir).map_err(|error| error.to_string())?;
    }
    emit_runtime_progress(&app, 97, "Installing runtime files...");
    fs::rename(&sidecar_folder, &runtime_dir).or_else(|_| {
        fs::create_dir_all(&runtime_dir)?;
        for entry in fs::read_dir(&sidecar_folder)? {
            let path = entry?.path();
            let target = runtime_dir.join(path.file_name().ok_or_else(|| std::io::Error::new(std::io::ErrorKind::Other, "invalid runtime file"))?);
            if path.is_file() {
                fs::copy(&path, target)?;
            }
        }
        Ok::<(), std::io::Error>(())
    }).map_err(|error| error.to_string())?;
    let _ = fs::remove_file(&archive);
    let _ = fs::remove_dir_all(&staging);
    emit_runtime_progress(&app, 100, "AI runtime is ready.");
    Ok(runtime_dir.join(AI_RUNTIME_EXE).display().to_string())
}

#[tauri::command]
async fn download_ai_runtime(app: AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || download_ai_runtime_blocking(app))
        .await
        .map_err(|error| format!("AI runtime task failed: {error}"))?
}

#[tauri::command]
fn remove_placeholder_model(app: AppHandle) -> Result<(), String> {
    let file = pose_model_path(&app)?;
    if file.exists() { fs::remove_file(file).map_err(|error| error.to_string())?; }
    Ok(())
}

#[tauri::command]
fn remove_ai_runtime(app: AppHandle) -> Result<(), String> {
    let folder = runtime_directory(&app)?;
    if folder.exists() {
        fs::remove_dir_all(folder).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn download_ai_model(app: AppHandle) -> Result<String, String> {
    let model_path = pose_model_path(&app)?;
    let temp_path = model_path.with_extension("task.download");
    if temp_path.exists() {
        fs::remove_file(&temp_path).map_err(|error| error.to_string())?;
    }
    if let Err(error) = powershell_download(POSE_MODEL_URL, &temp_path) {
        let _ = fs::remove_file(&temp_path);
        return Err(error);
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
        .invoke_handler(tauri::generate_handler![get_release_info, check_runtime, ensure_ai_service, write_application_log, open_log_folder, check_for_updates, get_launch_project, install_placeholder_model, remove_placeholder_model, remove_ai_runtime, download_ai_model, download_ai_runtime])
        .run(tauri::generate_context!())
        .expect("error while running CapaMotion");
}
