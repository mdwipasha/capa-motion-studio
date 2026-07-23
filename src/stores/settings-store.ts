import { create } from "zustand";

interface SettingsState {
  theme: "dark";
}

export const useSettingsStore = create<SettingsState>(() => ({ theme: "dark" }));
