import { FileBox } from "lucide-react";
import { PanelHeader } from "@/features/editor/components/PanelHeader";
import { BoneHierarchy } from "@/features/rig/components/BoneHierarchy";
import { useActiveProject } from "@/hooks/useActiveProject";
import { getRigDefinition } from "@/lib/rig";
import { useRigStore } from "@/stores/rig-store";

export function ProjectSidebar() {
  const project = useActiveProject();
  const currentRig = useRigStore((state) => state.currentRig);
  const definition = currentRig?.id === project.rigType ? currentRig : getRigDefinition(project.rigType);
  return <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#15161d]"><PanelHeader>Project</PanelHeader><div className="p-3"><div className="rounded-lg border border-white/8 bg-white/[0.025] p-3"><div className="flex items-center gap-2 text-slate-200"><FileBox size={16} className="text-violet-300" /><span className="truncate text-sm font-medium">{project.name}</span></div><dl className="mt-3 space-y-2 text-xs"><div className="flex justify-between gap-2"><dt className="text-slate-500">Rig type</dt><dd className="text-slate-300">Roblox {project.rigType}</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Bones</dt><dd className="text-slate-300">{definition.bones.length}</dd></div></dl></div><p className="mb-2 mt-6 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bone hierarchy</p><div className="min-h-0 overflow-y-auto"><BoneHierarchy definition={definition} /></div></div></aside>;
}
