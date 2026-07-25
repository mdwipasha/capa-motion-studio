import type { GeneratedMotionDraft, MotionPreset } from "@/types/ai-tools";
import type { MotionData, MotionKeyframe } from "@/types/motion";
import type { RigType } from "@/types/project";
import type { BoneRotation, PoseFrame } from "@/types/rig";

type RotationMap = Record<string, BoneRotation>;

const zero = Object.freeze({ x: 0, y: 0, z: 0 });

function keyframes(frames: readonly number[]): readonly MotionKeyframe[] {
  return frames.map((frame) => ({ id: crypto.randomUUID(), frame }));
}

function draft(name: string, description: string, fps: number, duration: number, poses: readonly PoseFrame[]): GeneratedMotionDraft {
  const frames = poses.map((pose) => pose.frame);
  const motionData: MotionData = { version: 1, timeline: { fps, duration, keyframes: keyframes(frames) } };
  return { name, description, motionData, poses };
}

function frame(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

function upperTorso(rigType: RigType): string {
  return rigType === "R6" ? "Torso" : "UpperTorso";
}

function lowerTorso(rigType: RigType): string {
  return rigType === "R6" ? "Root" : "LowerTorso";
}

function leftArm(rigType: RigType): string {
  return rigType === "R6" ? "LeftArm" : "LeftUpperArm";
}

function rightArm(rigType: RigType): string {
  return rigType === "R6" ? "RightArm" : "RightUpperArm";
}

function leftLeg(rigType: RigType): string {
  return rigType === "R6" ? "LeftLeg" : "LeftUpperLeg";
}

function rightLeg(rigType: RigType): string {
  return rigType === "R6" ? "RightLeg" : "RightUpperLeg";
}

function lowerLimbRotations(rigType: RigType, side: "left" | "right", rotation: BoneRotation): RotationMap {
  if (rigType === "R6") return {};
  const arm = side === "left" ? "LeftLowerArm" : "RightLowerArm";
  const leg = side === "left" ? "LeftLowerLeg" : "RightLowerLeg";
  return { [arm]: rotation, [leg]: rotation };
}

function pose(frameNumber: number, rotations: RotationMap, rootY = 0): PoseFrame {
  return {
    frame: frameNumber,
    rotations,
    positions: rootY === 0 ? undefined : { Root: { x: 0, y: rootY, z: 0 } }
  };
}

function idle(rigType: RigType, fps: number): GeneratedMotionDraft {
  const torso = upperTorso(rigType);
  const lArm = leftArm(rigType);
  const rArm = rightArm(rigType);
  const poses = [
    pose(0, { [torso]: { x: 0, y: 0, z: 0 }, [lArm]: { x: 4, y: 0, z: -5 }, [rArm]: { x: 4, y: 0, z: 5 } }),
    pose(frame(0.5, fps), { [torso]: { x: 1.5, y: 0, z: 0 }, [lArm]: { x: 7, y: 0, z: -7 }, [rArm]: { x: 7, y: 0, z: 7 } }, 0.03),
    pose(frame(1, fps), { [torso]: zero, [lArm]: { x: 4, y: 0, z: -5 }, [rArm]: { x: 4, y: 0, z: 5 } })
  ];
  return draft("Idle Breathing", "Subtle looping idle motion.", fps, 1, poses);
}

function wave(rigType: RigType, fps: number): GeneratedMotionDraft {
  const torso = upperTorso(rigType);
  const rArm = rightArm(rigType);
  const poses = [
    pose(0, { [torso]: zero, [rArm]: { x: -20, y: 0, z: 45 } }),
    pose(frame(0.35, fps), { [torso]: { x: 0, y: -5, z: 0 }, [rArm]: { x: -95, y: 0, z: 70 }, ...lowerLimbRotations(rigType, "right", { x: -35, y: 0, z: 15 }) }),
    pose(frame(0.7, fps), { [torso]: { x: 0, y: 5, z: 0 }, [rArm]: { x: -85, y: 0, z: 35 }, ...lowerLimbRotations(rigType, "right", { x: -20, y: 0, z: -18 }) }),
    pose(frame(1.05, fps), { [torso]: { x: 0, y: -5, z: 0 }, [rArm]: { x: -95, y: 0, z: 70 }, ...lowerLimbRotations(rigType, "right", { x: -35, y: 0, z: 15 }) }),
    pose(frame(1.4, fps), { [torso]: zero, [rArm]: { x: -20, y: 0, z: 45 } })
  ];
  return draft("Friendly Wave", "Right-arm wave draft for emotes.", fps, 1.4, poses);
}

function jump(rigType: RigType, fps: number): GeneratedMotionDraft {
  const torso = upperTorso(rigType);
  const lArm = leftArm(rigType);
  const rArm = rightArm(rigType);
  const lLeg = leftLeg(rigType);
  const rLeg = rightLeg(rigType);
  const poses = [
    pose(0, { [torso]: { x: 0, y: 0, z: 0 }, [lArm]: { x: 18, y: 0, z: -15 }, [rArm]: { x: 18, y: 0, z: 15 }, [lLeg]: { x: 8, y: 0, z: 3 }, [rLeg]: { x: 8, y: 0, z: -3 } }),
    pose(frame(0.25, fps), { [torso]: { x: 14, y: 0, z: 0 }, [lArm]: { x: 32, y: 0, z: -28 }, [rArm]: { x: 32, y: 0, z: 28 }, [lLeg]: { x: -22, y: 0, z: 5 }, [rLeg]: { x: -22, y: 0, z: -5 } }, -0.12),
    pose(frame(0.55, fps), { [torso]: { x: -8, y: 0, z: 0 }, [lArm]: { x: -68, y: 0, z: -12 }, [rArm]: { x: -68, y: 0, z: 12 }, [lLeg]: { x: 18, y: 0, z: 7 }, [rLeg]: { x: 18, y: 0, z: -7 } }, 0.42),
    pose(frame(0.9, fps), { [torso]: { x: 7, y: 0, z: 0 }, [lArm]: { x: 24, y: 0, z: -18 }, [rArm]: { x: 24, y: 0, z: 18 }, [lLeg]: { x: -18, y: 0, z: 4 }, [rLeg]: { x: -18, y: 0, z: -4 } }, -0.05),
    pose(frame(1.15, fps), { [torso]: zero, [lArm]: zero, [rArm]: zero, [lLeg]: zero, [rLeg]: zero })
  ];
  return draft("Jump", "Anticipation, takeoff, airtime, and landing.", fps, 1.15, poses);
}

function runLoop(rigType: RigType, fps: number): GeneratedMotionDraft {
  const torso = upperTorso(rigType);
  const hips = lowerTorso(rigType);
  const lArm = leftArm(rigType);
  const rArm = rightArm(rigType);
  const lLeg = leftLeg(rigType);
  const rLeg = rightLeg(rigType);
  const poses = [
    pose(0, { [hips]: { x: 0, y: 0, z: 0 }, [torso]: { x: 8, y: 0, z: 0 }, [lArm]: { x: -38, y: 0, z: -8 }, [rArm]: { x: 38, y: 0, z: 8 }, [lLeg]: { x: 36, y: 0, z: 0 }, [rLeg]: { x: -34, y: 0, z: 0 } }, 0.03),
    pose(frame(0.25, fps), { [hips]: { x: 0, y: 0, z: 2 }, [torso]: { x: 10, y: 0, z: -2 }, [lArm]: { x: 8, y: 0, z: -8 }, [rArm]: { x: -8, y: 0, z: 8 }, [lLeg]: { x: 2, y: 0, z: 0 }, [rLeg]: { x: 4, y: 0, z: 0 } }, -0.02),
    pose(frame(0.5, fps), { [hips]: { x: 0, y: 0, z: 0 }, [torso]: { x: 8, y: 0, z: 0 }, [lArm]: { x: 38, y: 0, z: -8 }, [rArm]: { x: -38, y: 0, z: 8 }, [lLeg]: { x: -34, y: 0, z: 0 }, [rLeg]: { x: 36, y: 0, z: 0 } }, 0.03),
    pose(frame(0.75, fps), { [hips]: { x: 0, y: 0, z: -2 }, [torso]: { x: 10, y: 0, z: 2 }, [lArm]: { x: -8, y: 0, z: -8 }, [rArm]: { x: 8, y: 0, z: 8 }, [lLeg]: { x: 4, y: 0, z: 0 }, [rLeg]: { x: 2, y: 0, z: 0 } }, -0.02),
    pose(frame(1, fps), { [hips]: { x: 0, y: 0, z: 0 }, [torso]: { x: 8, y: 0, z: 0 }, [lArm]: { x: -38, y: 0, z: -8 }, [rArm]: { x: 38, y: 0, z: 8 }, [lLeg]: { x: 36, y: 0, z: 0 }, [rLeg]: { x: -34, y: 0, z: 0 } }, 0.03)
  ];
  return draft("Run Loop", "One-second editable run cycle.", fps, 1, poses);
}

export const motionPresets: readonly MotionPreset[] = [
  { id: "idle", name: "Idle Breathing", category: "utility", description: "Subtle loop-ready breathing motion.", promptTags: ["idle", "stand", "breathing", "calm"], duration: 1, build: idle },
  { id: "wave", name: "Friendly Wave", category: "emote", description: "Simple right-hand wave emote.", promptTags: ["wave", "hello", "hi", "emote"], duration: 1.4, build: wave },
  { id: "jump", name: "Jump", category: "action", description: "Jump with anticipation and landing.", promptTags: ["jump", "hop", "leap"], duration: 1.15, build: jump },
  { id: "run", name: "Run Loop", category: "locomotion", description: "Loop-ready run cycle.", promptTags: ["run", "sprint", "jog", "walk"], duration: 1, build: runLoop }
];

export function generateTextMotion(prompt: string, rigType: RigType, fps: number): GeneratedMotionDraft {
  const normalized = prompt.toLowerCase();
  const preset = motionPresets.find((candidate) => candidate.promptTags.some((tag) => normalized.includes(tag))) ?? motionPresets[0];
  return { ...preset.build(rigType, fps), description: `Generated from prompt: "${prompt.trim() || preset.name}"` };
}

export function createAutoLoopDraft(poses: readonly PoseFrame[], fps: number, currentDuration: number): GeneratedMotionDraft {
  const sorted = [...poses].sort((left, right) => left.frame - right.frame);
  if (sorted.length === 0) throw new Error("Create at least one pose before using Auto Loop.");
  const first = sorted[0];
  const last = sorted.at(-1) ?? first;
  const loopFrame = Math.max(last.frame + Math.round(fps * 0.25), Math.round(currentDuration * fps));
  const loopPose: PoseFrame = { ...first, frame: loopFrame };
  const nextPoses = [...sorted, loopPose];
  return draft("Auto Loop", "Adds a final pose matching the first pose for seamless looping.", fps, Math.max(currentDuration, loopFrame / fps), nextPoses);
}
