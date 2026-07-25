import { Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BottomPanel } from "@/features/editor/components/BottomPanel";
import { AiToolsDialog } from "@/features/ai-tools/components/AiToolsDialog";
import { ProjectSidebar } from "@/features/editor/components/ProjectSidebar";
import { TopToolbar } from "@/features/editor/components/TopToolbar";
import { WorkspaceInspector } from "@/features/editor/components/WorkspaceInspector";
import { PreviewViewport } from "@/features/preview/components/PreviewViewport";
import { useMotionShortcuts } from "@/hooks/useMotionShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
import { usePlayback } from "@/hooks/usePlayback";
import { usePoseTimeline } from "@/hooks/usePoseTimeline";
import { usePreviewStore } from "@/stores/preview-store";
import { useRetargetStore } from "@/stores/retarget-store";

export function StudioShell() {
  usePlayback();
  useMotionShortcuts();
  usePoseTimeline();
  useAutosave();
  const isGridVisible = usePreviewStore((state) => state.isGridVisible);
  const toggleGrid = usePreviewStore((state) => state.toggleGrid);
  const previewMode = useRetargetStore((state) => state.previewMode);
  const setPreviewMode = useRetargetStore((state) => state.setPreviewMode);
  const hasRetargetResult = useRetargetStore((state) => state.result !== null);
  return <main className="flex h-screen min-h-[680px] min-w-[1024px] flex-col overflow-hidden bg-[#111218] text-slate-200"><TopToolbar /><div className="flex min-h-0 flex-1"><ProjectSidebar /><section className="flex min-w-0 flex-1 flex-col"><div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-[#15161d] px-3"><span className="text-xs text-slate-400">3D Viewport</span><div className="flex items-center gap-1">{hasRetargetResult && <div className="mr-2 flex rounded border border-white/10 p-0.5">{(["before", "after", "split"] as const).map((mode) => <button className={`rounded px-2 py-1 text-[10px] ${previewMode === mode ? "bg-violet-400/20 text-violet-100" : "text-slate-500"}`} key={mode} onClick={() => setPreviewMode(mode)} type="button">{mode[0].toUpperCase() + mode.slice(1)}</button>)}</div>}<Button onClick={toggleGrid} size="sm" variant="ghost"><Grid3X3 size={14} />Grid {isGridVisible ? "on" : "off"}</Button></div></div><div className="min-h-0 flex-1"><PreviewViewport /></div><BottomPanel /></section><WorkspaceInspector /></div><AiToolsDialog /></main>;
}
