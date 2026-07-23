import { Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BottomPanel } from "@/features/editor/components/BottomPanel";
import { ProjectSidebar } from "@/features/editor/components/ProjectSidebar";
import { TopToolbar } from "@/features/editor/components/TopToolbar";
import { WorkspaceInspector } from "@/features/editor/components/WorkspaceInspector";
import { PreviewViewport } from "@/features/preview/components/PreviewViewport";
import { useMotionShortcuts } from "@/hooks/useMotionShortcuts";
import { usePlayback } from "@/hooks/usePlayback";
import { usePreviewStore } from "@/stores/preview-store";

export function StudioShell() {
  usePlayback();
  useMotionShortcuts();
  const isGridVisible = usePreviewStore((state) => state.isGridVisible);
  const toggleGrid = usePreviewStore((state) => state.toggleGrid);
  return <main className="flex h-screen min-h-[680px] min-w-[1024px] flex-col overflow-hidden bg-[#111218] text-slate-200"><TopToolbar /><div className="flex min-h-0 flex-1"><ProjectSidebar /><section className="flex min-w-0 flex-1 flex-col"><div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-[#15161d] px-3"><span className="text-xs text-slate-400">3D Viewport</span><Button onClick={toggleGrid} size="sm" variant="ghost"><Grid3X3 size={14} />Grid {isGridVisible ? "on" : "off"}</Button></div><div className="min-h-0 flex-1"><PreviewViewport /></div><BottomPanel /></section><WorkspaceInspector /></div></main>;
}
