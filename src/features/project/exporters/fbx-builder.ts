import { getRigDefinition } from "@/lib/rig";
import type { MotionData } from "@/types/motion";
import type { RigType } from "@/types/project";
import type { PoseFrame, RigBoneDefinition } from "@/types/rig";

export interface FbxExportInput {
  readonly projectName: string;
  readonly rigType: RigType;
  readonly motionData: MotionData;
  readonly poses: readonly PoseFrame[];
}

type FbxProperty = "Lcl Translation" | "Lcl Rotation" | "Lcl Scaling";
interface NumericArrayProperty {
  readonly kind: "d" | "i" | "l";
  readonly values: readonly number[];
}

type PropertyValue = string | number | bigint | boolean | Uint8Array | NumericArrayProperty;

interface FbxNode {
  readonly name: string;
  readonly properties?: readonly PropertyValue[];
  readonly children?: readonly FbxNode[];
}

interface FbxConnection {
  readonly type: "OO" | "OP";
  readonly source: number;
  readonly destination: number;
  readonly property?: FbxProperty | `d|${"X" | "Y" | "Z"}`;
}

interface FbxGraph {
  readonly nodes: readonly FbxNode[];
  readonly objectIds: ReadonlySet<number>;
  readonly connections: readonly FbxConnection[];
  readonly curveTargets: readonly { readonly curveId: number; readonly nodeId: number; readonly axis: `d|${"X" | "Y" | "Z"}` }[];
}

const fbxTicksPerSecond = 46_186_158_000;
const rootNodeId = 0;
const documentId = 101;
const stackId = 200;
const layerId = 201;
const modelBaseId = 1_000_000;
const curveBaseId = 2_000_000;
const poseId = 3_000_000;
const requiredR15Bones = ["Root", "LowerTorso", "UpperTorso", "Head", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand", "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot"] as const;

function modelId(index: number): number { return modelBaseId + index; }
function finite(value: number, fallback = 0): number { return Number.isFinite(value) ? value : fallback; }
function axisKey(axis: "X" | "Y" | "Z"): "x" | "y" | "z" { return axis.toLowerCase() as "x" | "y" | "z"; }
function formatName(value: string): string { return value.replace(/[^\w .-]/g, "_") || "CapaMotion"; }
function d(values: readonly number[]): NumericArrayProperty { return { kind: "d", values }; }
function i(values: readonly number[]): NumericArrayProperty { return { kind: "i", values }; }
function l(values: readonly number[]): NumericArrayProperty { return { kind: "l", values }; }

function poseValue(frame: PoseFrame, boneId: string, property: FbxProperty, axis: "x" | "y" | "z"): number {
  if (property === "Lcl Translation") return finite(frame.positions?.[boneId]?.[axis] ?? 0);
  if (property === "Lcl Scaling") return finite(frame.scales?.[boneId]?.[axis] ?? 1, 1);
  return finite(frame.rotations[boneId]?.[axis] ?? 0);
}

function hasScaleAnimation(poses: readonly PoseFrame[]): boolean {
  return poses.some((pose) => Object.values(pose.scales ?? {}).some((scale) => Math.abs(scale.x - 1) > 0.0001 || Math.abs(scale.y - 1) > 0.0001 || Math.abs(scale.z - 1) > 0.0001));
}

function p(name: string, type: string, flag: string, value: PropertyValue | readonly PropertyValue[]): FbxNode {
  return { name: "P", properties: [name, type, "", flag, ...(Array.isArray(value) ? value : [value])] };
}

function properties70(children: readonly FbxNode[]): FbxNode {
  return { name: "Properties70", children };
}

function modelNode(bone: RigBoneDefinition, id: number): FbxNode {
  return {
    name: "Model",
    properties: [id, `Model::${bone.id}`, "LimbNode"],
    children: [
      { name: "Version", properties: [232] },
      properties70([
        p("QuaternionInterpolate", "enum", "", 0),
        p("RotationOffset", "Vector3D", "", [0, 0, 0]),
        p("RotationPivot", "Vector3D", "", [0, 0, 0]),
        p("ScalingOffset", "Vector3D", "", [0, 0, 0]),
        p("ScalingPivot", "Vector3D", "", [0, 0, 0]),
        p("TranslationActive", "bool", "", true),
        p("TranslationMin", "Vector3D", "", [0, 0, 0]),
        p("TranslationMax", "Vector3D", "", [0, 0, 0]),
        p("RotationOrder", "enum", "", 0),
        p("RotationSpaceForLimitOnly", "bool", "", false),
        p("RotationStiffnessX", "double", "", 0),
        p("RotationStiffnessY", "double", "", 0),
        p("RotationStiffnessZ", "double", "", 0),
        p("AxisLen", "double", "", 10),
        p("Lcl Translation", "Lcl Translation", "A", bone.position.map((value) => finite(value))),
        p("Lcl Rotation", "Lcl Rotation", "A", [0, 0, 0]),
        p("Lcl Scaling", "Lcl Scaling", "A", [1, 1, 1]),
        p("InheritType", "enum", "", 1)
      ]),
      { name: "Shading", properties: [true] },
      { name: "Culling", properties: ["CullingOff"] }
    ]
  };
}

function curveNode(id: number, boneId: string, property: FbxProperty): FbxNode {
  const defaultValue = property === "Lcl Scaling" ? 1 : 0;
  return {
    name: "AnimationCurveNode",
    properties: [id, `AnimCurveNode::${boneId}_${property.replace("Lcl ", "")}`, ""],
    children: [properties70([p("d|X", "Number", "A", defaultValue), p("d|Y", "Number", "A", defaultValue), p("d|Z", "Number", "A", defaultValue)])]
  };
}

function animationCurve(id: number, boneId: string, property: FbxProperty, axis: "X" | "Y" | "Z", poses: readonly PoseFrame[], fps: number): FbxNode {
  const times = poses.map((pose) => Math.round(pose.frame / fps * fbxTicksPerSecond));
  const values = poses.map((pose) => poseValue(pose, boneId, property, axisKey(axis)));
  return {
    name: "AnimationCurve",
    properties: [id, `AnimCurve::${boneId}_${property.replace("Lcl ", "")}_${axis}`, ""],
    children: [
      { name: "Default", properties: [property === "Lcl Scaling" ? 1 : 0] },
      { name: "KeyVer", properties: [4008] },
      { name: "KeyTime", properties: [l(times)] },
      { name: "KeyValueFloat", properties: [d(values)] },
      { name: "KeyAttrFlags", properties: [i(values.map(() => 24836))] },
      { name: "KeyAttrDataFloat", properties: [d(values.flatMap(() => [0, 0, 255790911, 0]))] },
      { name: "KeyAttrRefCount", properties: [i(values.map(() => 1))] }
    ]
  };
}

function poseNode(bone: RigBoneDefinition, id: number): FbxNode {
  const matrix = [
    1, 0, 0, finite(bone.position[0]),
    0, 1, 0, finite(bone.position[1]),
    0, 0, 1, finite(bone.position[2]),
    0, 0, 0, 1
  ];
  return { name: "PoseNode", children: [{ name: "Node", properties: [id] }, { name: "Matrix", properties: [d(matrix)] }] };
}

function buildGraph(input: FbxExportInput): FbxGraph {
  const rig = getRigDefinition(input.rigType);
  validateRig(input.rigType, rig.bones);
  const fps = input.motionData.timeline.fps;
  const poses = input.poses.length > 0 ? input.poses : [{ frame: 0, rotations: {} }];
  const includeScale = hasScaleAnimation(poses);
  const objects: FbxNode[] = [];
  const objectIds = new Set<number>([stackId, layerId, poseId]);
  const connections: FbxConnection[] = [{ type: "OO", source: layerId, destination: stackId }];
  const curveTargets: { readonly curveId: number; readonly nodeId: number; readonly axis: `d|${"X" | "Y" | "Z"}` }[] = [];

  for (const [index, bone] of rig.bones.entries()) {
    const id = modelId(index);
    objectIds.add(id);
    objects.push(modelNode(bone, id));
    connections.push({ type: "OO", source: id, destination: bone.parentId ? modelId(rig.bones.findIndex((candidate) => candidate.id === bone.parentId)) : rootNodeId });
  }

  objects.push({
    name: "Pose",
    properties: [poseId, "Pose::BindPose", "BindPose"],
    children: [{ name: "Type", properties: ["BindPose"] }, { name: "Version", properties: [100] }, { name: "NbPoseNodes", properties: [rig.bones.length] }, ...rig.bones.map((bone, index) => poseNode(bone, modelId(index)))]
  });

  objects.push({ name: "AnimationStack", properties: [stackId, "AnimStack::Take 001", ""], children: [properties70([p("LocalStart", "KTime", "Time", 0), p("LocalStop", "KTime", "Time", Math.round(input.motionData.timeline.duration * fbxTicksPerSecond)), p("ReferenceStart", "KTime", "Time", 0), p("ReferenceStop", "KTime", "Time", Math.round(input.motionData.timeline.duration * fbxTicksPerSecond))])] });
  objects.push({ name: "AnimationLayer", properties: [layerId, "AnimLayer::BaseLayer", ""] });

  let nextCurveId = curveBaseId;
  const animatedProperties: readonly FbxProperty[] = includeScale ? ["Lcl Translation", "Lcl Rotation", "Lcl Scaling"] : ["Lcl Translation", "Lcl Rotation"];
  for (const [index, bone] of rig.bones.entries()) {
    const destination = modelId(index);
    for (const property of animatedProperties) {
      const nodeId = nextCurveId++;
      objectIds.add(nodeId);
      objects.push(curveNode(nodeId, bone.id, property));
      connections.push({ type: "OO", source: nodeId, destination: layerId });
      connections.push({ type: "OP", source: nodeId, destination, property });
      for (const axis of ["X", "Y", "Z"] as const) {
        const curveId = nextCurveId++;
        objectIds.add(curveId);
        objects.push(animationCurve(curveId, bone.id, property, axis, poses, fps));
        const target = `d|${axis}` as const;
        curveTargets.push({ curveId, nodeId, axis: target });
        connections.push({ type: "OP", source: curveId, destination: nodeId, property: target });
      }
    }
  }

  const nodes: FbxNode[] = [
    { name: "FBXHeaderExtension", children: [{ name: "FBXHeaderVersion", properties: [1003] }, { name: "FBXVersion", properties: [7400] }, { name: "EncryptionType", properties: [0] }, { name: "Creator", properties: ["CapaMotion Studio"] }] },
    { name: "FileId", properties: [new Uint8Array([0x28, 0xb3, 0x2a, 0xeb, 0xb6, 0x24, 0xcc, 0xc2, 0xbf, 0xc8, 0xb0, 0x2a, 0xa9, 0x2b, 0xfc, 0xf1])] },
    { name: "CreationTime", properties: [new Date().toISOString()] },
    { name: "Creator", properties: ["CapaMotion Studio"] },
    {
      name: "GlobalSettings",
      children: [
        { name: "Version", properties: [1000] },
        properties70([p("UpAxis", "int", "A", 1), p("UpAxisSign", "int", "A", 1), p("FrontAxis", "int", "A", 2), p("FrontAxisSign", "int", "A", 1), p("CoordAxis", "int", "A", 0), p("CoordAxisSign", "int", "A", 1), p("UnitScaleFactor", "double", "A", 1), p("TimeMode", "enum", "", 14), p("CustomFrameRate", "double", "Number", fps)])
      ]
    },
    { name: "Documents", children: [{ name: "Count", properties: [1] }, { name: "Document", properties: [documentId, `Document::${formatName(input.projectName)}`, "Scene"], children: [properties70([p("SourceObject", "object", "", 0), p("ActiveAnimStackName", "KString", "", "Take 001")]), { name: "RootNode", properties: [rootNodeId] }] }] },
    { name: "References" },
    { name: "Definitions", children: [{ name: "Version", properties: [100] }, { name: "Count", properties: [objects.length] }, { name: "ObjectType", properties: ["Model"], children: [{ name: "Count", properties: [rig.bones.length] }] }, { name: "ObjectType", properties: ["AnimationStack"], children: [{ name: "Count", properties: [1] }] }, { name: "ObjectType", properties: ["AnimationLayer"], children: [{ name: "Count", properties: [1] }] }, { name: "ObjectType", properties: ["AnimationCurveNode"], children: [{ name: "Count", properties: [rig.bones.length * animatedProperties.length] }] }, { name: "ObjectType", properties: ["AnimationCurve"], children: [{ name: "Count", properties: [rig.bones.length * animatedProperties.length * 3] }] }, { name: "ObjectType", properties: ["Pose"], children: [{ name: "Count", properties: [1] }] }] },
    { name: "Objects", children: objects },
    { name: "Connections", children: connections.map((connection) => ({ name: "C", properties: connection.type === "OO" ? [connection.type, connection.source, connection.destination] : [connection.type, connection.source, connection.destination, connection.property ?? ""] })) },
    { name: "Takes", children: [{ name: "Current", properties: ["Take 001"] }, { name: "Take", properties: ["Take 001"], children: [{ name: "FileName", properties: ["Take_001.tak"] }, { name: "LocalTime", properties: [0, Math.round(input.motionData.timeline.duration * fbxTicksPerSecond)] }, { name: "ReferenceTime", properties: [0, Math.round(input.motionData.timeline.duration * fbxTicksPerSecond)] }] }] }
  ];

  return { nodes, objectIds, connections, curveTargets };
}

function validateRig(rigType: RigType, bones: readonly RigBoneDefinition[]): void {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const bone of bones) {
    if (ids.has(bone.id)) errors.push(`Duplicate bone ${bone.id}.`);
    ids.add(bone.id);
    if (!bone.position.every(Number.isFinite) || !bone.scale.every(Number.isFinite)) errors.push(`Invalid rest transform for ${bone.id}.`);
  }
  const roots = bones.filter((bone) => bone.parentId === null);
  if (roots.length !== 1 || roots[0]?.id !== "Root") errors.push("Skeleton must contain exactly one Root bone.");
  for (const bone of bones) {
    if (bone.parentId && !ids.has(bone.parentId)) errors.push(`Missing parent ${bone.parentId} for ${bone.id}.`);
  }
  if (rigType === "R15") {
    const missing = requiredR15Bones.filter((boneId) => !ids.has(boneId));
    if (bones.length !== requiredR15Bones.length || missing.length > 0) errors.push(`R15 template must contain 16 Roblox bones. Missing: ${missing.join(", ") || "none"}.`);
  }
  if (errors.length > 0) throw new Error(`FBX skeleton validation failed: ${errors.join(" ")}`);
}

function validateGraph(graph: FbxGraph): void {
  const errors: string[] = [];
  const parentedModels = new Set<number>();
  for (const connection of graph.connections) {
    if (connection.source !== rootNodeId && !graph.objectIds.has(connection.source)) errors.push(`Missing connection source ${connection.source}.`);
    if (connection.destination !== rootNodeId && !graph.objectIds.has(connection.destination)) errors.push(`Missing connection destination ${connection.destination}.`);
    if (connection.type === "OO" && connection.source >= modelBaseId && connection.source < curveBaseId) {
      if (parentedModels.has(connection.source)) errors.push(`Duplicate skeleton parent connection for ${connection.source}.`);
      parentedModels.add(connection.source);
    }
  }
  for (const target of graph.curveTargets) {
    if (!graph.connections.some((connection) => connection.type === "OP" && connection.source === target.curveId && connection.destination === target.nodeId && connection.property === target.axis)) {
      errors.push(`Animation curve ${target.curveId} has no valid axis target.`);
    }
  }
  if (errors.length > 0) throw new Error(`FBX validation failed: ${errors.join(" ")}`);
}

class BinaryWriter {
  private readonly bytes: number[] = [];
  get offset(): number { return this.bytes.length; }
  writeU8(value: number): void { this.bytes.push(value & 0xff); }
  writeBytes(values: ArrayLike<number>): void { for (let index = 0; index < values.length; index += 1) this.writeU8(values[index]); }
  writeString(value: string): void { this.writeBytes(new TextEncoder().encode(value)); }
  writeU32(value: number): void { this.writeBytes([value, value >>> 8, value >>> 16, value >>> 24]); }
  writeI16(value: number): void { const view = new DataView(new ArrayBuffer(2)); view.setInt16(0, value, true); this.writeBytes(new Uint8Array(view.buffer)); }
  writeI32(value: number): void { const view = new DataView(new ArrayBuffer(4)); view.setInt32(0, value, true); this.writeBytes(new Uint8Array(view.buffer)); }
  writeI64(value: bigint): void { const view = new DataView(new ArrayBuffer(8)); view.setBigInt64(0, value, true); this.writeBytes(new Uint8Array(view.buffer)); }
  writeF64(value: number): void { const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0, value, true); this.writeBytes(new Uint8Array(view.buffer)); }
  patchU32(offset: number, value: number): void { this.bytes[offset] = value & 0xff; this.bytes[offset + 1] = (value >>> 8) & 0xff; this.bytes[offset + 2] = (value >>> 16) & 0xff; this.bytes[offset + 3] = (value >>> 24) & 0xff; }
  toUint8Array(): Uint8Array { return new Uint8Array(this.bytes); }
}

function propertyBytes(value: PropertyValue): Uint8Array {
  const writer = new BinaryWriter();
  if (value instanceof Uint8Array) {
    writer.writeU8("R".charCodeAt(0));
    writer.writeU32(value.length);
    writer.writeBytes(value);
  } else if (typeof value === "object") {
    writer.writeU8(value.kind.charCodeAt(0));
    writer.writeU32(value.values.length);
    writer.writeU32(0);
    writer.writeU32(value.values.length * (value.kind === "i" ? 4 : 8));
    for (const item of value.values) {
      if (value.kind === "i") writer.writeI32(Math.round(item));
      else if (value.kind === "l") writer.writeI64(BigInt(Math.round(item)));
      else writer.writeF64(item);
    }
  } else if (typeof value === "string") {
    const encoded = new TextEncoder().encode(value);
    writer.writeU8("S".charCodeAt(0));
    writer.writeU32(encoded.length);
    writer.writeBytes(encoded);
  } else if (typeof value === "boolean") {
    writer.writeU8("C".charCodeAt(0));
    writer.writeU8(value ? 1 : 0);
  } else if (typeof value === "bigint") {
    writer.writeU8("L".charCodeAt(0));
    writer.writeI64(value);
  } else if (Number.isInteger(value) && Math.abs(value) <= 2_147_483_647) {
    writer.writeU8("I".charCodeAt(0));
    writer.writeI32(value);
  } else {
    writer.writeU8("D".charCodeAt(0));
    writer.writeF64(value);
  }
  return writer.toUint8Array();
}

function writeNode(writer: BinaryWriter, node: FbxNode): void {
  const propertyBlocks = (node.properties ?? []).map(propertyBytes);
  const start = writer.offset;
  writer.writeU32(0);
  writer.writeU32(propertyBlocks.length);
  writer.writeU32(propertyBlocks.reduce((total, block) => total + block.length, 0));
  writer.writeU8(node.name.length);
  writer.writeString(node.name);
  for (const block of propertyBlocks) writer.writeBytes(block);
  for (const child of node.children ?? []) writeNode(writer, child);
  if ((node.children?.length ?? 0) > 0) writer.writeBytes(new Uint8Array(13));
  writer.patchU32(start, writer.offset);
}

export function buildBinaryFbx(input: FbxExportInput): Uint8Array {
  const graph = buildGraph(input);
  validateGraph(graph);
  const writer = new BinaryWriter();
  writer.writeString("Kaydara FBX Binary  ");
  writer.writeBytes([0x00, 0x1a, 0x00]);
  writer.writeU32(7400);
  for (const node of graph.nodes) writeNode(writer, node);
  writer.writeBytes(new Uint8Array(13));
  return writer.toUint8Array();
}
