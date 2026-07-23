export interface MotionKeyframe {
  readonly id: string;
  readonly frame: number;
}

export interface MotionTimeline {
  readonly fps: number;
  readonly duration: number;
  readonly keyframes: readonly MotionKeyframe[];
}

/** Internal foundation for a future serializable .rma motion document. */
export interface MotionData {
  readonly version: 1;
  readonly timeline: MotionTimeline;
}

export type PlaybackState = "playing" | "paused";
