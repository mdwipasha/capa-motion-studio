import { create } from "zustand";
import type { AiPipelineResult, AiPipelineStep, VideoMetadata } from "@/types/ai";

interface AiState {
  isPanelOpen: boolean;
  currentStep: AiPipelineStep;
  progress: number;
  currentFrame: number;
  message: string;
  currentVideo: { readonly name: string; readonly size: number; readonly type: string } | null;
  metadata: VideoMetadata | null;
  result: AiPipelineResult | null;
  error: string | null;
  jobId: string | null;
  setPanelOpen: (isOpen: boolean) => void;
  setMetadata: (metadata: VideoMetadata) => void;
  begin: (file: File) => void;
  updateProgress: (step: AiPipelineStep, progress: number, currentFrame: number, message: string) => void;
  complete: (result: AiPipelineResult) => void;
  restorePersistedMotion: (video: VideoMetadata, motionData: AiPipelineResult["motionData"]) => void;
  fail: (message: string, cancelled?: boolean) => void;
  setJobId: (jobId: string | null) => void;
  reset: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  isPanelOpen: false,
  currentStep: "idle",
  progress: 0,
  currentFrame: 0,
  message: "Choose a local video to begin.",
  currentVideo: null,
  metadata: null,
  result: null,
  error: null,
  jobId: null,
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setMetadata: (metadata) => set({ metadata }),
  begin: (file) => set({ currentStep: "uploading", progress: 1, currentFrame: 0, message: "Uploading video to local AI service", currentVideo: { name: file.name, size: file.size, type: file.type }, metadata: null, result: null, error: null, jobId: null }),
  updateProgress: (currentStep, progress, currentFrame, message) => set({ currentStep, progress, currentFrame, message }),
  complete: (result) => set({ currentStep: "finished", progress: 100, currentFrame: result.video.total_frames, message: "Motion Data is ready for retargeting.", metadata: result.video, result, error: null, jobId: null }),
  restorePersistedMotion: (video, motionData) => set({ currentStep: "finished", progress: 100, currentFrame: video.total_frames, message: "Restored AI Motion Data from project.", metadata: video, result: { video, motionData, poseFrames: [], originalDataUrl: "", overlayDataUrl: "" }, error: null, jobId: null }),
  fail: (message, cancelled = false) => set({ currentStep: cancelled ? "cancelled" : "failed", message, error: cancelled ? null : message, jobId: null }),
  setJobId: (jobId) => set({ jobId }),
  reset: () => set({ currentStep: "idle", progress: 0, currentFrame: 0, message: "Choose a local video to begin.", currentVideo: null, metadata: null, result: null, error: null, jobId: null })
}));
