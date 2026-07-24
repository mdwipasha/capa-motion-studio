import { Euler, Quaternion, Vector3 } from "three";
import { cleanupPoses } from "@/features/retarget/lib/cleanup";
import { getRigMapping } from "@/features/retarget/lib/mapping";
import { getRigDefinition } from "@/lib/rig";
import type { AiMotionData, ReconstructedMotionFrame } from "@/types/ai";
import type { MotionData } from "@/types/motion";
import type { RigType } from "@/types/project";
import type { BoneRotation, PoseFrame } from "@/types/rig";
import type { CleanupSettings, RetargetResult } from "@/types/retarget";

const restAxis = new Vector3(0, 1, 0);

function toRotation(frame: ReconstructedMotionFrame, startJoint: string, endJoint: string, previous: Quaternion | undefined): { readonly rotation: BoneRotation; readonly quaternion: Quaternion } | null {
  const start = frame.jointPositions.find((joint) => joint.name === startJoint);
  const end = frame.jointPositions.find((joint) => joint.name === endJoint);
  if (!start || !end || start.confidence < 0.3 || end.confidence < 0.3) return null;
  const direction = new Vector3(end.position[0] - start.position[0], -(end.position[1] - start.position[1]), end.position[2] - start.position[2]);
  if (direction.lengthSq() < 0.000001) return null;
  const next = new Quaternion().setFromUnitVectors(restAxis, direction.normalize());
  const stable = previous ? previous.clone().slerp(next, 0.55) : next;
  const euler = new Euler().setFromQuaternion(stable, "XYZ");
  return { rotation: { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI }, quaternion: stable };
}

function stabilizeRotation(next: BoneRotation, previous: BoneRotation | undefined): BoneRotation {
  if (!previous) return next;
  const closest = (value: number, prior: number): number => {
    const delta = ((value - prior + 540) % 360) - 180;
    return prior + delta;
  };
  return { x: closest(next.x, previous.x), y: closest(next.y, previous.y), z: closest(next.z, previous.z) };
}

export function retargetMotion(source: AiMotionData, rigType: RigType, cleanup: CleanupSettings): RetargetResult {
  const mapping = getRigMapping(rigType);
  const rig = getRigDefinition(rigType);
  if (mapping.rigType !== rigType) throw new Error(`Retarget mapping does not match Roblox ${rigType}.`);
  const missingBone = mapping.bones.find((entry) => !rig.bones.some((bone) => bone.id === entry.boneId));
  if (missingBone) throw new Error(`Retarget mapping references missing bone: ${missingBone.boneId}.`);
  const previous = new Map<string, Quaternion>();
  const previousEuler = new Map<string, BoneRotation>();
  const rawPoses: PoseFrame[] = [];
  for (let index = 0; index < source.reconstruction.length; index += cleanup.sampleStride) {
    const sourceFrame = source.reconstruction[index];
    const rotations: Record<string, BoneRotation> = {};
    for (const entry of mapping.bones) {
      const converted = toRotation(sourceFrame, entry.startJoint, entry.endJoint, previous.get(entry.boneId));
      if (!converted) continue;
      previous.set(entry.boneId, converted.quaternion);
      const stableRotation = stabilizeRotation(converted.rotation, previousEuler.get(entry.boneId));
      previousEuler.set(entry.boneId, stableRotation);
      rotations[entry.boneId] = stableRotation;
    }
    if (Object.keys(rotations).length > 0) rawPoses.push({ frame: sourceFrame.frame, rotations });
  }
  if (rawPoses.length === 0) throw new Error("Retargeting failed: no mapped joints passed the confidence threshold.");
  const poses = cleanupPoses(rawPoses, cleanup);
  const keyframes = poses.map((pose) => ({ id: `retarget-${pose.frame}`, frame: pose.frame }));
  const timeline: MotionData = { version: 1, timeline: { fps: source.timeline.fps, duration: source.timeline.duration, keyframes } };
  return { rigType, poses, motionData: timeline, sourceFrameCount: source.reconstruction.length };
}
