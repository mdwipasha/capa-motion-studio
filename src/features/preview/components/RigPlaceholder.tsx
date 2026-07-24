import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { degreesToRadians, radiansToDegrees } from "@/lib/pose";
import { getBoneChildren, getRigDefinition } from "@/lib/rig";
import { useMotionStore } from "@/stores/motion-store";
import { useBonePosition, useBoneRotation, useBoneScale, usePoseStore } from "@/stores/pose-store";
import { useRigStore } from "@/stores/rig-store";
import type { RigBoneDefinition, RigDefinition } from "@/types/rig";
import type { RigType } from "@/types/project";

interface RigNodeProps { readonly bone: RigBoneDefinition; readonly definition: RigDefinition; }

function RigNode({ bone, definition }: RigNodeProps) {
  const groupRef = useRef<Group>(null);
  const rotation = useBoneRotation(bone.id);
  const position = useBonePosition(bone.id);
  const scale = useBoneScale(bone.id);
  const selected = useRigStore((state) => state.selectedBoneId === bone.id);
  const selectBone = useRigStore((state) => state.selectBone);
  const transformMode = useRigStore((state) => state.transformMode);
  const currentFrame = useMotionStore((state) => state.currentFrame);
  const setBoneTransform = usePoseStore((state) => state.setBoneTransform);
  const invalidate = useThree((state) => state.invalidate);
  const children = getBoneChildren(definition, bone.id);
  const syncTransform = (): void => {
    const object = groupRef.current;
    if (!object) return;
    setBoneTransform(bone.id, {
      position: { x: object.position.x - bone.position[0], y: object.position.y - bone.position[1], z: object.position.z - bone.position[2] },
      rotation: radiansToDegrees([object.rotation.x, object.rotation.y, object.rotation.z]),
      scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z }
    }, currentFrame);
    invalidate();
  };
  return <><group name={bone.id} position={[bone.position[0] + position.x, bone.position[1] + position.y, bone.position[2] + position.z]} ref={groupRef} rotation={degreesToRadians(rotation)} scale={[scale.x, scale.y, scale.z]}><mesh castShadow onClick={(event) => { event.stopPropagation(); selectBone(bone.id); }} scale={bone.scale}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={selected ? "#fbbf24" : "#8b5cf6"} emissive={selected ? "#78350f" : "#281452"} emissiveIntensity={selected ? 0.6 : 0.35} metalness={0.1} roughness={0.55} wireframe /></mesh>{children.map((child) => <RigNode bone={child} definition={definition} key={child.id} />)}</group>{selected && groupRef.current && <TransformControls mode={transformMode} object={groupRef.current} onMouseUp={syncTransform} onObjectChange={syncTransform} size={0.85} space="local" />}</>;
}

/** Data-driven R6/R15 placeholder renderer. Replace only the mesh layer when loading Roblox assets later. */
export function RigPlaceholder({ rigType }: { readonly rigType: RigType }) {
  const loadRig = useRigStore((state) => state.loadRig);
  const definition = getRigDefinition(rigType);
  const rootBones = getBoneChildren(definition, null);
  useEffect(() => { loadRig(rigType); }, [loadRig, rigType]);
  return <group name={`roblox-${rigType.toLowerCase()}-rig`}>{rootBones.map((bone) => <RigNode bone={bone} definition={definition} key={bone.id} />)}</group>;
}
