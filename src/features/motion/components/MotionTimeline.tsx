import { KeyRound, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatTime, frameToTime, getTotalFrames } from "@/lib/motion";
import { useMotionStore } from "@/stores/motion-store";
import { PlaybackControls } from "@/features/motion/components/PlaybackControls";
import { TimelineRuler } from "@/features/motion/components/TimelineRuler";
import { TimelineSettings } from "@/features/motion/components/TimelineSettings";

export function MotionTimeline() {
  const currentFrame = useMotionStore((state) => state.currentFrame);
  const { fps, duration, keyframes } = useMotionStore((state) => state.motionData.timeline);
  const selectedKeyframeId = useMotionStore((state) => state.selectedKeyframeId);
  const undoStack = useMotionStore((state) => state.undoStack);
  const redoStack = useMotionStore((state) => state.redoStack);
  const setCurrentFrame = useMotionStore((state) => state.setCurrentFrame);
  const selectKeyframe = useMotionStore((state) => state.selectKeyframe);
  const addKeyframe = useMotionStore((state) => state.addKeyframe);
  const removeSelectedKeyframe = useMotionStore((state) => state.removeSelectedKeyframe);
  const undo = useMotionStore((state) => state.undo);
  const redo = useMotionStore((state) => state.redo);
  const totalFrames = getTotalFrames(fps, duration);
  const currentTime = formatTime(frameToTime(currentFrame, fps));
  const hasCurrentKeyframe = keyframes.some((keyframe) => keyframe.frame === currentFrame);
  return <div className="flex h-full min-h-0 flex-col"><div className="flex h-11 shrink-0 items-center justify-between border-b border-white/8 px-3"><div className="flex items-center gap-3"><PlaybackControls /><div className="h-5 border-l border-white/10" /><Button disabled={hasCurrentKeyframe} onClick={addKeyframe} size="sm" variant="secondary"><KeyRound size={14} />Add key</Button><Button disabled={!selectedKeyframeId} onClick={removeSelectedKeyframe} size="sm" variant="ghost"><Trash2 size={14} />Remove</Button><Button disabled={undoStack.length === 0} onClick={undo} size="sm" variant="ghost"><RotateCcw size={14} /></Button><Button disabled={redoStack.length === 0} onClick={redo} size="sm" variant="ghost"><RotateCw size={14} /></Button></div><TimelineSettings /></div><div className="flex h-8 shrink-0 items-center gap-4 border-b border-white/8 px-3 text-[11px] text-slate-500"><span>Frame <strong className="font-medium text-slate-200">{currentFrame}</strong> / {totalFrames}</span><span>Time <strong className="font-medium text-slate-200">{currentTime}</strong></span><span>{fps} FPS</span><span>Duration {duration}s</span></div><TimelineRuler keyframes={keyframes} onFrameSelect={setCurrentFrame} onKeyframeSelect={selectKeyframe} selectedKeyframeId={selectedKeyframeId} totalFrames={totalFrames} /></div>;
}
