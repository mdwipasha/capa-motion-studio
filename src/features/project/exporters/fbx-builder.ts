import { getRigDefinition } from "@/lib/rig";
import type { MotionData } from "@/types/motion";
import type { RigType } from "@/types/project";
import type { PoseFrame } from "@/types/rig";

export interface FbxExportInput {
  readonly projectName: string;
  readonly rigType: RigType;
  readonly motionData: MotionData;
  readonly poses: readonly PoseFrame[];
}

const fbxTicksPerSecond = 46_186_158_000;

function idAt(index: number): number { return 1_000_000 + index; }
function formatNumber(value: number): string { return Number.isFinite(value) ? value.toFixed(6) : "0.000000"; }

function curve(id: number, axis: "X" | "Y" | "Z", frames: readonly PoseFrame[], boneId: string, fps: number): string {
  const values = frames.map((frame) => frame.rotations[boneId]?.[axis.toLowerCase() as "x" | "y" | "z"] ?? 0);
  const times = frames.map((frame) => Math.round(frame.frame / fps * fbxTicksPerSecond));
  return `\tAnimationCurve: ${id}, "AnimCurve::${boneId}_${axis}", "" {\n\t\tDefault: 0\n\t\tKeyVer: 4008\n\t\tKeyTime: *${times.length} { a: ${times.join(",")} }\n\t\tKeyValueFloat: *${values.length} { a: ${values.map(formatNumber).join(",")} }\n\t\tKeyAttrFlags: *${values.length} { a: ${values.map(() => "24836").join(",")} }\n\t\tKeyAttrDataFloat: *${values.length * 4} { a: ${values.flatMap(() => ["0", "0", "255790911", "0"]).join(",")} }\n\t\tKeyAttrRefCount: *${values.length} { a: ${values.map(() => "1").join(",")} }\n\t}`;
}

/** Minimal ASCII FBX 7.4 skeleton and rotation-curve writer. It has no mesh data. */
export function buildAsciiFbx(input: FbxExportInput): string {
  const definition = getRigDefinition(input.rigType);
  const { fps } = input.motionData.timeline;
  const poses = input.poses.length > 0 ? input.poses : [{ frame: 0, rotations: {} }];
  const stackId = 10_000;
  const layerId = 10_001;
  const modelIds = new Map(definition.bones.map((bone, index) => [bone.id, idAt(index)]));
  const modelObjects = definition.bones.map((bone, index) => `\tModel: ${idAt(index)}, "Model::${bone.id}", "LimbNode" {\n\t\tVersion: 232\n\t\tProperties70:  {\n\t\t\tP: "Lcl Translation", "Lcl Translation", "", "A",${bone.position.map(formatNumber).join(",")}\n\t\t\tP: "Lcl Rotation", "Lcl Rotation", "", "A",0,0,0\n\t\t\tP: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1\n\t\t}\n\t}`).join("\n");
  let nextId = 20_000;
  const curveNodes: string[] = [];
  const curves: string[] = [];
  const curveConnections: string[] = [];
  for (const bone of definition.bones) {
    const nodeId = nextId++;
    curveNodes.push(`\tAnimationCurveNode: ${nodeId}, "AnimCurveNode::${bone.id}_Rotation", "" {\n\t\tProperties70:  {\n\t\t\tP: "d|X", "Number", "", "A",0\n\t\t\tP: "d|Y", "Number", "", "A",0\n\t\t\tP: "d|Z", "Number", "", "A",0\n\t\t}\n\t}`);
    curveConnections.push(`\tC: "OO",${nodeId},${modelIds.get(bone.id)}`);
    curveConnections.push(`\tC: "OP",${nodeId},${modelIds.get(bone.id)},"Lcl Rotation"`);
    for (const axis of ["X", "Y", "Z"] as const) {
      const curveId = nextId++;
      curves.push(curve(curveId, axis, poses, bone.id, fps));
      curveConnections.push(`\tC: "OP",${curveId},${nodeId},"d|${axis}"`);
    }
  }
  const hierarchy = definition.bones.map((bone) => `\tC: "OO",${modelIds.get(bone.id)},${bone.parentId ? modelIds.get(bone.parentId) : 0}`).join("\n");
  return `; FBX 7.4.0 generated locally by CapaMotion\n; Roblox ${input.rigType} animation draft: ${input.projectName}\nFBXHeaderExtension:  {\n\tFBXHeaderVersion: 1003\n\tFBXVersion: 7400\n\tCreator: "CapaMotion"\n}\nGlobalSettings:  {\n\tVersion: 1000\n\tProperties70:  {\n\t\tP: "TimeMode", "enum", "", "",6\n\t\tP: "CustomFrameRate", "double", "Number", "",${formatNumber(fps)}\n\t}\n}\nDefinitions:  {\n\tVersion: 100\n}\nObjects:  {\n${modelObjects}\n\tAnimationStack: ${stackId}, "AnimStack::Take 001", "" {\n\t\tProperties70:  {\n\t\t\tP: "LocalStart", "KTime", "Time", "",0\n\t\t\tP: "LocalStop", "KTime", "Time", "",${Math.round(input.motionData.timeline.duration * fbxTicksPerSecond)}\n\t\t}\n\t}\n\tAnimationLayer: ${layerId}, "AnimLayer::BaseLayer", "" {\n\t}\n${curveNodes.join("\n")}\n${curves.join("\n")}\n}\nConnections:  {\n\tC: "OO",${layerId},${stackId}\n${hierarchy}\n${curveConnections.join("\n")}\n}\n`;
}
