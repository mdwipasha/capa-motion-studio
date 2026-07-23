import { memo, useMemo } from "react";
import { keyframeAtFrame } from "@/lib/motion";
import { useMotionStore } from "@/stores/motion-store";
import type { MotionKeyframe } from "@/types/motion";

interface TimelineRulerProps {
  readonly keyframes: readonly MotionKeyframe[];
  readonly totalFrames: number;
  readonly selectedKeyframeId: string | null;
  readonly onFrameSelect: (frame: number) => void;
  readonly onKeyframeSelect: (keyframeId: string) => void;
}

function TimelinePlayhead({ totalFrames }: { readonly totalFrames: number }) {
  const currentFrame = useMotionStore((state) => state.currentFrame);
  return <div className="timeline-playhead" style={{ left: `${(currentFrame / totalFrames) * 100}%` }}><span /></div>;
}

export const TimelineRuler = memo(function TimelineRuler({ keyframes, totalFrames, selectedKeyframeId, onFrameSelect, onKeyframeSelect }: TimelineRulerProps) {
  const markers = useMemo(() => Array.from({ length: totalFrames + 1 }, (_, index) => index), [totalFrames]);
  return <div className="timeline-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden"><div className="timeline-ruler relative h-full min-w-[720px]" style={{ width: `${Math.max(720, (totalFrames + 1) * 12)}px` }}>{markers.map((frame) => { const keyframe = keyframeAtFrame(keyframes, frame); const isMajor = frame % 10 === 0; return <button aria-label={`Frame ${frame}${keyframe ? ", contains keyframe" : ""}`} className="timeline-frame" key={frame} onClick={() => onFrameSelect(frame)} style={{ left: `${(frame / totalFrames) * 100}%` }}>{isMajor && <span className="timeline-frame-label">{frame}</span>}<span className={`timeline-tick ${isMajor ? "timeline-tick-major" : ""}`} />{keyframe && <span aria-hidden="true" className={`timeline-keyframe ${keyframe.id === selectedKeyframeId ? "timeline-keyframe-selected" : ""}`} onClick={(event) => { event.stopPropagation(); onKeyframeSelect(keyframe.id); }} />}</button>; })}<TimelinePlayhead totalFrames={totalFrames} /></div></div>;
});
