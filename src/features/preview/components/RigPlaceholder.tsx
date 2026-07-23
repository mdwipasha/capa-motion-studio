import { TransformControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { degreesToRadians } from "@/lib/pose";
import { getBoneChildren, getRigDefinition } from "@/lib/rig";
import { useBoneRotation, usePoseStore } from "@/stores/pose-store";
import { useRigStore } from "@/stores/rig-store";
import { useMotionStore } from "@/stores/motion-store";
import type { RigBoneDefinition, RigDefinition } from "@/types/rig";
import type { RigType } from "@/types/project";

interface RigNodeProps { readonly bone: RigBoneDefinition; readonly definition: RigDefinition; }

function RigNode({ bone, definition }: RigNodeProps) {
  const group = useRef<Group>(null);
  const rotation = useBoneRotation(bone.id);
  const selected = useRigStore((state) => state.selectedBoneId === bone.id);
  const selectBone = useRigStore((state) => state.selectBone);
  const setBoneRotation = usePoseStore((state) => state.setBoneRotation);
  const children = getBoneChildren(definition, bone.id);
  const contents = <group name={bone.id} position={bone.position} ref={group} rotation={degreesToRadians(rotation)}><mesh castShadow onClick={(event) => { event.stopPropagation(); selectBone(bone.id); }} scale={bone.scale}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={selected ? "#fbbf24" : "#8b5cf6"} emissive={selected ? "#78350f" : "#281452"} emissiveIntensity={selected ? 0.6 : 0.35} metalness={0.1} roughness={0.55} wireframe /></mesh>{children.map((child) => <RigNode bone={child} definition={definition} key={child.id} />)}</group>;
  if (!selected) return contents;
  return <TransformControls mode="rotate" onObjectChange={() => {
    const nextRotation = group.current?.rotation;
    if (!nextRotation) return;
    const frame = useMotionStore.getState().currentFrame;
    setBoneRotation(bone.id, { x: nextRotation.x * 180 / Math.PI, y: nextRotation.y * 180 / Math.PI, z: nextRotation.z * 180 / Math.PI }, frame);
  }}>{contents}</TransformControls>;
}

/** Data-driven R6/R15 placeholder renderer. Replace only the mesh layer when loading Roblox assets later. */
export function RigPlaceholder({ rigType }: { readonly rigType: RigType }) {
  const loadRig = useRigStore((state) => state.loadRig);
  const definition = getRigDefinition(rigType);
  const rootBones = getBoneChildren(definition, null);
  useEffect(() => { loadRig(rigType); }, [loadRig, rigType]);
  return <group name={`roblox-${rigType.toLowerCase()}-rig`}>{rootBones.map((bone) => <RigNode bone={bone} definition={definition} key={bone.id} />)}</group>;
}
