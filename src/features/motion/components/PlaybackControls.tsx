import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getTotalFrames } from "@/lib/motion";
import { useMotionStore } from "@/stores/motion-store";

export function PlaybackControls() {
  const currentFrame = useMotionStore((state) => state.currentFrame);
  const { fps, duration } = useMotionStore((state) => state.motionData.timeline);
  const playbackState = useMotionStore((state) => state.playbackState);
  const setCurrentFrame = useMotionStore((state) => state.setCurrentFrame);
  const play = useMotionStore((state) => state.play);
  const pause = useMotionStore((state) => state.pause);
  const stop = useMotionStore((state) => state.stop);
  const totalFrames = getTotalFrames(fps, duration);
  return <div className="flex items-center gap-1"><Button aria-label="Go to start" onClick={() => setCurrentFrame(0)} size="sm" variant="ghost"><SkipBack size={14} /></Button><Button aria-label="Previous frame" onClick={() => setCurrentFrame(currentFrame - 1)} size="sm" variant="ghost"><ChevronLeft size={14} /></Button><Button aria-label={playbackState === "playing" ? "Pause" : "Play"} className="mx-1" onClick={playbackState === "playing" ? pause : play} size="sm">{playbackState === "playing" ? <Pause size={14} /> : <Play size={14} />}{playbackState === "playing" ? "Pause" : "Play"}</Button><Button aria-label="Stop" onClick={stop} size="sm" variant="ghost"><RotateCcw size={14} /></Button><Button aria-label="Next frame" onClick={() => setCurrentFrame(currentFrame + 1)} size="sm" variant="ghost"><ChevronRight size={14} /></Button><Button aria-label="Go to end" onClick={() => setCurrentFrame(totalFrames)} size="sm" variant="ghost"><SkipForward size={14} /></Button></div>;
}
