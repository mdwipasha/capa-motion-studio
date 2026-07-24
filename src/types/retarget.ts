import type { MotionData } from "@/types/motion";
import type { RigType } from "@/types/project";
import type { PoseFrame } from "@/types/rig";

export type RetargetQuality = "fast" | "balanced" | "high";
export type RetargetStep = "idle" | "retargeting" | "cleanup" | "building_timeline" | "exporting" | "completed" | "failed";
export type PreviewMode = "before" | "after" | "split";

export interface BoneMappingEntry {
  readonly boneId: string;
  readonly startJoint: string;
  readonly endJoint: string;
}

export interface RigBoneMapping {
  readonly rigType: RigType;
  readonly bones: readonly BoneMappingEntry[];
}

export interface CleanupSettings {
  readonly smoothingWindow: number;
  readonly reductionThresholdDegrees: number;
  readonly sampleStride: number;
}

export interface RetargetResult {
  readonly rigType: RigType;
  readonly poses: readonly PoseFrame[];
  readonly motionData: MotionData;
  readonly sourceFrameCount: number;
}
