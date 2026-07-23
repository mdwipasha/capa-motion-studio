import { useEffect } from "react";
import { degreesToRadians } from "@/lib/pose";
import { getBoneChildren, getRigDefinition } from "@/lib/rig";
import { useBoneRotation } from "@/stores/pose-store";
import { useRigStore } from "@/stores/rig-store";
import type { RigBoneDefinition, RigDefinition } from "@/types/rig";
import type { RigType } from "@/types/project";

interface RigNodeProps { readonly bone: RigBoneDefinition; readonly definition: RigDefinition; }

function RigNode({ bone, definition }: RigNodeProps) {
  const rotation = useBoneRotation(bone.id);
  const selected = useRigStore((state) => state.selectedBoneId === bone.id);
  const selectBone = useRigStore((state) => state.selectBone);
  const children = getBoneChildren(definition, bone.id);
  return <group name={bone.id} position={bone.position} rotation={degreesToRadians(rotation)}><mesh castShadow onClick={(event) => { event.stopPropagation(); selectBone(bone.id); }} scale={bone.scale}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={selected ? "#fbbf24" : "#8b5cf6"} emissive={selected ? "#78350f" : "#281452"} emissiveIntensity={selected ? 0.6 : 0.35} metalness={0.1} roughness={0.55} wireframe /></mesh>{selected && <group raycast={() => null}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.82, 0.018, 8, 48]} /><meshBasicMaterial color="#fb7185" depthTest={false} /></mesh><mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.9, 0.018, 8, 48]} /><meshBasicMaterial color="#34d399" depthTest={false} /></mesh><mesh><torusGeometry args={[0.98, 0.018, 8, 48]} /><meshBasicMaterial color="#60a5fa" depthTest={false} /></mesh></group>}{children.map((child) => <RigNode bone={child} definition={definition} key={child.id} />)}</group>;
}

/** Data-driven R6/R15 placeholder renderer. Replace only the mesh layer when loading Roblox assets later. */
export function RigPlaceholder({ rigType }: { readonly rigType: RigType }) {
  const loadRig = useRigStore((state) => state.loadRig);
  const definition = getRigDefinition(rigType);
  const rootBones = getBoneChildren(definition, null);
  useEffect(() => { loadRig(rigType); }, [loadRig, rigType]);
  return <group name={`roblox-${rigType.toLowerCase()}-rig`}>{rootBones.map((bone) => <RigNode bone={bone} definition={definition} key={bone.id} />)}</group>;
}
