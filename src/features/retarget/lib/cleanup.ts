import type { BoneRotation, PoseFrame } from "@/types/rig";
import type { CleanupSettings } from "@/types/retarget";

function averageRotation(rotations: readonly BoneRotation[]): BoneRotation {
  const count = rotations.length;
  return { x: rotations.reduce((total, rotation) => total + rotation.x, 0) / count, y: rotations.reduce((total, rotation) => total + rotation.y, 0) / count, z: rotations.reduce((total, rotation) => total + rotation.z, 0) / count };
}

function angularDelta(left: BoneRotation, right: BoneRotation): number {
  return Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y), Math.abs(left.z - right.z));
}

export function cleanupPoses(poses: readonly PoseFrame[], settings: CleanupSettings): PoseFrame[] {
  const smoothed = poses.map((pose, index) => {
    const start = Math.max(0, index - settings.smoothingWindow);
    const end = Math.min(poses.length, index + settings.smoothingWindow + 1);
    const neighboring = poses.slice(start, end);
    const rotations = Object.fromEntries(Object.keys(pose.rotations).map((boneId) => [boneId, averageRotation(neighboring.map((frame) => frame.rotations[boneId] ?? pose.rotations[boneId]))]));
    return { frame: pose.frame, rotations };
  });
  return smoothed.filter((pose, index) => {
    if (index === 0 || index === smoothed.length - 1) return true;
    const previous = smoothed[index - 1];
    return Object.keys(pose.rotations).some((boneId) => angularDelta(pose.rotations[boneId], previous.rotations[boneId] ?? pose.rotations[boneId]) >= settings.reductionThresholdDegrees);
  });
}
