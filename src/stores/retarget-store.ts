import { create } from "zustand";
import type { RigType } from "@/types/project";
import type { CleanupSettings, PreviewMode, RetargetQuality, RetargetResult, RetargetStep } from "@/types/retarget";

const qualitySettings: Readonly<Record<RetargetQuality, CleanupSettings>> = {
  fast: { smoothingWindow: 0, reductionThresholdDegrees: 8, sampleStride: 3 },
  balanced: { smoothingWindow: 1, reductionThresholdDegrees: 4, sampleStride: 2 },
  high: { smoothingWindow: 2, reductionThresholdDegrees: 2, sampleStride: 1 }
};

interface RetargetState {
  isPanelOpen: boolean;
  currentRig: RigType | null;
  quality: RetargetQuality;
  cleanupSettings: CleanupSettings;
  previewMode: PreviewMode;
  step: RetargetStep;
  progress: number;
  message: string;
  result: RetargetResult | null;
  error: string | null;
  setQuality: (quality: RetargetQuality) => void;
  setPanelOpen: (isOpen: boolean) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  updateProgress: (step: RetargetStep, progress: number, message: string) => void;
  complete: (result: RetargetResult) => void;
  fail: (message: string) => void;
  clear: () => void;
}

export const useRetargetStore = create<RetargetState>((set) => ({
  isPanelOpen: false,
  currentRig: null,
  quality: "balanced",
  cleanupSettings: qualitySettings.balanced,
  previewMode: "after",
  step: "idle",
  progress: 0,
  message: "Choose AI Motion Data to create a draft animation.",
  result: null,
  error: null,
  setQuality: (quality) => set({ quality, cleanupSettings: qualitySettings[quality] }),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setPreviewMode: (previewMode) => set({ previewMode }),
  updateProgress: (step, progress, message) => set({ step, progress, message, error: null }),
  complete: (result) => set({ currentRig: result.rigType, result, step: "completed", progress: 100, message: `${result.poses.length} editable keyframes were created.`, error: null }),
  fail: (error) => set({ step: "failed", message: error, error }),
  clear: () => set({ currentRig: null, step: "idle", progress: 0, message: "Choose AI Motion Data to create a draft animation.", result: null, error: null })
}));
