import { create } from "zustand";
import { getPoseAtFrame, zeroRotation } from "@/lib/pose";
import { useMotionStore } from "@/stores/motion-store";
import type { BoneRotation, PoseFrame } from "@/types/rig";

interface PoseState {
  poses: readonly PoseFrame[];
  currentPose: PoseFrame;
  syncCurrentPose: (frame: number) => void;
  setBoneRotation: (boneId: string, rotation: BoneRotation, frame: number) => void;
  replacePoses: (poses: readonly PoseFrame[], currentFrame: number) => void;
  resetPoses: () => void;
}

export const usePoseStore = create<PoseState>((set) => ({
  poses: [],
  currentPose: { frame: 0, rotations: {} },
  syncCurrentPose: (frame) => set((state) => {
    const pose = getPoseAtFrame(state.poses, frame);
    return pose === state.currentPose ? state : { currentPose: pose };
  }),
  setBoneRotation: (boneId, rotation, frame) => {
    useMotionStore.getState().ensureKeyframeAt(frame);
    set((state) => {
      const currentFramePose = state.poses.find((pose) => pose.frame === frame);
      const nextPose: PoseFrame = { frame, rotations: { ...(currentFramePose?.rotations ?? {}), [boneId]: rotation } };
      const poses = currentFramePose ? state.poses.map((pose) => pose.frame === frame ? nextPose : pose) : [...state.poses, nextPose].sort((left, right) => left.frame - right.frame);
      return { poses, currentPose: nextPose };
    });
  },
  replacePoses: (poses, currentFrame) => set(() => {
    const nextPoses = poses.map((pose) => ({ frame: pose.frame, rotations: { ...pose.rotations } }));
    return { poses: nextPoses, currentPose: getPoseAtFrame(nextPoses, currentFrame) };
  }),
  resetPoses: () => set({ poses: [], currentPose: { frame: 0, rotations: {} } })
}));

export function useBoneRotation(boneId: string): BoneRotation {
  return usePoseStore((state) => state.currentPose.rotations[boneId] ?? zeroRotation);
}
