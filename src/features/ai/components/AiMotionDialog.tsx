import { useRef, useState, type DragEvent } from "react";
import { Bot, FileVideo, LoaderCircle, Square, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cancelActiveAiPipeline, runAiPipeline, validateVideoFile } from "@/features/ai/lib/ai-pipeline-service";
import { useAiStore } from "@/stores/ai-store";
import { useRetargetStore } from "@/stores/retarget-store";

const activeSteps = new Set(["uploading", "loading_video", "extracting_frames", "detecting_pose", "building_motion"]);

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AiMotionDialog() {
  const isOpen = useAiStore((state) => state.isPanelOpen);
  const setPanelOpen = useAiStore((state) => state.setPanelOpen);
  const currentStep = useAiStore((state) => state.currentStep);
  const progress = useAiStore((state) => state.progress);
  const currentFrame = useAiStore((state) => state.currentFrame);
  const message = useAiStore((state) => state.message);
  const currentVideo = useAiStore((state) => state.currentVideo);
  const metadata = useAiStore((state) => state.metadata);
  const result = useAiStore((state) => state.result);
  const error = useAiStore((state) => state.error);
  const reset = useAiStore((state) => state.reset);
  const setRetargetPanelOpen = useRetargetStore((state) => state.setPanelOpen);
  const input = useRef<HTMLInputElement>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  if (!isOpen) return null;
  const isRunning = activeSteps.has(currentStep);
  const selectFile = (file: File | null): void => {
    if (!file || isRunning) return;
    try {
      validateVideoFile(file);
      setDropError(null);
      void runAiPipeline(file);
    } catch (fileError) {
      setDropError(fileError instanceof Error ? fileError.message : "Unable to use this video.");
    }
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>): void => { event.preventDefault(); selectFile(event.dataTransfer.files.item(0)); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-5 backdrop-blur-sm"><section aria-labelledby="ai-motion-title" className="flex max-h-[min(760px,calc(100vh-40px))] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#171820] shadow-2xl" role="dialog"><header className="flex items-start justify-between border-b border-white/10 p-5"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-white" id="ai-motion-title"><Bot size={19} className="text-violet-300" />AI Motion Pipeline</h2><p className="mt-1 text-sm text-slate-400">Local video-to-motion reconstruction. No cloud API is used.</p></div><Button aria-label="Close AI motion pipeline" onClick={() => setPanelOpen(false)} size="sm" variant="ghost"><X size={16} /></Button></header><div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[1fr_1.1fr]"><div className="space-y-4"><input accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo" className="hidden" onChange={(event) => selectFile(event.target.files?.item(0) ?? null)} ref={input} type="file" /><div className="rounded-lg border border-dashed border-violet-400/35 bg-violet-400/5 p-6 text-center" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}><FileVideo className="mx-auto text-violet-300" size={28} /><p className="mt-3 text-sm font-medium text-white">Drop an MP4, MOV, or AVI video</p><p className="mt-1 text-xs text-slate-500">The video is sent only to the local Python service.</p><Button className="mt-4" disabled={isRunning} onClick={() => input.current?.click()} size="sm" variant="secondary"><Upload size={14} />Open Video</Button></div>{dropError && <p className="rounded border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-xs text-rose-200">{dropError}</p>}{currentVideo && <div className="rounded-lg border border-white/10 bg-black/10 p-3 text-xs"><p className="truncate font-medium text-slate-200">{currentVideo.name}</p><p className="mt-1 text-slate-500">{formatBytes(currentVideo.size)}</p>{metadata && <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2"><div><dt className="text-slate-500">Resolution</dt><dd className="text-slate-200">{metadata.width} x {metadata.height}</dd></div><div><dt className="text-slate-500">FPS</dt><dd className="text-slate-200">{metadata.fps.toFixed(2)}</dd></div><div><dt className="text-slate-500">Duration</dt><dd className="text-slate-200">{metadata.duration.toFixed(2)}s</dd></div><div><dt className="text-slate-500">Total Frames</dt><dd className="text-slate-200">{metadata.total_frames}</dd></div></dl>}</div>}<div className="rounded-lg border border-white/10 bg-black/10 p-3"><div className="flex justify-between text-xs"><span className="font-medium text-slate-200">{message}</span><span className="text-violet-300">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10"><div className="h-full bg-violet-400 transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[11px] text-slate-500">Step: {currentStep} {currentFrame > 0 ? `- frame ${currentFrame}` : ""}</p>{isRunning && <Button className="mt-3" onClick={() => { void cancelActiveAiPipeline(); }} size="sm" variant="ghost"><Square size={13} />Cancel Process</Button>}{error && <p className="mt-3 text-xs text-rose-200">{error}</p>}</div></div><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Original Frame</p><div className="grid aspect-video place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/20">{result?.originalDataUrl ? <img alt="Original extracted video frame" className="h-full w-full object-contain" src={result.originalDataUrl} /> : <span className="text-xs text-slate-600">Available after detection</span>}</div></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Skeleton Overlay</p><div className="grid aspect-video place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/20">{result?.overlayDataUrl ? <img alt="Detected skeleton overlay" className="h-full w-full object-contain" src={result.overlayDataUrl} /> : <span className="text-xs text-slate-600">Available after detection</span>}</div></div></div><div className="rounded-lg border border-white/10 bg-black/10 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline log</p><ol className="mt-3 space-y-2 text-xs text-slate-400"><li>1. Loading Video {currentStep === "loading_video" && <LoaderCircle className="ml-1 inline animate-spin" size={12} />}</li><li>2. Extracting Frames with FFmpeg {currentStep === "extracting_frames" && <LoaderCircle className="ml-1 inline animate-spin" size={12} />}</li><li>3. Detecting Pose with configured local detector {currentStep === "detecting_pose" && <LoaderCircle className="ml-1 inline animate-spin" size={12} />}</li><li>4. Building retarget-free Motion Data {currentStep === "building_motion" && <LoaderCircle className="ml-1 inline animate-spin" size={12} />}</li><li className={currentStep === "finished" ? "text-emerald-300" : ""}>5. {currentStep === "finished" ? `Finished: ${result?.motionData.reconstruction.length ?? 0} reconstructed frames` : "Ready"}</li></ol>{currentStep === "finished" && <Button className="mt-4" onClick={() => setRetargetPanelOpen(true)} size="sm">Create Roblox Draft</Button>}{(currentStep === "failed" || currentStep === "cancelled") && <Button className="mt-4" onClick={reset} size="sm" variant="secondary">Process another video</Button>}</div></div></div></section></div>;
}
