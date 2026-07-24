import { getTotalFrames } from "@/lib/motion";
import type { MotionData, MotionKeyframe } from "@/types/motion";
import { rigTypes, type ProjectMetadata } from "@/types/project";
import { rmaFormatVersion, type RmaProjectFile } from "@/types/rma";
import type { BoneRotation, BoneVector, PoseFrame } from "@/types/rig";

export const appVersion = "0.8.0";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isVector3Object(value: unknown): value is BoneVector {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFiniteNumber(value.z);
}

function isRotation(value: unknown): value is BoneRotation {
  return isVector3Object(value);
}

function isVectorRecord(value: unknown): value is Readonly<Record<string, BoneVector>> {
  return value === undefined || (isRecord(value) && Object.values(value).every(isVector3Object));
}

function isPoseFrame(value: unknown): value is PoseFrame {
  return isRecord(value) && isFiniteNumber(value.frame) && isRecord(value.rotations) && Object.values(value.rotations).every(isRotation) && isVectorRecord(value.positions) && isVectorRecord(value.scales);
}

function isKeyframe(value: unknown): value is MotionKeyframe {
  return isRecord(value) && typeof value.id === "string" && isFiniteNumber(value.frame);
}

function isVector(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);
}

function isAiMotion(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.video) || !isRecord(value.motionData) || !Array.isArray(value.motionData.reconstruction)) return false;
  return isFiniteNumber(value.video.width) && isFiniteNumber(value.video.height) && isFiniteNumber(value.video.fps) && isFiniteNumber(value.video.duration) && isFiniteNumber(value.video.total_frames);
}

function hasProjectMetadata(value: unknown): value is ProjectMetadata {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && rigTypes.includes(value.rigType as ProjectMetadata["rigType"]) && typeof value.createdAt === "string" && typeof value.updatedAt === "string";
}

export function validateRmaProject(value: unknown): RmaProjectFile {
  if (!isRecord(value) || value.format !== "capa-motion-rma") throw new Error("This file is not a CapaMotion .rma project.");
  if (value.version !== rmaFormatVersion) throw new Error(`Unsupported .rma version: ${String(value.version)}.`);
  if (!hasProjectMetadata(value.project)) throw new Error("The project metadata is missing or invalid.");
  if (!isRecord(value.rig) || !rigTypes.includes(value.rig.type as ProjectMetadata["rigType"])) throw new Error("The rig type must be R6 or R15.");
  if (value.project.rigType !== value.rig.type) throw new Error("Project and rig metadata do not match.");
  if (!isRecord(value.timeline) || !isFiniteNumber(value.timeline.fps) || !isFiniteNumber(value.timeline.duration) || !isFiniteNumber(value.timeline.currentFrame)) throw new Error("The timeline data is incomplete.");
  if (value.timeline.fps < 1 || value.timeline.fps > 60 || value.timeline.duration < 1 || value.timeline.duration > 60) throw new Error("The timeline FPS or duration is out of range.");
  if (value.timeline.currentFrame < 0 || value.timeline.currentFrame > getTotalFrames(value.timeline.fps, value.timeline.duration)) throw new Error("The current frame is out of range.");
  if (!isRecord(value.motion) || !Array.isArray(value.motion.keyframes) || !value.motion.keyframes.every(isKeyframe) || !Array.isArray(value.motion.boneRotations) || !value.motion.boneRotations.every(isPoseFrame)) throw new Error("The motion data is invalid.");
  if (value.motion.aiMotion !== undefined && !isAiMotion(value.motion.aiMotion)) throw new Error("The reconstructed AI motion data is invalid.");
  if (!isRecord(value.settings) || !isRecord(value.settings.camera) || !isVector(value.settings.camera.position) || !isVector(value.settings.camera.target) || !isRecord(value.settings.editor) || !isRecord(value.settings.viewport)) throw new Error("The editor settings are incomplete.");
  if (typeof value.settings.editor.autosaveEnabled !== "boolean" || !isFiniteNumber(value.settings.editor.autosaveIntervalSeconds) || !isFiniteNumber(value.settings.editor.defaultFps) || typeof value.settings.editor.isBottomPanelOpen !== "boolean" || typeof value.settings.viewport.backgroundColor !== "string" || typeof value.settings.viewport.isGridVisible !== "boolean") throw new Error("The editor settings are invalid.");
  if (!isRecord(value.metadata) || typeof value.metadata.appVersion !== "string") throw new Error("The application metadata is missing.");
  return value as unknown as RmaProjectFile;
}

export function parseRmaProject(content: string): RmaProjectFile {
  try {
    return validateRmaProject(JSON.parse(content) as unknown);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unable to parse the .rma project.");
  }
}

export function toMotionData(document: RmaProjectFile): MotionData {
  return { version: 1, timeline: { fps: document.timeline.fps, duration: document.timeline.duration, keyframes: document.motion.keyframes } };
}
