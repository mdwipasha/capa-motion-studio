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
  readonly kind: "d" | "i" | "l" | "f";
  readonly values: readonly number[];
}

interface ScalarProperty {
  readonly kind: "I" | "D" | "L";
  readonly value: number | bigint;
}

type PropertyValue = string | number | bigint | boolean | Uint8Array | NumericArrayProperty | ScalarProperty;

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
const armatureId = 900_000;
const armatureAttributeId = 900_001;
const modelBaseId = 1_000_000;
const leafModelBaseId = 1_100_000;
const curveBaseId = 2_000_000;
const attributeBaseId = 4_000_000;
const leafAttributeBaseId = 4_100_000;
const footerMagic = new Uint8Array([0xfa, 0xbc, 0xab, 0x09, 0xd0, 0xc8, 0xd4, 0x66, 0xb1, 0x76, 0xfb, 0x83, 0x1c, 0xf7, 0x26, 0x7c]);
const requiredR15Bones = ["Root", "LowerTorso", "UpperTorso", "Head", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand", "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot"] as const;

function modelId(index: number): number { return modelBaseId + index; }
function finite(value: number, fallback = 0): number { return Number.isFinite(value) ? value : fallback; }
function axisKey(axis: "X" | "Y" | "Z"): "x" | "y" | "z" { return axis.toLowerCase() as "x" | "y" | "z"; }
function formatName(value: string): string { return value.replace(/[^\w .-]/g, "_") || "CapaMotion"; }
function fbxName(name: string, className: string): string {
  return `${name}\u0000\u0001${className}`;
}

function i(values: readonly number[]): NumericArrayProperty { return { kind: "i", values }; }
function l(values: readonly number[]): NumericArrayProperty { return { kind: "l", values }; }
function f(values: readonly number[]): NumericArrayProperty { return { kind: "f", values }; }
function integer(value: number): ScalarProperty { return { kind: "I", value: Math.round(value) }; }
function decimal(value: number): ScalarProperty { return { kind: "D", value }; }
function time(value: number): ScalarProperty { return { kind: "L", value: BigInt(Math.round(value)) }; }

function poseValue(frame: PoseFrame, boneId: string, property: FbxProperty, axis: "x" | "y" | "z"): number {
  if (property === "Lcl Translation") return finite(frame.positions?.[boneId]?.[axis] ?? 0);
  if (property === "Lcl Scaling") return finite(frame.scales?.[boneId]?.[axis] ?? 1, 1);
  return finite(frame.rotations[boneId]?.[axis] ?? 0);
}

function restValue(bone: RigBoneDefinition, property: FbxProperty, axis: "x" | "y" | "z"): number {
  if (property !== "Lcl Translation") return property === "Lcl Scaling" ? 1 : 0;
  return finite(bone.position[axis === "x" ? 0 : axis === "y" ? 1 : 2]);
}

function hasScaleAnimation(poses: readonly PoseFrame[]): boolean {
  return poses.some((pose) => Object.values(pose.scales ?? {}).some((scale) => Math.abs(scale.x - 1) > 0.0001 || Math.abs(scale.y - 1) > 0.0001 || Math.abs(scale.z - 1) > 0.0001));
}

function propertyValueForType(type: string, value: PropertyValue): PropertyValue {
  if (typeof value !== "number") return value;
  if (type === "KTime") return time(value);
  if (type === "int" || type === "enum" || type === "object") return integer(value);
  if (type === "double" || type === "Number" || type === "Vector3D" || type.startsWith("Lcl ")) return decimal(value);
  return value;
}

function pWithSubtype(name: string, type: string, subtype: string, flag: string, value: PropertyValue | readonly PropertyValue[]): FbxNode {
  const values = Array.isArray(value) ? value : [value];
  return { name: "P", properties: [name, type, subtype, flag, ...values.map((item) => propertyValueForType(type, item))] };
}

function p(name: string, type: string, flag: string, value: PropertyValue | readonly PropertyValue[]): FbxNode {
  return pWithSubtype(name, type, "", flag, value);
}

function properties70(children: readonly FbxNode[]): FbxNode {
  return { name: "Properties70", children };
}

function propertyTemplate(name: string, properties: readonly FbxNode[]): FbxNode {
  return { name: "PropertyTemplate", properties: [name], children: properties.length > 0 ? [properties70(properties)] : undefined };
}

function objectType(name: string, count: number, template?: FbxNode): FbxNode {
  return { name: "ObjectType", properties: [name], children: [{ name: "Count", properties: [count] }, ...(template ? [template] : [])] };
}

function definitionsNode(modelCount: number, nodeAttributeCount: number, animatedBoneCount: number, animatedPropertyCount: number, objectCount: number): FbxNode {
  return {
    name: "Definitions",
    children: [
      { name: "Version", properties: [100] },
      { name: "Count", properties: [objectCount] },
      objectType("Model", modelCount, propertyTemplate("FbxNode", [p("RotationActive", "bool", "", true), p("InheritType", "enum", "", 1), p("Lcl Translation", "Lcl Translation", "A", [0, 0, 0]), p("Lcl Rotation", "Lcl Rotation", "A", [0, 0, 0]), p("Lcl Scaling", "Lcl Scaling", "A", [1, 1, 1])])),
      objectType("NodeAttribute", nodeAttributeCount, propertyTemplate("FbxSkeleton", [p("Size", "double", "", 1)])),
      objectType("AnimationStack", 1, propertyTemplate("FbxAnimStack", [p("LocalStart", "KTime", "Time", 0), p("LocalStop", "KTime", "Time", 0), p("ReferenceStart", "KTime", "Time", 0), p("ReferenceStop", "KTime", "Time", 0)])),
      objectType("AnimationLayer", 1, propertyTemplate("FbxAnimLayer", [])),
      objectType("AnimationCurveNode", animatedBoneCount * animatedPropertyCount, propertyTemplate("FbxAnimCurveNode", [p("d|X", "Number", "A", 0), p("d|Y", "Number", "A", 0), p("d|Z", "Number", "A", 0)])),
      objectType("AnimationCurve", animatedBoneCount * animatedPropertyCount * 3, propertyTemplate("FbxAnimCurve", []))
    ]
  };
}

function robloxExportName(rigType: RigType, bone: RigBoneDefinition): string {
  // R15's bone.id already matches Roblox's real (no-space) R15 part names.
  // R6's real part names use spaces ("Left Arm", "Right Arm", "Left Leg", "Right Leg"),
  // which live in bone.name, not bone.id — bone.id is only the internal identifier.
  // CapaMotion keeps the neutral internal id "Root", but Roblox R6 binds the
  // root joint through the HumanoidRootPart instance.
  if (rigType === "R6" && bone.id === "Root") return "HumanoidRootPart";
  return rigType === "R6" ? bone.name : bone.id;
}

function modelNode(bone: RigBoneDefinition, id: number, exportName: string): FbxNode {
  return {
    name: "Model",
    properties: [id, fbxName(exportName, "Model"), "LimbNode"],
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
        p("RotationActive", "bool", "", true),
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
    properties: [id, fbxName(`${boneId}_${property.replace("Lcl ", "")}`, "AnimCurveNode"), ""],
    children: [properties70([p("d|X", "Number", "A", defaultValue), p("d|Y", "Number", "A", defaultValue), p("d|Z", "Number", "A", defaultValue)])]
  };
}

function animationCurve(id: number, bone: RigBoneDefinition, property: FbxProperty, axis: "X" | "Y" | "Z", poses: readonly PoseFrame[], fps: number): FbxNode {
  const orderedPoses = [...poses].sort((left, right) => left.frame - right.frame);
  const times = orderedPoses.map((pose) => Math.round(pose.frame / fps * fbxTicksPerSecond));
  const key = axisKey(axis);
  let offset = property === "Lcl Scaling" ? 1 : 0;
  const values = orderedPoses.map((pose) => {
    const hasValue = property === "Lcl Translation"
      ? pose.positions?.[bone.id]?.[key] !== undefined
      : property === "Lcl Scaling"
        ? pose.scales?.[bone.id]?.[key] !== undefined
        : pose.rotations[bone.id]?.[key] !== undefined;
    if (hasValue) offset = poseValue(pose, bone.id, property, key);
    return restValue(bone, property, key) + (property === "Lcl Scaling" ? offset - 1 : offset);
  });
  return {
    name: "AnimationCurve",
    properties: [id, fbxName(`${bone.id}_${property.replace("Lcl ", "")}_${axis}`, "AnimCurve"), ""],
    children: [
      { name: "Default", properties: [property === "Lcl Scaling" ? 1 : 0] },
      { name: "KeyVer", properties: [4008] },
      { name: "KeyTime", properties: [l(times)] },
      { name: "KeyValueFloat", properties: [f(values)] },
      { name: "KeyAttrFlags", properties: [i(values.map(() => 24836))] },
      { name: "KeyAttrDataFloat", properties: [f(values.flatMap(() => [0, 0, 255790911, 0]))] },
      { name: "KeyAttrRefCount", properties: [i(values.map(() => 1))] }
    ]
  };
}

function nodeAttributeNode(exportName: string, id: number, displayLength: number): FbxNode {
  return {
    name: "NodeAttribute",
    properties: [id, fbxName(exportName, "NodeAttribute"), "LimbNode"],
    children: [
      { name: "Version", properties: [100] },
      properties70([p("Size", "double", "Number", displayLength)]),
      { name: "TypeFlags", properties: ["Skeleton"] }
    ]
  };
}

function armatureNode(): FbxNode {
  return {
    name: "Model",
    properties: [armatureId, fbxName("Armature", "Model"), "Null"],
    children: [
      { name: "Version", properties: [232] },
      properties70([
        p("Lcl Translation", "Lcl Translation", "A+", [0, 0, 0]),
        p("Lcl Rotation", "Lcl Rotation", "A+", [0, 0, 0]),
        p("Lcl Scaling", "Lcl Scaling", "A+", [1, 1, 1]),
        pWithSubtype("DefaultAttributeIndex", "int", "Integer", "", 0),
        p("InheritType", "enum", "", 1)
      ]),
      { name: "MultiLayer", properties: [0] },
      { name: "MultiTake", properties: [0] },
      { name: "Shading", properties: [true] },
      { name: "Culling", properties: ["CullingOff"] }
    ]
  };
}

function armatureNodeAttribute(): FbxNode {
  return {
    name: "NodeAttribute",
    properties: [armatureAttributeId, fbxName("Armature", "NodeAttribute"), "Null"],
    children: [
      { name: "TypeFlags", properties: ["Null"] },
      properties70([p("Color", "ColorRGB", "Color", [0.8, 0.8, 0.8]), pWithSubtype("Size", "double", "Number", "", 100), p("Look", "enum", "", 1)])
    ]
  };
}

function boneDisplayLength(bone: RigBoneDefinition, bones: readonly RigBoneDefinition[]): number {
  const child = bones.find((candidate) => candidate.parentId === bone.id);
  if (child) {
    const [x, y, z] = child.position;
    return Math.max(0.1, Math.hypot(x, y, z));
  }
  return Math.max(0.1, Math.max(...bone.scale));
}

interface LeafBone {
  readonly id: string;
  readonly name: string;
  readonly parentIndex: number;
  readonly position: readonly [number, number, number];
}

function leafBones(bones: readonly RigBoneDefinition[]): readonly LeafBone[] {
  return bones.flatMap((bone, index) => bones.some((candidate) => candidate.parentId === bone.id)
    ? []
    : [{ id: `${bone.id}_end`, name: `${bone.name}_end`, parentIndex: index, position: [0, boneDisplayLength(bone, bones), 0] }]);
}

function buildGraph(input: FbxExportInput): FbxGraph {
  const rig = getRigDefinition(input.rigType);
  validateRig(input.rigType, rig.bones);
  const fps = input.motionData.timeline.fps;
  const poses = input.poses.length > 0 ? input.poses : [{ frame: 0, rotations: {} }];
  validatePoses(poses, fps);
  const includeScale = hasScaleAnimation(poses);
  const leaves = leafBones(rig.bones);
  const objects: FbxNode[] = [];
  const objectIds = new Set<number>([stackId, layerId, armatureId, armatureAttributeId]);
  const connections: FbxConnection[] = [{ type: "OO", source: layerId, destination: stackId }];
  const curveTargets: { readonly curveId: number; readonly nodeId: number; readonly axis: `d|${"X" | "Y" | "Z"}` }[] = [];

  objects.push(armatureNodeAttribute(), armatureNode());
  connections.push({ type: "OO", source: armatureAttributeId, destination: armatureId });

  for (const [index, bone] of rig.bones.entries()) {
    const id = modelId(index);
    const exportName = robloxExportName(input.rigType, bone);
    objectIds.add(id);
    objects.push(modelNode(bone, id, exportName));
    connections.push({ type: "OO", source: id, destination: bone.parentId ? modelId(rig.bones.findIndex((candidate) => candidate.id === bone.parentId)) : armatureId });

    const attributeId = attributeBaseId + index;
    objectIds.add(attributeId);
    objects.push(nodeAttributeNode(exportName, attributeId, boneDisplayLength(bone, rig.bones)));
    connections.push({ type: "OO", source: attributeId, destination: id });
  }

  for (const [index, leaf] of leaves.entries()) {
    const id = leafModelBaseId + index;
    const attributeId = leafAttributeBaseId + index;
    const definition: RigBoneDefinition = { id: leaf.id, name: leaf.name, parentId: rig.bones[leaf.parentIndex].id, position: leaf.position, scale: [1, 1, 1] };
    objectIds.add(id);
    objectIds.add(attributeId);
    objects.push(modelNode(definition, id, leaf.name));
    objects.push(nodeAttributeNode(leaf.name, attributeId, 1));
    connections.push({ type: "OO", source: id, destination: modelId(leaf.parentIndex) });
    connections.push({ type: "OO", source: attributeId, destination: id });
  }

  const stopTime = Math.round(input.motionData.timeline.duration * fbxTicksPerSecond);
  objects.push({ name: "AnimationStack", properties: [stackId, fbxName("Take 001", "AnimStack"), ""], children: [properties70([p("LocalStart", "KTime", "Time", 0), p("LocalStop", "KTime", "Time", stopTime), p("ReferenceStart", "KTime", "Time", 0), p("ReferenceStop", "KTime", "Time", stopTime)])] });
  objects.push({ name: "AnimationLayer", properties: [layerId, fbxName("BaseLayer", "AnimLayer"), ""] });

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
        objects.push(animationCurve(curveId, bone, property, axis, poses, fps));
        const target = `d|${axis}` as const;
        curveTargets.push({ curveId, nodeId, axis: target });
        connections.push({ type: "OP", source: curveId, destination: nodeId, property: target });
      }
    }
  }

  const nodes: FbxNode[] = [
    { name: "FBXHeaderExtension", children: [{ name: "FBXHeaderVersion", properties: [1003] }, { name: "FBXVersion", properties: [7400] }, { name: "EncryptionType", properties: [0] }, { name: "CreationTimeStamp", children: [{ name: "Version", properties: [1000] }, { name: "Year", properties: [new Date().getFullYear()] }, { name: "Month", properties: [new Date().getMonth() + 1] }, { name: "Day", properties: [new Date().getDate()] }, { name: "Hour", properties: [new Date().getHours()] }, { name: "Minute", properties: [new Date().getMinutes()] }, { name: "Second", properties: [new Date().getSeconds()] }, { name: "Millisecond", properties: [new Date().getMilliseconds()] }] }, { name: "Creator", properties: ["CapaMotion Studio"] }] },
    { name: "FileId", properties: [new Uint8Array([0x28, 0xb3, 0x2a, 0xeb, 0xb6, 0x24, 0xcc, 0xc2, 0xbf, 0xc8, 0xb0, 0x2a, 0xa9, 0x2b, 0xfc, 0xf1])] },
    { name: "CreationTime", properties: [new Date().toISOString()] },
    { name: "Creator", properties: ["CapaMotion Studio"] },
    {
      name: "GlobalSettings",
      children: [
        { name: "Version", properties: [1000] },
        properties70([pWithSubtype("UpAxis", "int", "Integer", "", 1), pWithSubtype("UpAxisSign", "int", "Integer", "", 1), pWithSubtype("FrontAxis", "int", "Integer", "", 2), pWithSubtype("FrontAxisSign", "int", "Integer", "", 1), pWithSubtype("CoordAxis", "int", "Integer", "", 0), pWithSubtype("CoordAxisSign", "int", "Integer", "", 1), pWithSubtype("UnitScaleFactor", "double", "Number", "", 1), pWithSubtype("TimeMode", "enum", "", "", 14), pWithSubtype("TimeSpanStart", "KTime", "Time", "", 0), pWithSubtype("TimeSpanStop", "KTime", "Time", "", stopTime), pWithSubtype("CustomFrameRate", "double", "Number", "", fps)])
      ]
    },
    { name: "Documents", children: [{ name: "Count", properties: [1] }, { name: "Document", properties: [documentId, fbxName(formatName(input.projectName), "Document"), "Scene", 0], children: [properties70([p("SourceObject", "object", "", ""), p("ActiveAnimStackName", "KString", "", "AnimStack::Take 001")]), { name: "RootNode", properties: [rootNodeId] }] }] },
    { name: "References" },
    definitionsNode(1 + rig.bones.length + leaves.length, 1 + rig.bones.length + leaves.length, rig.bones.length, animatedProperties.length, objects.length),
    { name: "Objects", children: objects },
    { name: "Connections", children: connections.map((connection) => ({ name: "C", properties: connection.type === "OO" ? [connection.type, connection.source, connection.destination] : [connection.type, connection.source, connection.destination, connection.property ?? ""] })) },
    { name: "Takes", children: [{ name: "Current", properties: ["Take 001"] }, { name: "Take", properties: ["Take 001"], children: [{ name: "FileName", properties: ["Take_001.tak"] }, { name: "LocalTime", properties: [time(0), time(stopTime)] }, { name: "ReferenceTime", properties: [time(0), time(stopTime)] }] }] }
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
  for (const bone of bones) {
    const ancestors = new Set<string>();
    let parentId = bone.parentId;
    while (parentId) {
      if (ancestors.has(parentId) || parentId === bone.id) {
        errors.push(`Hierarchy cycle detected for ${bone.id}.`);
        break;
      }
      ancestors.add(parentId);
      parentId = bones.find((candidate) => candidate.id === parentId)?.parentId ?? null;
    }
  }
  if (rigType === "R15") {
    const missing = requiredR15Bones.filter((boneId) => !ids.has(boneId));
    if (bones.length !== requiredR15Bones.length || missing.length > 0) errors.push(`R15 template must contain 16 Roblox bones. Missing: ${missing.join(", ") || "none"}.`);
  }
  if (errors.length > 0) throw new Error(`FBX skeleton validation failed: ${errors.join(" ")}`);
}

function validatePoses(poses: readonly PoseFrame[], fps: number): void {
  const errors: string[] = [];
  if (!Number.isFinite(fps) || fps <= 0) errors.push("Timeline FPS must be greater than zero.");
  for (const pose of poses) {
    if (!Number.isFinite(pose.frame) || pose.frame < 0) errors.push(`Invalid pose frame ${pose.frame}.`);
    for (const transformSet of [pose.rotations, pose.positions ?? {}, pose.scales ?? {}]) {
      for (const [boneId, transform] of Object.entries(transformSet)) {
        if (!Number.isFinite(transform.x) || !Number.isFinite(transform.y) || !Number.isFinite(transform.z)) errors.push(`Invalid pose transform for ${boneId} at frame ${pose.frame}.`);
      }
    }
  }
  if (errors.length > 0) throw new Error(`FBX animation validation failed: ${errors.join(" ")}`);
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
  writeF32(value: number): void { const view = new DataView(new ArrayBuffer(4)); view.setFloat32(0, value, true); this.writeBytes(new Uint8Array(view.buffer)); }
  patchU32(offset: number, value: number): void { this.bytes[offset] = value & 0xff; this.bytes[offset + 1] = (value >>> 8) & 0xff; this.bytes[offset + 2] = (value >>> 16) & 0xff; this.bytes[offset + 3] = (value >>> 24) & 0xff; }
  toUint8Array(): Uint8Array { return new Uint8Array(this.bytes); }
}

function propertyBytes(value: PropertyValue): Uint8Array {
  const writer = new BinaryWriter();
  if (value instanceof Uint8Array) {
    writer.writeU8("R".charCodeAt(0));
    writer.writeU32(value.length);
    writer.writeBytes(value);
  } else if (typeof value === "object" && "values" in value) {
    writer.writeU8(value.kind.charCodeAt(0));
    writer.writeU32(value.values.length);
    writer.writeU32(0);
    writer.writeU32(value.values.length * (value.kind === "i" || value.kind === "f" ? 4 : 8));
    for (const item of value.values) {
      if (value.kind === "i") writer.writeI32(Math.round(item));
      else if (value.kind === "l") writer.writeI64(BigInt(Math.round(item)));
      else if (value.kind === "f") writer.writeF32(item);
      else writer.writeF64(item);
    }
  } else if (typeof value === "object") {
    writer.writeU8(value.kind.charCodeAt(0));
    if (value.kind === "I") writer.writeI32(Math.round(Number(value.value)));
    else if (value.kind === "L") writer.writeI64(typeof value.value === "bigint" ? value.value : BigInt(Math.round(value.value)));
    else writer.writeF64(Number(value.value));
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

function writeFooter(writer: BinaryWriter): void {
  const alignmentPadding = (16 - (writer.offset % 16)) % 16;
  writer.writeBytes(new Uint8Array(alignmentPadding));
  writer.writeBytes(footerMagic);
  writer.writeBytes(new Uint8Array(4));
  writer.writeU32(7400);
  writer.writeBytes(new Uint8Array(120));
  writer.writeBytes(footerMagic);
}

function readU32(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) throw new Error("Unexpected end of FBX binary data.");
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function isNullRecord(bytes: Uint8Array, offset: number): boolean {
  return offset + 13 <= bytes.length && bytes.slice(offset, offset + 13).every((value) => value === 0);
}

function propertyEndOffset(bytes: Uint8Array, offset: number): number {
  if (offset >= bytes.length) throw new Error("Missing FBX property type.");
  const type = String.fromCharCode(bytes[offset]);
  const scalarSizes: Readonly<Record<string, number>> = { Y: 2, C: 1, I: 4, F: 4, D: 8, L: 8 };
  if (type in scalarSizes) return offset + 1 + scalarSizes[type];
  if (type === "R" || type === "S") return offset + 5 + readU32(bytes, offset + 1);
  if ("fdilb".includes(type)) {
    const length = readU32(bytes, offset + 1);
    const encoding = readU32(bytes, offset + 5);
    const payloadLength = readU32(bytes, offset + 9);
    if (encoding !== 0) throw new Error("Compressed FBX arrays are not supported by the local binary validator.");
    const elementSize = type === "f" || type === "i" ? 4 : type === "d" || type === "l" ? 8 : 1;
    if (payloadLength !== length * elementSize) throw new Error(`Invalid ${type} array payload length.`);
    return offset + 13 + payloadLength;
  }
  throw new Error(`Unsupported FBX property type ${type}.`);
}

function nodeEndOffset(bytes: Uint8Array, offset: number): number {
  const endOffset = readU32(bytes, offset);
  const propertyCount = readU32(bytes, offset + 4);
  const propertyListLength = readU32(bytes, offset + 8);
  const nameLength = bytes[offset + 12];
  if (endOffset <= offset || endOffset > bytes.length) throw new Error("Invalid FBX node end offset.");
  let cursor = offset + 13 + nameLength;
  const propertyEnd = cursor + propertyListLength;
  if (propertyEnd > endOffset) throw new Error("FBX property list exceeds node boundary.");
  for (let index = 0; index < propertyCount; index += 1) cursor = propertyEndOffset(bytes, cursor);
  if (cursor !== propertyEnd) throw new Error("FBX property list length does not match encoded properties.");
  cursor = propertyEnd;
  while (cursor < endOffset) {
    if (isNullRecord(bytes, cursor)) {
      cursor += 13;
      break;
    }
    cursor = nodeEndOffset(bytes, cursor);
  }
  if (cursor !== endOffset) throw new Error("FBX child node boundary mismatch.");
  return endOffset;
}

function validateBinaryFbx(bytes: Uint8Array): void {
  const header = new TextDecoder().decode(bytes.slice(0, 20));
  if (header !== "Kaydara FBX Binary  ") throw new Error("Invalid FBX binary header.");
  if (readU32(bytes, 23) !== 7400) throw new Error("Unexpected FBX binary version.");
  let cursor = 27;
  while (!isNullRecord(bytes, cursor)) cursor = nodeEndOffset(bytes, cursor);
  cursor += 13;
  while (cursor % 16 !== 0) cursor += 1;
  const footerStart = cursor;
  const expectedFooterLength = footerMagic.length + 4 + 4 + 120 + footerMagic.length;
  if (footerStart + expectedFooterLength !== bytes.length) throw new Error("Invalid FBX footer length.");
  if (!footerMagic.every((value, index) => bytes[footerStart + index] === value)) throw new Error("Missing FBX footer magic.");
  if (readU32(bytes, footerStart + footerMagic.length + 4) !== 7400) throw new Error("Invalid FBX footer version.");
  const finalMagicOffset = bytes.length - footerMagic.length;
  if (!footerMagic.every((value, index) => bytes[finalMagicOffset + index] === value)) throw new Error("Invalid trailing FBX footer magic.");
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
  writeFooter(writer);
  const bytes = writer.toUint8Array();
  validateBinaryFbx(bytes);
  return bytes;
}
