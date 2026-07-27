import type { RigType } from "@/types/project";
import type { MotionData } from "@/types/motion";
import type { PoseFrame } from "@/types/rig";

export type AiToolTab = "video" | "text" | "library" | "loop" | "templates";

export type MotionPresetCategory = "locomotion" | "action" | "emote" | "utility";

export interface GeneratedMotionDraft {
  readonly name: string;
  readonly description: string;
  readonly motionData: MotionData;
  readonly poses: readonly PoseFrame[];
}

export interface MotionPreset {
  readonly id: string;
  readonly name: string;
  readonly category: MotionPresetCategory;
  readonly description: string;
  readonly promptTags: readonly string[];
  readonly duration: number;
  readonly build: (rigType: RigType, fps: number) => GeneratedMotionDraft;
}
