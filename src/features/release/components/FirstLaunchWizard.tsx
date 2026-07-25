import { useEffect, useState } from "react";
import { Check, FolderOpen, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { checkRuntime } from "@/lib/desktop";
import type { RuntimeStatus } from "@/types/release";

const wizardStorageKey = "capa-motion.first-launch-complete";

export function FirstLaunchWizard() {
  const [open, setOpen] = useState(() => localStorage.getItem(wizardStorageKey) !== "true");
  const [step, setStep] = useState(0);
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);

  useEffect(() => {
    if (open && step === 2) void checkRuntime().then(setRuntime).catch(() => setRuntime(null));
  }, [open, step]);

  if (!open) return null;

  const finish = (): void => {
    localStorage.setItem(wizardStorageKey, "true");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#101116] p-5">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1c24] p-7 shadow-2xl">
        <div className="flex items-center gap-2 text-violet-300">
          <Sparkles size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">First launch</span>
        </div>

        {step === 0 && (
          <div>
            <h1 className="mt-4 text-2xl font-semibold text-white">Welcome to CapaMotion</h1>
            <p className="mt-2 text-sm text-slate-400">A local-first workspace for Roblox motion. This short setup only runs once.</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="mt-4 text-2xl font-semibold text-white">Choose data location</h1>
            <p className="mt-2 text-sm text-slate-400">Installer builds use AppData. Create a <code>portable.flag</code> file next to the executable to keep data in the application folder.</p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 p-3 text-sm text-slate-300">
              <FolderOpen size={16} />
              Workspace and logs stay local.
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="mt-4 text-2xl font-semibold text-white">Runtime check</h1>
            <p className="mt-2 text-sm text-slate-400">AI is optional and loads only when you use it.</p>
            <div className="mt-4 space-y-2 text-sm">
              {runtime ? (
                <>
                  <Status label="AI runtime" ready={runtime.aiRuntimeReady} />
                  <Status label="FFmpeg" ready={runtime.ffmpeg} />
                  <Status label="AI model" ready={runtime.aiModel} />
                </>
              ) : (
                <p className="flex items-center gap-2 text-slate-400">
                  <LoaderCircle className="animate-spin" size={16} />
                  Checking local runtime...
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="mt-4 text-2xl font-semibold text-white">Ready to create motion</h1>
            <p className="mt-2 text-sm text-slate-400">You can install the optional AI runtime and model later from Help - AI Models.</p>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <span className="text-xs text-slate-500">{step + 1} / 4</span>
          <div className="flex gap-2">
            {step > 0 && <Button onClick={() => setStep(step - 1)} variant="ghost">Back</Button>}
            <Button onClick={() => step === 3 ? finish() : setStep(step + 1)}>{step === 3 ? "Finish" : "Continue"}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Status({ label, ready }: { readonly label: string; readonly ready: boolean }) {
  return <p className={ready ? "flex items-center gap-2 text-emerald-300" : "flex items-center gap-2 text-amber-200"}><Check size={15} />{label}: {ready ? "Ready" : "Setup required"}</p>;
}
