import { create } from "zustand";

interface PreviewState {
  isGridVisible: boolean;
  toggleGrid: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  isGridVisible: true,
  toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible }))
}));
