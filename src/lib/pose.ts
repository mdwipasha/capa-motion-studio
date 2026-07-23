import type { BoneRotation, PoseFrame } from "@/types/rig";

export const zeroRotation: BoneRotation = Object.freeze({ x: 0, y: 0, z: 0 });
const restPose: PoseFrame = Object.freeze({ frame: 0, rotations: {} });

export function getPoseAtFrame(poses: readonly PoseFrame[], frame: number): PoseFrame {
  let pose: PoseFrame = restPose;
  for (const candidate of poses) { if (candidate.frame > frame) break; pose = candidate; }
  return pose;
}

export function degreesToRadians(rotation: BoneRotation): [number, number, number] { return [rotation.x * Math.PI / 180, rotation.y * Math.PI / 180, rotation.z * Math.PI / 180]; }
