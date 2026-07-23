import type { MotionData } from "@/types/motion";

export type AiPipelineStep = "idle" | "uploading" | "loading_video" | "extracting_frames" | "detecting_pose" | "building_motion" | "finished" | "cancelled" | "failed";

export interface VideoMetadata {
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly duration: number;
  readonly total_frames: number;
}

export interface DetectedJoint {
  readonly name: string;
  readonly position: readonly [number, number, number];
  readonly confidence: number;
}

export interface ReconstructedMotionFrame {
  readonly frame: number;
  readonly timestamp: number;
  readonly jointPositions: readonly (DetectedJoint & { readonly rotation: null })[];
}

export interface AiMotionData extends MotionData {
  readonly reconstruction: readonly ReconstructedMotionFrame[];
}

export interface AiPipelineResult {
  readonly video: VideoMetadata;
  readonly motionData: AiMotionData;
  readonly poseFrames: readonly { readonly frame: number; readonly timestamp: number; readonly joints: readonly DetectedJoint[] }[];
  readonly originalDataUrl: string;
  readonly overlayDataUrl: string;
}

export interface AiJobStatus {
  readonly id: string;
  readonly step: AiPipelineStep;
  readonly progress: number;
  readonly currentFrame: number;
  readonly message: string;
  readonly result: AiPipelineResult | null;
  readonly error: string | null;
  readonly isFinished: boolean;
}
