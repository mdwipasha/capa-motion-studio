import type { BoneRotation, BoneVector, PoseFrame } from "@/types/rig";

export const zeroRotation: BoneRotation = Object.freeze({ x: 0, y: 0, z: 0 });
export const zeroPosition: BoneVector = Object.freeze({ x: 0, y: 0, z: 0 });
export const oneScale: BoneVector = Object.freeze({ x: 1, y: 1, z: 1 });
const restPose: PoseFrame = Object.freeze({ frame: 0, rotations: {} });

export function getPoseAtFrame(poses: readonly PoseFrame[], frame: number): PoseFrame {
  let pose: PoseFrame = restPose;
  for (const candidate of poses) { if (candidate.frame > frame) break; pose = candidate; }
  return pose;
}

export function degreesToRadians(rotation: BoneRotation): [number, number, number] { return [rotation.x * Math.PI / 180, rotation.y * Math.PI / 180, rotation.z * Math.PI / 180]; }
export function radiansToDegrees(rotation: readonly [number, number, number]): BoneRotation { return { x: rotation[0] * 180 / Math.PI, y: rotation[1] * 180 / Math.PI, z: rotation[2] * 180 / Math.PI }; }

const robloxVector3Pattern = /^rotation\s*=\s*Vector3\.new\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/i;

export function formatRobloxVector3Rotation(rotation: BoneRotation): string {
  return `rotation = Vector3.new(${rotation.x}, ${rotation.y}, ${rotation.z})`;
}

export function parseRobloxVector3Rotation(value: string): BoneRotation | null {
  const match = value.trim().match(robloxVector3Pattern);
  if (!match) return null;
  const [, x, y, z] = match;
  return { x: Number(x), y: Number(y), z: Number(z) };
}
