import type { RigBoneDefinition, RigDefinition } from "@/types/rig";
import type { RigType } from "@/types/project";

const r6: RigDefinition = { id: "R6", name: "Roblox R6", bones: [
  { id: "Root", name: "Root", parentId: null, position: [0, 0.15, 0], scale: [0.55, 0.35, 0.55] },
  { id: "Torso", name: "Torso", parentId: "Root", position: [0, 1.05, 0], scale: [1.45, 1.9, 0.8] },
  { id: "Head", name: "Head", parentId: "Torso", position: [0, 1.55, 0], scale: [1.15, 1.15, 1.15] },
  { id: "LeftArm", name: "Left Arm", parentId: "Torso", position: [-1.25, 0.05, 0], scale: [0.65, 1.85, 0.7] },
  { id: "RightArm", name: "Right Arm", parentId: "Torso", position: [1.25, 0.05, 0], scale: [0.65, 1.85, 0.7] },
  { id: "LeftLeg", name: "Left Leg", parentId: "Root", position: [-0.45, -1.15, 0], scale: [0.75, 2, 0.75] },
  { id: "RightLeg", name: "Right Leg", parentId: "Root", position: [0.45, -1.15, 0], scale: [0.75, 2, 0.75] }
] };

const r15: RigDefinition = { id: "R15", name: "Roblox R15", bones: [
  { id: "Root", name: "Root", parentId: null, position: [0, 0.15, 0], scale: [0.55, 0.35, 0.55] },
  { id: "LowerTorso", name: "Lower Torso", parentId: "Root", position: [0, 0.55, 0], scale: [1.2, 0.85, 0.65] },
  { id: "UpperTorso", name: "Upper Torso", parentId: "LowerTorso", position: [0, 0.95, 0], scale: [1.35, 1.1, 0.7] },
  { id: "Head", name: "Head", parentId: "UpperTorso", position: [0, 1.1, 0], scale: [1, 1, 1] },
  { id: "LeftUpperArm", name: "Left Upper Arm", parentId: "UpperTorso", position: [-1.05, 0.05, 0], scale: [0.55, 1, 0.6] },
  { id: "LeftLowerArm", name: "Left Lower Arm", parentId: "LeftUpperArm", position: [0, -0.98, 0], scale: [0.5, 0.9, 0.55] },
  { id: "RightUpperArm", name: "Right Upper Arm", parentId: "UpperTorso", position: [1.05, 0.05, 0], scale: [0.55, 1, 0.6] },
  { id: "RightLowerArm", name: "Right Lower Arm", parentId: "RightUpperArm", position: [0, -0.98, 0], scale: [0.5, 0.9, 0.55] },
  { id: "LeftUpperLeg", name: "Left Upper Leg", parentId: "LowerTorso", position: [-0.42, -1, 0], scale: [0.65, 1.1, 0.65] },
  { id: "LeftLowerLeg", name: "Left Lower Leg", parentId: "LeftUpperLeg", position: [0, -1.05, 0], scale: [0.6, 1, 0.6] },
  { id: "RightUpperLeg", name: "Right Upper Leg", parentId: "LowerTorso", position: [0.42, -1, 0], scale: [0.65, 1.1, 0.65] },
  { id: "RightLowerLeg", name: "Right Lower Leg", parentId: "RightUpperLeg", position: [0, -1.05, 0], scale: [0.6, 1, 0.6] }
] };

const rigDefinitions: Readonly<Record<RigType, RigDefinition>> = { R6: r6, R15: r15 };

export function getRigDefinition(rigType: RigType): RigDefinition { return rigDefinitions[rigType]; }
export function getBone(definition: RigDefinition, boneId: string): RigBoneDefinition | undefined { return definition.bones.find((bone) => bone.id === boneId); }
export function getBoneChildren(definition: RigDefinition, parentId: string | null): readonly RigBoneDefinition[] { return definition.bones.filter((bone) => bone.parentId === parentId); }
