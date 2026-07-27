import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Rotate3D } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ViewportScene } from "@/features/preview/components/ViewportScene";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCameraStore } from "@/stores/camera-store";
import { usePreviewStore } from "@/stores/preview-store";
import { useRetargetStore } from "@/stores/retarget-store";
import { useAiStore } from "@/stores/ai-store";
import { useMotionStore } from "@/stores/motion-store";
import { useSettingsStore } from "@/stores/settings-store";

export function PreviewViewport() {
  const isGridVisible = usePreviewStore((state) => state.isGridVisible);
  const requestCameraReset = useCameraStore((state) => state.requestReset);
  const project = useActiveProject();
  const backgroundColor = useSettingsStore((state) => state.viewportBackgroundColor);
  const previewMode = useRetargetStore((state) => state.previewMode);
  const result = useAiStore((state) => state.result);
  const currentVideo = useAiStore((state) => state.currentVideo);
  const playbackState = useMotionStore((state) => state.playbackState);
  const currentFrame = useMotionStore((state) => state.currentFrame);
  const fps = useMotionStore((state) => state.motionData.timeline.fps);
  const isBefore = previewMode === "before";
  const isSplit = previewMode === "split";
  return <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor }}><Canvas camera={{ fov: 45, position: [7, 5, 9] }} dpr={[1, 2]} frameloop="demand" gl={{ antialias: true, powerPreference: "high-performance" }} shadows><color args={[backgroundColor]} attach="background" /><ViewportScene isGridVisible={isGridVisible} rigType={project.rigType} showRig={!isBefore} /></Canvas>{(isBefore || isSplit) && (currentVideo?.sourceUrl || result?.overlayDataUrl) && <SourceVideoOverlay currentFrame={currentFrame} fallbackImageUrl={result?.overlayDataUrl ?? ""} fps={fps} isBefore={isBefore} playbackState={playbackState} sourceUrl={currentVideo?.sourceUrl ?? ""} />}<div className="absolute left-3 top-3 rounded-md border border-white/10 bg-[#15161d]/90 px-2.5 py-1.5 text-xs text-slate-400 backdrop-blur"><span className="text-slate-500">Preview</span><span className="mx-1.5 text-white/20">/</span>{isBefore ? "Before: source video" : isSplit ? "Before / After" : `After: Roblox ${project.rigType}`}</div><Button className="absolute bottom-3 right-3 bg-[#15161d]/90" onClick={requestCameraReset} size="sm" variant="secondary"><Rotate3D size={14} />Reset Camera</Button></div>;
}

function SourceVideoOverlay({ currentFrame, fallbackImageUrl, fps, isBefore, playbackState, sourceUrl }: { readonly currentFrame: number; readonly fallbackImageUrl: string; readonly fps: number; readonly isBefore: boolean; readonly playbackState: "playing" | "paused"; readonly sourceUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTime = currentFrame / fps;
  const className = isBefore ? "absolute inset-0 grid place-items-center bg-black/40" : "absolute left-3 top-12 w-48 overflow-hidden rounded-md border border-white/10 bg-black/70";
  const mediaClassName = isBefore ? "max-h-full max-w-full object-contain" : "w-full";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(targetTime) && Math.abs(video.currentTime - targetTime) > 0.12) {
      video.currentTime = Math.min(targetTime, video.duration || targetTime);
    }
  }, [targetTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playbackState === "playing") {
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
  }, [playbackState, sourceUrl]);

  return (
    <div className={className}>
      {sourceUrl ? (
        <video className={mediaClassName} muted playsInline preload="auto" ref={videoRef} src={sourceUrl} />
      ) : (
        <img alt="Original detected pose" className={mediaClassName} src={fallbackImageUrl} />
      )}
    </div>
  );
}
