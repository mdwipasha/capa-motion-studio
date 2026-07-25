import { useEffect, useState } from "react";
import { Bot, CircleHelp, Cpu, Download, FileDown, FileUp, FolderOpen, Plus, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SettingsDialog } from "@/features/settings/components/SettingsDialog";
import { exportFbx, importFile, openProjectFile, saveActiveProject } from "@/features/project/lib/project-file-service";
import { useProjectStore } from "@/stores/project-store";
import { useAiStore } from "@/stores/ai-store";
import { useReleaseStore } from "@/stores/release-store";
import { checkRuntime } from "@/lib/desktop";

export function TopToolbar() {
  const setNewProjectDialogOpen = useProjectStore((state) => state.setNewProjectDialogOpen);
  const setAiPanelOpen = useAiStore((state) => state.setPanelOpen);
  const openReleaseCenter = useReleaseStore((state) => state.open);
  const runtime = useReleaseStore((state) => state.runtime);
  const setRuntime = useReleaseStore((state) => state.setRuntime);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => { void checkRuntime().then(setRuntime).catch(() => undefined); }, [setRuntime]);
  const run = (task: () => Promise<string | null>): void => {
    void task().then((message) => { if (message) setNotice(message); }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "The operation could not be completed."));
  };
  const aiReady = runtime?.aiModel && runtime.aiRuntimeReady;
  return <><header className="flex h-12 shrink-0 items-center gap-1 border-b border-white/10 bg-[#171820] px-3"><span className="mr-3 px-2 text-sm font-semibold text-white">Capa<span className="text-violet-400">Motion</span></span><div className="flex items-center gap-1"><Button onClick={() => setNewProjectDialogOpen(true)} size="sm" variant="ghost"><Plus size={14} />New</Button><Button onClick={() => run(openProjectFile)} size="sm" variant="ghost"><FolderOpen size={14} />Open</Button><Button onClick={() => run(() => saveActiveProject(false))} size="sm" variant="secondary"><Save size={14} />Save</Button><Button onClick={() => run(() => saveActiveProject(true))} size="sm" variant="ghost" title="Save As"><FileDown size={14} />Save As</Button></div><div className="mx-2 h-5 border-l border-white/10" /><div className="flex items-center gap-1"><Button onClick={() => run(importFile)} size="sm" variant="ghost"><FileUp size={14} />Import</Button><Button onClick={() => run(() => saveActiveProject(true))} size="sm" variant="ghost"><Download size={14} />Export .rma</Button><Button onClick={() => run(exportFbx)} size="sm" title="Export FBX animation" variant="ghost">FBX</Button></div>{notice && <button className="ml-2 max-w-80 truncate rounded bg-white/5 px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10" onClick={() => setNotice(null)} title="Click to dismiss">{notice}</button>}<div className="ml-auto flex items-center gap-1">{aiReady ? <Button aria-label="Open AI motion pipeline" onClick={() => setAiPanelOpen(true)} size="sm" variant="ghost"><Bot size={15} />AI</Button> : <Button aria-label="Open AI model manager" onClick={() => openReleaseCenter("models")} size="sm" variant="ghost"><Cpu size={15} />AI Models</Button>}<Button aria-label="Open Help" onClick={() => openReleaseCenter("help")} size="sm" variant="ghost"><CircleHelp size={15} /></Button><Button aria-label="Open settings" onClick={() => setSettingsOpen(true)} size="sm" variant="ghost"><Settings2 size={15} /></Button></div></header><SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} /></>;
}
