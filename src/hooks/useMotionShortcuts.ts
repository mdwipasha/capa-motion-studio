import { useEffect } from "react";
import { getTotalFrames } from "@/lib/motion";
import { useMotionStore } from "@/stores/motion-store";
import { usePoseStore } from "@/stores/pose-store";
import { useRigStore } from "@/stores/rig-store";
import type { BoneRotation, BoneVector } from "@/types/rig";

interface TransformClipboard {
  readonly position: BoneVector;
  readonly rotation: BoneRotation;
  readonly scale: BoneVector;
}

let transformClipboard: TransformClipboard | null = null;

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}

export function useMotionShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) return;
      const motion = useMotionStore.getState();
      const pose = usePoseStore.getState();
      const rig = useRigStore.getState();
      const totalFrames = getTotalFrames(motion.motionData.timeline.fps, motion.motionData.timeline.duration);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) { if (!pose.redoPose(motion.currentFrame)) motion.redo(); } else if (!pose.undoPose(motion.currentFrame)) motion.undo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); if (!pose.redoPose(motion.currentFrame)) motion.redo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && rig.selectedBoneId) {
        event.preventDefault();
        transformClipboard = {
          position: pose.currentPose.positions?.[rig.selectedBoneId] ?? { x: 0, y: 0, z: 0 },
          rotation: pose.currentPose.rotations[rig.selectedBoneId] ?? { x: 0, y: 0, z: 0 },
          scale: pose.currentPose.scales?.[rig.selectedBoneId] ?? { x: 1, y: 1, z: 1 }
        };
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v" && rig.selectedBoneId && transformClipboard) {
        event.preventDefault();
        pose.setBoneTransform(rig.selectedBoneId, transformClipboard, motion.currentFrame);
        return;
      }
      if (event.code === "Space") { event.preventDefault(); motion.playbackState === "playing" ? motion.pause() : motion.play(); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); motion.setCurrentFrame(motion.currentFrame - 1); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); motion.setCurrentFrame(motion.currentFrame + 1); return; }
      if ((event.key === "Delete" || event.key === "Backspace") && motion.selectedKeyframeId) { event.preventDefault(); motion.removeSelectedKeyframe(); return; }
      if (event.key === "Home") { event.preventDefault(); motion.setCurrentFrame(0); return; }
      if (event.key === "End") { event.preventDefault(); motion.setCurrentFrame(totalFrames); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
