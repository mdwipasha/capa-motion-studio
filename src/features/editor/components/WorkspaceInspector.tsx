import { MousePointer2 } from "lucide-react";
import { PanelHeader } from "@/features/editor/components/PanelHeader";
import { useActiveProject } from "@/hooks/useActiveProject";
import { frameToTime, formatTime } from "@/lib/motion";
import { useMotionStore } from "@/stores/motion-store";

export function WorkspaceInspector() {
  const project = useActiveProject();
  const { fps, keyframes } = useMotionStore((state) => state.motionData.timeline);
  const selectedKeyframeId = useMotionStore((state) => state.selectedKeyframeId);
  const updateSelectedKeyframeFrame = useMotionStore((state) => state.updateSelectedKeyframeFrame);
  const selectedKeyframe = keyframes.find((keyframe) => keyframe.id === selectedKeyframeId);
  return <aside className="w-72 shrink-0 border-l border-white/10 bg-[#15161d]"><PanelHeader>Inspector</PanelHeader><div className="space-y-6 p-4"><section><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Project</p><dl className="mt-3 space-y-2.5 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-500">Name</dt><dd className="truncate text-slate-200">{project.name}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Rig</dt><dd className="text-slate-200">Roblox {project.rigType}</dd></div><div className="flex justify-between"><dt className="text-slate-500">FPS</dt><dd className="text-slate-200">{fps}</dd></div></dl></section><section className="border-t border-white/8 pt-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Selection</p>{selectedKeyframe ? <div className="mt-3 space-y-3 rounded-lg border border-violet-400/20 bg-violet-400/5 p-3 text-xs"><p className="font-medium text-violet-200">Keyframe</p><label className="flex items-center justify-between gap-3 text-slate-500">Frame <input aria-label="Selected keyframe frame" className="timeline-number-input" min={0} onChange={(event) => updateSelectedKeyframeFrame(Number(event.target.value))} type="number" value={selectedKeyframe.frame} /></label><div className="flex justify-between"><span className="text-slate-500">Time</span><span className="text-slate-200">{formatTime(frameToTime(selectedKeyframe.frame, fps))}</span></div></div> : <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-xs text-slate-500"><MousePointer2 size={15} />Nothing selected</div>}</section></div></aside>;
}
