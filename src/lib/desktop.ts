import { invoke } from "@tauri-apps/api/core";
import type { ReleaseInfo, RuntimeStatus } from "@/types/release";

export async function getReleaseInfo(): Promise<ReleaseInfo> {
  return invoke<ReleaseInfo>("get_release_info");
}

export async function checkRuntime(): Promise<RuntimeStatus> {
  return invoke<RuntimeStatus>("check_runtime");
}

export async function writeApplicationLog(category: string, message: string): Promise<void> {
  await invoke("write_application_log", { category, message });
}

export async function openLogFolder(): Promise<void> {
  await invoke("open_log_folder");
}

export async function checkForUpdates(): Promise<string> {
  return invoke<string>("check_for_updates");
}

export async function installPlaceholderModel(): Promise<void> { await invoke("install_placeholder_model"); }
export async function removePlaceholderModel(): Promise<void> { await invoke("remove_placeholder_model"); }
export async function getLaunchProject(): Promise<string | null> { return invoke<string | null>("get_launch_project"); }
