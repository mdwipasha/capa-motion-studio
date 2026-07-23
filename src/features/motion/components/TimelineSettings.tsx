import { Settings2 } from "lucide-react";
import { useMotionStore } from "@/stores/motion-store";

export function TimelineSettings() {
  const { fps, duration } = useMotionStore((state) => state.motionData.timeline);
  const setPlaybackSettings = useMotionStore((state) => state.setPlaybackSettings);
  return <div className="flex items-center gap-2 text-xs"><Settings2 size={14} className="text-slate-500" /><label className="flex items-center gap-1.5 text-slate-500">FPS <input aria-label="Frames per second" className="timeline-number-input" max={60} min={1} onChange={(event) => setPlaybackSettings(Number(event.target.value), duration)} type="number" value={fps} /></label><label className="flex items-center gap-1.5 text-slate-500">Duration <input aria-label="Duration in seconds" className="timeline-number-input" max={60} min={1} onChange={(event) => setPlaybackSettings(fps, Number(event.target.value))} type="number" value={duration} /><span>s</span></label></div>;
}
