import type { FileImporter } from "@/types/transfer";
import type { MotionData } from "@/types/motion";
import type { PoseFrame } from "@/types/rig";

export interface FbxImportDocument {
  readonly motionData: MotionData;
  readonly poses: readonly PoseFrame[];
  readonly modelCount: number;
}

const fbxTicksPerSecond = 46_186_158_000;

function numbers(value: string): readonly number[] {
  return value.split(",").map((item) => Number(item.trim())).filter(Number.isFinite);
}

function readCurves(content: string): readonly PoseFrame[] {
  const byFrame = new Map<number, PoseFrame>();
  const curvePattern = /AnimationCurve:\s*\d+,\s*"AnimCurve::([^"]+)",\s*""\s*\{([\s\S]*?)\n\t\}/g;
  let match: RegExpExecArray | null;
  while ((match = curvePattern.exec(content)) !== null) {
    const [, name, block] = match;
    const nameMatch = /^(.+)_(Translation|Rotation|Scaling)_([XYZ])$/.exec(name);
    if (!nameMatch) continue;
    const [, boneId, property, axisName] = nameMatch;
    const timeMatch = /KeyTime:\s*\*\d+\s*\{\s*a:\s*([^}]+)\}/.exec(block);
    const valueMatch = /KeyValueFloat:\s*\*\d+\s*\{\s*a:\s*([^}]+)\}/.exec(block);
    if (!timeMatch || !valueMatch) continue;
    const times = numbers(timeMatch[1]);
    const values = numbers(valueMatch[1]);
    const axis = axisName.toLowerCase() as "x" | "y" | "z";
    times.forEach((time, index) => {
      const frame = Math.round(time / fbxTicksPerSecond * 30);
      const current = byFrame.get(frame) ?? { frame, rotations: {} };
      const value = values[index] ?? (property === "Scaling" ? 1 : 0);
      if (property === "Translation") byFrame.set(frame, { ...current, positions: { ...(current.positions ?? {}), [boneId]: { ...(current.positions?.[boneId] ?? { x: 0, y: 0, z: 0 }), [axis]: value } } });
      if (property === "Rotation") byFrame.set(frame, { ...current, rotations: { ...current.rotations, [boneId]: { ...(current.rotations[boneId] ?? { x: 0, y: 0, z: 0 }), [axis]: value } } });
      if (property === "Scaling") byFrame.set(frame, { ...current, scales: { ...(current.scales ?? {}), [boneId]: { ...(current.scales?.[boneId] ?? { x: 1, y: 1, z: 1 }), [axis]: value } } });
    });
  }
  return [...byFrame.values()].sort((left, right) => left.frame - right.frame);
}

export const fbxImporter: FileImporter<FbxImportDocument> = {
  id: "fbx",
  label: "Autodesk FBX (.fbx)",
  extensions: [".fbx"],
  canImport: (file) => file.name.toLowerCase().endsWith(".fbx"),
  import: async (file) => {
    const content = await file.text();
    if (!/FBXHeaderExtension|Kaydara FBX Binary/i.test(content.slice(0, 2048))) {
      return { ok: false, message: "This does not look like a valid FBX file." };
    }
    if (/Kaydara FBX Binary/i.test(content.slice(0, 64))) {
      return { ok: false, message: "Binary FBX was detected. Convert to ASCII FBX before importing in this build." };
    }
    const modelCount = [...content.matchAll(/Model:\s*\d+,\s*"Model::([^"]+)"/g)].length;
    const poses = readCurves(content);
    if (poses.length === 0) return { ok: true, message: `Imported ${file.name}. Skeleton/mesh detected: ${modelCount} models. No supported animation curves were found.`, document: { modelCount, poses: [], motionData: { version: 1, timeline: { fps: 30, duration: 4, keyframes: [] } } } };
    const lastFrame = poses.at(-1)?.frame ?? 0;
    const motionData: MotionData = { version: 1, timeline: { fps: 30, duration: Math.max(1, Math.ceil(lastFrame / 30)), keyframes: poses.map((pose) => ({ id: `fbx-${pose.frame}`, frame: pose.frame })) } };
    return { ok: true, message: `Imported ${file.name}. Loaded ${poses.length} animated frames from ${modelCount} FBX models.`, document: { modelCount, poses, motionData } };
  }
};
