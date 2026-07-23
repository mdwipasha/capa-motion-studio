import { create } from "zustand";

interface SettingsState {
  theme: "dark";
  autosaveEnabled: boolean;
  autosaveIntervalSeconds: number;
  defaultFps: number;
  viewportBackgroundColor: string;
  setAutosaveEnabled: (enabled: boolean) => void;
  setDefaultFps: (fps: number) => void;
  setViewportBackgroundColor: (color: string) => void;
  hydrateSettings: (settings: Pick<SettingsState, "autosaveEnabled" | "autosaveIntervalSeconds" | "defaultFps" | "viewportBackgroundColor">) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "dark",
  autosaveEnabled: true,
  autosaveIntervalSeconds: 30,
  defaultFps: 30,
  viewportBackgroundColor: "#0c0d12",
  setAutosaveEnabled: (autosaveEnabled) => set({ autosaveEnabled }),
  setDefaultFps: (defaultFps) => set({ defaultFps: Math.min(60, Math.max(1, Math.round(defaultFps))) }),
  setViewportBackgroundColor: (viewportBackgroundColor) => set({ viewportBackgroundColor }),
  hydrateSettings: (settings) => set(settings)
}));
