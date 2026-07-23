import { ChevronDown, ChevronRight, Cuboid } from "lucide-react";
import { useState } from "react";
import { getBoneChildren } from "@/lib/rig";
import { useRigStore } from "@/stores/rig-store";
import type { RigBoneDefinition, RigDefinition } from "@/types/rig";

interface BoneTreeNodeProps { readonly bone: RigBoneDefinition; readonly definition: RigDefinition; readonly depth: number; }

function BoneTreeNode({ bone, definition, depth }: BoneTreeNodeProps) {
  const children = getBoneChildren(definition, bone.id);
  const [isExpanded, setExpanded] = useState(true);
  const selectedBoneId = useRigStore((state) => state.selectedBoneId);
  const selectBone = useRigStore((state) => state.selectBone);
  const hasChildren = children.length > 0;
  return <li><div className={`group flex h-7 items-center rounded-md pr-1 text-xs ${selectedBoneId === bone.id ? "bg-violet-400/15 text-violet-100" : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-200"}`} style={{ paddingLeft: `${depth * 13 + 4}px` }}><button aria-label={`${isExpanded ? "Collapse" : "Expand"} ${bone.name}`} className="grid h-5 w-5 place-items-center text-slate-500 disabled:opacity-0" disabled={!hasChildren} onClick={() => setExpanded((value) => !value)} type="button">{isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button><button className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left" onClick={() => selectBone(bone.id)} type="button"><Cuboid size={13} className={selectedBoneId === bone.id ? "text-violet-300" : "text-slate-600"} /><span className="truncate">{bone.name}</span></button></div>{hasChildren && isExpanded && <ul>{children.map((child) => <BoneTreeNode bone={child} definition={definition} depth={depth + 1} key={child.id} />)}</ul>}</li>;
}

export function BoneHierarchy({ definition }: { readonly definition: RigDefinition }) {
  const roots = getBoneChildren(definition, null);
  return <ul aria-label="Bone hierarchy" className="space-y-0.5">{roots.map((bone) => <BoneTreeNode bone={bone} definition={definition} depth={0} key={bone.id} />)}</ul>;
}
