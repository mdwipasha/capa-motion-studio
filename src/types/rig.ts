import type { RigType } from "@/types/project";

export type Vector3Tuple = readonly [number, number, number];

export interface RigBoneDefinition {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly position: Vector3Tuple;
  readonly scale: Vector3Tuple;
}

export interface RigDefinition {
  readonly id: RigType;
  readonly name: string;
  readonly bones: readonly RigBoneDefinition[];
}

export interface BoneRotation {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type BoneVector = BoneRotation;

export interface PoseFrame {
  readonly frame: number;
  readonly rotations: Readonly<Record<string, BoneRotation>>;
  readonly positions?: Readonly<Record<string, BoneVector>>;
  readonly scales?: Readonly<Record<string, BoneVector>>;
}
