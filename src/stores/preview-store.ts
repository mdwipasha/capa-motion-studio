import { create } from "zustand";

interface PreviewState {
  isGridVisible: boolean;
  toggleGrid: () => void;
  setGridVisible: (isVisible: boolean) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  isGridVisible: true,
  toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
  setGridVisible: (isGridVisible) => set({ isGridVisible })
}));
