import { create } from "zustand";

interface EditorState {
  activePanel: "scene" | "assets";
  setActivePanel: (panel: EditorState["activePanel"]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activePanel: "scene",
  setActivePanel: (activePanel) => set({ activePanel })
}));
