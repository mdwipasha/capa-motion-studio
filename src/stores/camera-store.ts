import { create } from "zustand";

export interface CameraView {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export const defaultCameraView: CameraView = {
  position: [7, 5, 9],
  target: [0, 0.5, 0]
};

interface CameraState {
  resetRequestId: number;
  view: CameraView;
  requestReset: () => void;
  setView: (view: CameraView) => void;
  resetView: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  resetRequestId: 0,
  view: defaultCameraView,
  requestReset: () => set((state) => ({ view: defaultCameraView, resetRequestId: state.resetRequestId + 1 })),
  setView: (view) => set({ view }),
  resetView: () => set({ view: defaultCameraView })
}));
