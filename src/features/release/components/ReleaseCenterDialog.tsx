import { useEffect, useState, type ReactNode } from "react";
import { listen } from "@tauri-apps/api/event";
import { BookOpen, Bug, ChevronLeft, Cpu, ExternalLink, FolderOpen, Info, Keyboard, LoaderCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { checkForUpdates, checkRuntime, downloadAiModel, downloadAiRuntime, getReleaseInfo, openLogFolder, removeAiRuntime, removePlaceholderModel } from "@/lib/desktop";
import { appVersion } from "@/lib/app-info";
import { useReleaseStore } from "@/stores/release-store";
import type { ReleaseInfo, RuntimeStatus } from "@/types/release";

const shortcuts = [
  ["Space", "Play / Pause"],
  ["Left / Right", "Previous / Next frame"],
  ["Home / End", "Go to start / end"],
  ["Delete", "Delete selected keyframe"],
  ["Ctrl + Z", "Undo"],
  ["Ctrl + Shift + Z", "Redo"]
] as const;

export function ReleaseCenterDialog() {
  const isOpen = useReleaseStore((state) => state.isOpen);
  const view = useReleaseStore((state) => state.view);
  const close = useReleaseStore((state) => state.close);
  const open = useReleaseStore((state) => state.open);
  const runtime = useReleaseStore((state) => state.runtime);
  const setRuntime = useReleaseStore((state) => state.setRuntime);
  const runtimeAction = useReleaseStore((state) => state.runtimeAction);
  const runtimeMessage = useReleaseStore((state) => state.runtimeMessage);
  const runtimeProgress = useReleaseStore((state) => state.runtimeProgress);
  const setRuntimeAction = useReleaseStore((state) => state.setRuntimeAction);
  const modelAction = useReleaseStore((state) => state.modelAction);
  const modelProgress = useReleaseStore((state) => state.modelProgress);
  const setModelAction = useReleaseStore((state) => state.setModelAction);
  const notice = useReleaseStore((state) => state.notice);
  const setNotice = useReleaseStore((state) => state.setNotice);

  const refreshRuntime = (): void => {
    void checkRuntime().then(setRuntime).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Runtime check failed."));
  };

  useEffect(() => {
    if (isOpen) refreshRuntime();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let unlisten: (() => void) | null = null;
    let isMounted = true;
    void listen<{ readonly progress: number; readonly message: string }>("ai-runtime-download-progress", (event) => {
      if (isMounted) setRuntimeAction("downloading", event.payload.progress, event.payload.message);
    }).then((handler) => {
      if (isMounted) unlisten = handler;
      else handler();
    });
    return () => {
      isMounted = false;
      unlisten?.();
    };
  }, [isOpen, setRuntimeAction]);

  if (!isOpen) return null;

  const checkUpdates = (): void => {
    void checkForUpdates().then(setNotice).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Update check failed."));
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <section className="flex max-h-[min(700px,calc(100vh-32px))] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1c24] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            {view !== "help" && <Button aria-label="Back to Help" onClick={() => open("help")} size="sm" variant="ghost"><ChevronLeft size={16} /></Button>}
            <h2 className="text-base font-semibold text-white">{view === "help" ? "Help" : view === "about" ? "About CapaMotion" : view === "models" ? "AI Models" : "Keyboard Shortcuts"}</h2>
          </div>
          <Button aria-label="Close release center" onClick={close} size="sm" variant="ghost"><X size={16} /></Button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5">
          {notice && <button className="mb-4 w-full rounded border border-violet-400/20 bg-violet-400/5 px-3 py-2 text-left text-xs text-violet-100" onClick={() => setNotice(null)} type="button">{notice}</button>}
          {view === "help" && <HelpContent checkUpdates={checkUpdates} open={open} setNotice={setNotice} />}
          {view === "about" && <AboutContent />}
          {view === "shortcuts" && <ShortcutsContent />}
          {view === "models" && (
            <ModelsContent
              modelAction={modelAction}
              modelProgress={modelProgress}
              refreshRuntime={refreshRuntime}
              runtime={runtime}
              runtimeAction={runtimeAction}
              runtimeMessage={runtimeMessage}
              runtimeProgress={runtimeProgress}
              setModelAction={setModelAction}
              setNotice={setNotice}
              setRuntimeAction={setRuntimeAction}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function HelpContent({ checkUpdates, open, setNotice }: { readonly checkUpdates: () => void; readonly open: (view: "help" | "about" | "models" | "shortcuts") => void; readonly setNotice: (notice: string | null) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <HelpButton icon={<BookOpen size={17} />} label="Documentation" onClick={() => window.open("https://github.com", "_blank")} />
      <HelpButton icon={<Keyboard size={17} />} label="Keyboard Shortcuts" onClick={() => open("shortcuts")} />
      <HelpButton icon={<Cpu size={17} />} label="AI Models" onClick={() => open("models")} />
      <HelpButton icon={<RefreshCw size={17} />} label="Check for Updates" onClick={checkUpdates} />
      <HelpButton icon={<FolderOpen size={17} />} label="Open Log Folder" onClick={() => { void openLogFolder().catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Unable to open log folder.")); }} />
      <HelpButton icon={<Info size={17} />} label="About" onClick={() => open("about")} />
      <HelpButton icon={<Bug size={17} />} label="Report Issue" onClick={() => window.open("https://github.com/issues", "_blank")} />
    </div>
  );
}

function ModelsContent({
  modelAction,
  modelProgress,
  refreshRuntime,
  runtime,
  runtimeAction,
  runtimeMessage,
  runtimeProgress,
  setModelAction,
  setNotice,
  setRuntimeAction
}: {
  readonly modelAction: "idle" | "downloading" | "ready" | "failed";
  readonly modelProgress: number;
  readonly refreshRuntime: () => void;
  readonly runtime: RuntimeStatus | null;
  readonly runtimeAction: "idle" | "downloading" | "ready" | "failed";
  readonly runtimeMessage: string;
  readonly runtimeProgress: number;
  readonly setModelAction: (action: "idle" | "downloading" | "ready" | "failed", progress: number) => void;
  readonly setNotice: (notice: string | null) => void;
  readonly setRuntimeAction: (action: "idle" | "downloading" | "ready" | "failed", progress: number, message?: string) => void;
}) {
  const runtimeReadyViaSystem = runtime?.aiRuntimeReady && runtime.aiRuntimeMode === "system-python";
  const canDownloadRuntime = Boolean(runtime?.aiRuntimeDownloadConfigured);

  const installRuntime = (): void => {
    setRuntimeAction("downloading", 1, "Preparing AI runtime download...");
    void downloadAiRuntime().then((path) => {
      setRuntimeAction("ready", 100, "AI runtime is ready.");
      setNotice(`AI runtime installed: ${path}`);
      refreshRuntime();
    }).catch((error: unknown) => {
      setRuntimeAction("failed", 0, "AI runtime download failed.");
      setNotice(error instanceof Error ? error.message : "AI runtime download failed.");
    });
  };

  const installModel = (): void => {
    setModelAction("downloading", 5);
    const timer = window.setInterval(() => {
      const current = useReleaseStore.getState().modelProgress;
      setModelAction("downloading", Math.min(92, current + 3));
    }, 250);
    void downloadAiModel().then((path) => {
      window.clearInterval(timer);
      setModelAction("ready", 100);
      setNotice(`AI model installed: ${path}`);
      refreshRuntime();
    }).catch((error: unknown) => {
      window.clearInterval(timer);
      setModelAction("failed", 0);
      setNotice(error instanceof Error ? error.message : "Model download failed.");
    });
  };

  const removeRuntime = (): void => {
    void removeAiRuntime().then(() => {
      setRuntimeAction("idle", 0);
      refreshRuntime();
    }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "AI runtime removal failed."));
  };

  const removeModel = (): void => {
    void removePlaceholderModel().then(() => {
      setModelAction("idle", 0);
      refreshRuntime();
    }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Model removal failed."));
  };

  return (
    <div>
      <p className="text-sm text-slate-400">Install the local pieces needed for Video to Animation. The AI menu appears only after both the runtime and pose model are ready.</p>
      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-white/10 bg-black/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-slate-100">CapaMotion AI Runtime</p>
              <p className="mt-1 text-xs text-slate-500">Includes the Python service package plus FFmpeg/FFprobe for users without developer tools.</p>
              <p className="mt-2 text-xs text-slate-400">Status: {runtime?.aiRuntimeReady ? `Ready (${runtime.aiRuntimeMode})` : "Runtime Required"}</p>
              {runtime?.aiRuntimePath && <p className="mt-1 break-all text-[11px] text-slate-600">{runtime.aiRuntimePath}</p>}
            </div>
            {runtime?.aiRuntime ? (
              <Button onClick={removeRuntime} size="sm" variant="ghost">Remove</Button>
            ) : runtimeReadyViaSystem ? (
              <Button disabled size="sm" variant="ghost">Ready</Button>
            ) : (
              <Button disabled={runtimeAction === "downloading" || !canDownloadRuntime} onClick={installRuntime} size="sm">
                {runtimeAction === "downloading" && <LoaderCircle className="animate-spin" size={14} />}
                {runtimeAction === "failed" ? "Retry" : canDownloadRuntime ? "Download Runtime" : "URL Missing"}
              </Button>
            )}
          </div>
          {runtimeAction === "downloading" && <ProgressBar label={runtimeMessage} progress={runtimeProgress} />}
          {runtimeReadyViaSystem && <p className="mt-3 rounded border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">Development fallback is ready through system Python and FFmpeg.</p>}
          {runtime && !runtime.aiRuntimeReady && <p className="mt-3 text-xs text-slate-500">{runtime.aiRuntimeDownloadConfigured ? `Download URL: ${runtime.aiRuntimeDownloadUrl}` : "Runtime download is not configured in this build. Publish the runtime zip and rebuild with CAPAMOTION_AI_RUNTIME_URL."}</p>}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-slate-100">MediaPipe Pose Landmarker</p>
              <p className="mt-1 text-xs text-slate-500">Required pose model for local video-to-motion detection.</p>
              <p className="mt-2 text-xs text-slate-400">Status: {runtime?.aiModel ? "Ready" : "Model Required"}</p>
              {runtime?.aiModelPath && <p className="mt-1 break-all text-[11px] text-slate-600">{runtime.aiModelPath}</p>}
            </div>
            {runtime?.aiModel ? <Button onClick={removeModel} size="sm" variant="ghost">Remove</Button> : <Button disabled={modelAction === "downloading"} onClick={installModel} size="sm">{modelAction === "downloading" && <LoaderCircle className="animate-spin" size={14} />}{modelAction === "failed" ? "Retry" : "Download Model"}</Button>}
          </div>
          {modelAction === "downloading" && <ProgressBar label="Downloading model" progress={modelProgress} />}
        </div>

        {runtime?.aiModel && runtime.aiRuntimeReady && <p className="rounded border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">Video to Animation is ready. Close this panel and use the AI button in the toolbar.</p>}
      </div>
    </div>
  );
}

function ShortcutsContent() {
  return <div className="space-y-2">{shortcuts.map(([keys, label]) => <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/10 px-3 py-2.5 text-sm" key={keys}><span className="text-slate-300">{label}</span><kbd className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-violet-200">{keys}</kbd></div>)}</div>;
}

function HelpButton({ icon, label, onClick }: { readonly icon: ReactNode; readonly label: string; readonly onClick: () => void }) {
  return <button className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3 text-left text-sm text-slate-300 hover:border-violet-400/40 hover:bg-violet-400/5" onClick={onClick} type="button">{icon}{label}</button>;
}

function ProgressBar({ label, progress }: { readonly label: string; readonly progress: number }) {
  return <div className="mt-4"><div className="h-1.5 overflow-hidden rounded bg-white/10"><div className="h-full bg-violet-400" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-xs text-slate-500">{label} {progress}%</p></div>;
}

function AboutContent() {
  const runtime = useReleaseStore((state) => state.runtime);
  const setNotice = useReleaseStore((state) => state.setNotice);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    void getReleaseInfo().then(setRelease).catch(() => setRelease(null));
  }, []);

  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-500 text-xl font-bold text-white">CM</div>
      <h3 className="mt-4 text-lg font-semibold text-white">Capa Motion Studio</h3>
      <p className="mt-1 text-sm text-slate-400">Version {release?.version ?? appVersion}</p>
      <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">Build</dt><dd className="text-slate-300">{release?.buildDate ?? `Release ${appVersion}`}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">License</dt><dd className="text-slate-300">{release?.license ?? "MIT"}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Data mode</dt><dd className="text-slate-300">{runtime?.portableMode ? "Portable" : "AppData"}</dd></div>
      </dl>
      <p className="mt-6 text-xs text-slate-500">Copyright 2026 CapaMotion. Local-first software.</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={() => window.open("https://github.com", "_blank")} size="sm" variant="secondary"><ExternalLink size={13} />GitHub</Button>
        <Button onClick={() => setNotice("Documentation is available from Help.")} size="sm" variant="ghost">Documentation</Button>
      </div>
    </div>
  );
}
