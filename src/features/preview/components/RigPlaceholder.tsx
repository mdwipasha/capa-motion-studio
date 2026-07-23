import { memo } from "react";
import type { RigType } from "@/types/project";

interface RigPart { readonly key: string; readonly position: [number, number, number]; readonly scale: [number, number, number]; }

const r6Parts: readonly RigPart[] = [
  { key: "head", position: [0, 2.8, 0], scale: [1.15, 1.15, 1.15] },
  { key: "torso", position: [0, 1.2, 0], scale: [1.45, 1.9, 0.8] },
  { key: "left-arm", position: [-1.25, 1.25, 0], scale: [0.65, 1.85, 0.7] },
  { key: "right-arm", position: [1.25, 1.25, 0], scale: [0.65, 1.85, 0.7] },
  { key: "left-leg", position: [-0.45, -1.15, 0], scale: [0.75, 2, 0.75] },
  { key: "right-leg", position: [0.45, -1.15, 0], scale: [0.75, 2, 0.75] }
];

const r15Parts: readonly RigPart[] = [
  { key: "head", position: [0, 3.1, 0], scale: [1, 1, 1] },
  { key: "upper-torso", position: [0, 1.75, 0], scale: [1.35, 1.1, 0.7] },
  { key: "lower-torso", position: [0, 0.55, 0], scale: [1.2, 0.85, 0.65] },
  { key: "left-upper-arm", position: [-1.05, 1.8, 0], scale: [0.55, 1, 0.6] },
  { key: "left-lower-arm", position: [-1.05, 0.65, 0], scale: [0.5, 0.9, 0.55] },
  { key: "right-upper-arm", position: [1.05, 1.8, 0], scale: [0.55, 1, 0.6] },
  { key: "right-lower-arm", position: [1.05, 0.65, 0], scale: [0.5, 0.9, 0.55] },
  { key: "left-upper-leg", position: [-0.42, -0.55, 0], scale: [0.65, 1.1, 0.65] },
  { key: "left-lower-leg", position: [-0.42, -1.75, 0], scale: [0.6, 1, 0.6] },
  { key: "right-upper-leg", position: [0.42, -0.55, 0], scale: [0.65, 1.1, 0.65] },
  { key: "right-lower-leg", position: [0.42, -1.75, 0], scale: [0.6, 1, 0.6] }
];

interface RigPlaceholderProps { readonly rigType: RigType; }

/** Replace this presentation-only mesh group with a loaded rig adapter later. */
export const RigPlaceholder = memo(function RigPlaceholder({ rigType }: RigPlaceholderProps) {
  const parts = rigType === "R6" ? r6Parts : r15Parts;
  return <group name={`roblox-${rigType.toLowerCase()}-placeholder`} position={[0, 0.15, 0]}>{parts.map((part) => <mesh castShadow key={part.key} position={part.position} scale={part.scale}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#8b5cf6" emissive="#281452" emissiveIntensity={0.35} metalness={0.1} roughness={0.55} wireframe /></mesh>)}</group>;
});
