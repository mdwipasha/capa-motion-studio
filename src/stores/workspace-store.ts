import { create } from "zustand";

interface WorkspaceState {
  activeSidebarPanel: "project";
  isBottomPanelOpen: boolean;
  toggleBottomPanel: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeSidebarPanel: "project",
  isBottomPanelOpen: true,
  toggleBottomPanel: () => set((state) => ({ isBottomPanelOpen: !state.isBottomPanelOpen }))
}));
