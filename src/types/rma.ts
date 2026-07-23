import type { MotionKeyframe } from "@/types/motion";
import type { AiMotionData, VideoMetadata } from "@/types/ai";
import type { ProjectMetadata, RigType } from "@/types/project";
import type { PoseFrame } from "@/types/rig";

export const rmaFormatVersion = 1 as const;

export interface RmaCameraSettings {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export interface RmaEditorSettings {
  readonly autosaveEnabled: boolean;
  readonly autosaveIntervalSeconds: number;
  readonly defaultFps: number;
  readonly isBottomPanelOpen: boolean;
}

export interface RmaProjectFile {
  readonly format: "capa-motion-rma";
  readonly version: typeof rmaFormatVersion;
  readonly project: ProjectMetadata;
  readonly rig: { readonly type: RigType; readonly selectedBoneId: string | null };
  readonly timeline: {
    readonly fps: number;
    readonly duration: number;
    readonly currentFrame: number;
  };
  readonly motion: {
    readonly keyframes: readonly MotionKeyframe[];
    readonly boneRotations: readonly PoseFrame[];
    readonly aiMotion?: { readonly video: VideoMetadata; readonly motionData: AiMotionData };
  };
  readonly settings: {
    readonly camera: RmaCameraSettings;
    readonly editor: RmaEditorSettings;
    readonly viewport: { readonly backgroundColor: string; readonly isGridVisible: boolean };
  };
  readonly metadata: { readonly appVersion: string };
}
