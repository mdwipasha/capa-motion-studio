import { useEffect, useRef } from "react";
import { getTotalFrames } from "@/lib/motion";
import { useMotionStore } from "@/stores/motion-store";

export function usePlayback(): void {
  const playbackState = useMotionStore((state) => state.playbackState);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    if (playbackState !== "playing") return;
    let lastTime: number | null = null;
    let accumulatedTime = 0;
    function tick(now: number): void {
      if (lastTime !== null) {
        accumulatedTime += now - lastTime;
        const motion = useMotionStore.getState();
        const frameDuration = 1000 / motion.motionData.timeline.fps;
        const framesToAdvance = Math.floor(accumulatedTime / frameDuration);
        if (framesToAdvance > 0) {
          accumulatedTime -= framesToAdvance * frameDuration;
          const totalFrames = getTotalFrames(motion.motionData.timeline.fps, motion.motionData.timeline.duration);
          const nextFrame = motion.currentFrame + framesToAdvance;
          if (nextFrame >= totalFrames) { motion.setCurrentFrame(totalFrames, false); motion.pause(); return; }
          motion.setCurrentFrame(nextFrame, false);
        }
      }
      lastTime = now;
      animationFrame.current = window.requestAnimationFrame(tick);
    }
    animationFrame.current = window.requestAnimationFrame(tick);
    return () => { if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current); animationFrame.current = null; };
  }, [playbackState]);
}
