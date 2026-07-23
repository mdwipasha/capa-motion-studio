import { Bot, Download, FolderOpen, Plus, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/stores/project-store";

export function TopToolbar() {
  const saveProject = useProjectStore((state) => state.saveProject);
  const openProject = useProjectStore((state) => state.openProject);
  const recentProjects = useProjectStore((state) => state.recentProjects);
  const setNewProjectDialogOpen = useProjectStore((state) => state.setNewProjectDialogOpen);

  return <header className="flex h-12 shrink-0 items-center gap-1 border-b border-white/10 bg-[#171820] px-3"><span className="mr-3 px-2 text-sm font-semibold text-white">Capa<span className="text-violet-400">Motion</span></span><div className="flex items-center gap-1"><Button onClick={() => setNewProjectDialogOpen(true)} size="sm" variant="ghost"><Plus size={14} />New</Button><Button disabled={recentProjects.length === 0} onClick={() => recentProjects[0] && openProject(recentProjects[0])} size="sm" variant="ghost"><FolderOpen size={14} />Open</Button><Button onClick={saveProject} size="sm" variant="secondary"><Save size={14} />Save</Button></div><div className="mx-2 h-5 border-l border-white/10" /><div className="flex items-center gap-1"><Button disabled size="sm" variant="ghost"><Download size={14} />Import</Button><Button disabled size="sm" variant="ghost"><Download className="rotate-180" size={14} />Export</Button></div><div className="ml-auto flex items-center gap-1"><Button disabled aria-label="AI tools coming soon" size="sm" variant="ghost"><Bot size={15} />AI</Button><Button disabled aria-label="Settings coming soon" size="sm" variant="ghost"><Settings2 size={15} /></Button></div></header>;
}
