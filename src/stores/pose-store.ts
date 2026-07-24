import { create } from "zustand";
import { getPoseAtFrame, oneScale, zeroPosition, zeroRotation } from "@/lib/pose";
import { useMotionStore } from "@/stores/motion-store";
import type { BoneRotation, BoneVector, PoseFrame } from "@/types/rig";

interface PoseState {
  poses: readonly PoseFrame[];
  currentPose: PoseFrame;
  undoStack: readonly (readonly PoseFrame[])[];
  redoStack: readonly (readonly PoseFrame[])[];
  syncCurrentPose: (frame: number) => void;
  setBoneRotation: (boneId: string, rotation: BoneRotation, frame: number) => void;
  setBonePosition: (boneId: string, position: BoneVector, frame: number) => void;
  setBoneScale: (boneId: string, scale: BoneVector, frame: number) => void;
  setBoneTransform: (boneId: string, transform: { readonly position: BoneVector; readonly rotation: BoneRotation; readonly scale: BoneVector }, frame: number) => void;
  replacePoses: (poses: readonly PoseFrame[], currentFrame: number) => void;
  resetPoses: () => void;
  undoPose: (currentFrame: number) => boolean;
  redoPose: (currentFrame: number) => boolean;
}

function clonePoses(poses: readonly PoseFrame[]): readonly PoseFrame[] {
  return poses.map((pose) => ({ frame: pose.frame, rotations: { ...pose.rotations }, positions: pose.positions ? { ...pose.positions } : undefined, scales: pose.scales ? { ...pose.scales } : undefined }));
}

function upsertPoseTransform(
  poses: readonly PoseFrame[],
  frame: number,
  updater: (pose: PoseFrame) => PoseFrame
): { readonly poses: readonly PoseFrame[]; readonly currentPose: PoseFrame } {
  const currentFramePose = poses.find((pose) => pose.frame === frame) ?? { frame, rotations: {} };
  const nextPose = updater(currentFramePose);
  const nextPoses = poses.some((pose) => pose.frame === frame) ? poses.map((pose) => pose.frame === frame ? nextPose : pose) : [...poses, nextPose].sort((left, right) => left.frame - right.frame);
  return { poses: nextPoses, currentPose: nextPose };
}

export const usePoseStore = create<PoseState>((set) => ({
  poses: [],
  currentPose: { frame: 0, rotations: {} },
  undoStack: [],
  redoStack: [],
  syncCurrentPose: (frame) => set((state) => {
    const pose = getPoseAtFrame(state.poses, frame);
    return pose === state.currentPose ? state : { currentPose: pose };
  }),
  setBoneRotation: (boneId, rotation, frame) => {
    useMotionStore.getState().ensureKeyframeAt(frame);
    set((state) => {
      const next = upsertPoseTransform(state.poses, frame, (pose) => ({ ...pose, rotations: { ...pose.rotations, [boneId]: rotation } }));
      return { ...next, undoStack: [...state.undoStack, clonePoses(state.poses)].slice(-100), redoStack: [] };
    });
  },
  setBonePosition: (boneId, position, frame) => {
    useMotionStore.getState().ensureKeyframeAt(frame);
    set((state) => {
      const next = upsertPoseTransform(state.poses, frame, (pose) => ({ ...pose, positions: { ...(pose.positions ?? {}), [boneId]: position } }));
      return { ...next, undoStack: [...state.undoStack, clonePoses(state.poses)].slice(-100), redoStack: [] };
    });
  },
  setBoneScale: (boneId, scale, frame) => {
    useMotionStore.getState().ensureKeyframeAt(frame);
    set((state) => {
      const next = upsertPoseTransform(state.poses, frame, (pose) => ({ ...pose, scales: { ...(pose.scales ?? {}), [boneId]: scale } }));
      return { ...next, undoStack: [...state.undoStack, clonePoses(state.poses)].slice(-100), redoStack: [] };
    });
  },
  setBoneTransform: (boneId, transform, frame) => {
    useMotionStore.getState().ensureKeyframeAt(frame);
    set((state) => {
      const next = upsertPoseTransform(state.poses, frame, (pose) => ({
        ...pose,
        positions: { ...(pose.positions ?? {}), [boneId]: transform.position },
        rotations: { ...pose.rotations, [boneId]: transform.rotation },
        scales: { ...(pose.scales ?? {}), [boneId]: transform.scale }
      }));
      return { ...next, undoStack: [...state.undoStack, clonePoses(state.poses)].slice(-100), redoStack: [] };
    });
  },
  replacePoses: (poses, currentFrame) => set(() => {
    const nextPoses = clonePoses(poses);
    return { poses: nextPoses, currentPose: getPoseAtFrame(nextPoses, currentFrame), undoStack: [], redoStack: [] };
  }),
  resetPoses: () => set({ poses: [], currentPose: { frame: 0, rotations: {} }, undoStack: [], redoStack: [] }),
  undoPose: (currentFrame) => {
    let changed = false;
    set((state) => {
      const previous = state.undoStack.at(-1);
      if (!previous) return state;
      changed = true;
      return { poses: previous, currentPose: getPoseAtFrame(previous, currentFrame), undoStack: state.undoStack.slice(0, -1), redoStack: [clonePoses(state.poses), ...state.redoStack].slice(0, 100) };
    });
    return changed;
  },
  redoPose: (currentFrame) => {
    let changed = false;
    set((state) => {
      const next = state.redoStack[0];
      if (!next) return state;
      changed = true;
      return { poses: next, currentPose: getPoseAtFrame(next, currentFrame), undoStack: [...state.undoStack, clonePoses(state.poses)].slice(-100), redoStack: state.redoStack.slice(1) };
    });
    return changed;
  }
}));

export function useBoneRotation(boneId: string): BoneRotation {
  return usePoseStore((state) => state.currentPose.rotations[boneId] ?? zeroRotation);
}

export function useBonePosition(boneId: string): BoneVector {
  return usePoseStore((state) => state.currentPose.positions?.[boneId] ?? zeroPosition);
}

export function useBoneScale(boneId: string): BoneVector {
  return usePoseStore((state) => state.currentPose.scales?.[boneId] ?? oneScale);
}
