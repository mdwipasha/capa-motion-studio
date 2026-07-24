import { create } from "zustand";

interface SettingsState {
  theme: "dark";
  language: "en" | "id";
  autosaveEnabled: boolean;
  autosaveIntervalSeconds: number;
  defaultFps: number;
  viewportBackgroundColor: string;
  autoUpdateEnabled: boolean;
  gpuAcceleration: "auto" | "off";
  setAutosaveEnabled: (enabled: boolean) => void;
  setDefaultFps: (fps: number) => void;
  setViewportBackgroundColor: (color: string) => void;
  setLanguage: (language: SettingsState["language"]) => void;
  setAutoUpdateEnabled: (enabled: boolean) => void;
  setGpuAcceleration: (value: SettingsState["gpuAcceleration"]) => void;
  hydrateSettings: (settings: Pick<SettingsState, "autosaveEnabled" | "autosaveIntervalSeconds" | "defaultFps" | "viewportBackgroundColor">) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "dark",
  language: "en",
  autosaveEnabled: true,
  autosaveIntervalSeconds: 30,
  defaultFps: 30,
  viewportBackgroundColor: "#0c0d12",
  autoUpdateEnabled: true,
  gpuAcceleration: "auto",
  setAutosaveEnabled: (autosaveEnabled) => set({ autosaveEnabled }),
  setDefaultFps: (defaultFps) => set({ defaultFps: Math.min(60, Math.max(1, Math.round(defaultFps))) }),
  setViewportBackgroundColor: (viewportBackgroundColor) => set({ viewportBackgroundColor }),
  setLanguage: (language) => set({ language }),
  setAutoUpdateEnabled: (autoUpdateEnabled) => set({ autoUpdateEnabled }),
  setGpuAcceleration: (gpuAcceleration) => set({ gpuAcceleration }),
  hydrateSettings: (settings) => set(settings)
}));
