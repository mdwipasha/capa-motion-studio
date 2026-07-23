import { create } from "zustand";

interface CameraState {
  resetRequestId: number;
  requestReset: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  resetRequestId: 0,
  requestReset: () => set((state) => ({ resetRequestId: state.resetRequestId + 1 }))
}));
