import { useEffect } from "react";
import { useMotionStore } from "@/stores/motion-store";
import { usePoseStore } from "@/stores/pose-store";

/** Keeps the active pose aligned with the timeline's current frame. */
export function usePoseTimeline(): void {
  const currentFrame = useMotionStore((state) => state.currentFrame);
  const syncCurrentPose = usePoseStore((state) => state.syncCurrentPose);
  useEffect(() => { syncCurrentPose(currentFrame); }, [currentFrame, syncCurrentPose]);
}
