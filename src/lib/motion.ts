import type { MotionKeyframe } from "@/types/motion";

export function getTotalFrames(fps: number, duration: number): number {
  return Math.max(1, Math.round(fps * duration));
}

export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, "0")}`;
}

export function keyframeAtFrame(keyframes: readonly MotionKeyframe[], frame: number): MotionKeyframe | undefined {
  return keyframes.find((keyframe) => keyframe.frame === frame);
}
