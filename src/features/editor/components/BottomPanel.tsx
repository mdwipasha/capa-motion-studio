import { ChevronsDownUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PanelHeader } from "@/features/editor/components/PanelHeader";
import { MotionTimeline } from "@/features/motion/components/MotionTimeline";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function BottomPanel() {
  const isOpen = useWorkspaceStore((state) => state.isBottomPanelOpen);
  const toggle = useWorkspaceStore((state) => state.toggleBottomPanel);
  return <section className={`${isOpen ? "h-64" : "h-9"} shrink-0 overflow-hidden border-t border-white/10 bg-[#15161d] transition-[height] duration-150`}><PanelHeader action={<Button aria-label="Toggle timeline panel" onClick={toggle} size="sm" variant="ghost"><ChevronsDownUp size={14} /></Button>}>Timeline</PanelHeader>{isOpen && <MotionTimeline />}</section>;
}
