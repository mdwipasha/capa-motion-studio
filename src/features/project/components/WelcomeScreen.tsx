import { Clock3, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatRelativeDate } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";

export function WelcomeScreen() {
  const recentProjects = useProjectStore((state) => state.recentProjects);
  const openProject = useProjectStore((state) => state.openProject);
  const setDialogOpen = useProjectStore((state) => state.setNewProjectDialogOpen);

  return <main className="min-h-screen bg-[#101116] text-slate-100"><header className="flex h-14 items-center border-b border-white/10 px-6"><span className="text-base font-semibold tracking-tight text-white">Capa<span className="text-violet-400">Motion</span></span><span className="ml-3 border-l border-white/10 pl-3 text-xs text-slate-500">Roblox animation studio</span></header><section className="mx-auto max-w-4xl px-8 py-20"><p className="text-sm font-medium text-violet-300">WELCOME TO CAPAMOTION</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Make motion, one project at a time.</h1><p className="mt-3 max-w-xl text-slate-400">A local-first workspace for building Roblox character animation. Your new project starts with a rig, ready for the editor to grow around it.</p><div className="mt-8 flex gap-3"><Button onClick={() => setDialogOpen(true)}><Plus size={16} />New project</Button><Button onClick={() => recentProjects[0] && openProject(recentProjects[0])} variant="secondary"><FolderOpen size={16} />Open recent</Button></div><div className="mt-16"><div className="flex items-center gap-2 text-sm font-medium text-slate-300"><Clock3 size={16} />Recent projects</div><div className="mt-3 divide-y divide-white/8 rounded-xl border border-white/10 bg-white/[0.025]">{recentProjects.map((project) => <button className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.04]" key={project.id} onClick={() => openProject(project)}><div><p className="font-medium text-slate-100">{project.name}</p><p className="mt-1 text-xs text-slate-500">Roblox {project.rigType} · {project.filePath ?? "Unsaved project"}</p></div><span className="text-xs text-slate-500">{formatRelativeDate(project.updatedAt)}</span></button>)}</div></div></section></main>;
}
