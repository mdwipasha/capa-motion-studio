import { useEffect } from "react";
import { getTotalFrames } from "@/lib/motion";
import { useMotionStore } from "@/stores/motion-store";

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}

export function useMotionShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) return;
      const motion = useMotionStore.getState();
      const totalFrames = getTotalFrames(motion.motionData.timeline.fps, motion.motionData.timeline.duration);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? motion.redo() : motion.undo(); return; }
      if (event.code === "Space") { event.preventDefault(); motion.playbackState === "playing" ? motion.pause() : motion.play(); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); motion.setCurrentFrame(motion.currentFrame - 1); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); motion.setCurrentFrame(motion.currentFrame + 1); return; }
      if (event.key === "Delete" && motion.selectedKeyframeId) { event.preventDefault(); motion.removeSelectedKeyframe(); return; }
      if (event.key === "Home") { event.preventDefault(); motion.setCurrentFrame(0); return; }
      if (event.key === "End") { event.preventDefault(); motion.setCurrentFrame(totalFrames); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
