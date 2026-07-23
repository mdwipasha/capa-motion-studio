import { MousePointer2 } from "lucide-react";
import { PanelHeader } from "@/features/editor/components/PanelHeader";
import { useActiveProject } from "@/hooks/useActiveProject";

export function WorkspaceInspector() {
  const project = useActiveProject();
  return <aside className="w-72 shrink-0 border-l border-white/10 bg-[#15161d]"><PanelHeader>Inspector</PanelHeader><div className="space-y-6 p-4"><section><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Project</p><dl className="mt-3 space-y-2.5 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-500">Name</dt><dd className="truncate text-slate-200">{project.name}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Rig</dt><dd className="text-slate-200">Roblox {project.rigType}</dd></div><div className="flex justify-between"><dt className="text-slate-500">FPS</dt><dd className="text-slate-200">30</dd></div></dl></section><section className="border-t border-white/8 pt-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Selection</p><div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-xs text-slate-500"><MousePointer2 size={15} />Nothing selected</div></section></div></aside>;
}
