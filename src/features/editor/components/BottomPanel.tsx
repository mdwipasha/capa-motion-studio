import { ChevronsDownUp, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PanelHeader } from "@/features/editor/components/PanelHeader";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function BottomPanel() {
  const isOpen = useWorkspaceStore((state) => state.isBottomPanelOpen);
  const toggle = useWorkspaceStore((state) => state.toggleBottomPanel);
  return <section className={`${isOpen ? "h-36" : "h-9"} shrink-0 overflow-hidden border-t border-white/10 bg-[#15161d] transition-[height] duration-150`}><PanelHeader action={<Button aria-label="Toggle bottom panel" onClick={toggle} size="sm" variant="ghost"><ChevronsDownUp size={14} /></Button>}>Timeline</PanelHeader>{isOpen && <div className="grid h-[calc(100%-2.25rem)] place-items-center text-center"><div><Clock3 className="mx-auto text-slate-500" size={18} /><p className="mt-2 text-sm font-medium text-slate-400">Timeline Coming Soon</p><p className="mt-1 text-xs text-slate-600">Timeline, keyframes, and playback controls will live here.</p></div></div>}</section>;
}
