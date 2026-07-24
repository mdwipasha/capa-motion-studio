import { useState } from "react";
import { Check, LoaderCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createRetargetedDraft } from "@/features/retarget/lib/retarget-service";
import { useProjectStore } from "@/stores/project-store";
import { useRetargetStore } from "@/stores/retarget-store";
import type { RetargetQuality } from "@/types/retarget";
import type { RigType } from "@/types/project";

const qualityDescriptions: Record<RetargetQuality, string> = { fast: "Fewer sampled frames, light cleanup", balanced: "Balanced sampling and smoothing", high: "Every frame with stronger smoothing" };

export function RetargetDialog() {
  const isOpen = useRetargetStore((state) => state.isPanelOpen);
  const setPanelOpen = useRetargetStore((state) => state.setPanelOpen);
  const quality = useRetargetStore((state) => state.quality);
  const setQuality = useRetargetStore((state) => state.setQuality);
  const step = useRetargetStore((state) => state.step);
  const progress = useRetargetStore((state) => state.progress);
  const message = useRetargetStore((state) => state.message);
  const error = useRetargetStore((state) => state.error);
  const result = useRetargetStore((state) => state.result);
  const projectRig = useProjectStore((state) => state.activeProject?.rigType ?? "R15");
  const [rigType, setRigType] = useState<RigType>(projectRig);
  if (!isOpen) return null;
  const isRunning = step === "retargeting" || step === "cleanup" || step === "building_timeline";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><section aria-labelledby="retarget-title" className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1a1c24] p-6 shadow-2xl" role="dialog"><div className="flex items-start justify-between"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-white" id="retarget-title"><Sparkles size={18} className="text-violet-300" />Create Draft Animation</h2><p className="mt-1 text-sm text-slate-400">Retarget local AI Motion Data into editable Roblox poses.</p></div><Button aria-label="Close retargeting panel" onClick={() => setPanelOpen(false)} size="sm" variant="ghost"><X size={16} /></Button></div><section className="mt-6"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Rig</p><p className="mt-1 text-xs text-slate-500">The target follows active project metadata to keep the project, preview, and FBX skeleton aligned.</p><div className="mt-2 grid grid-cols-2 gap-2">{(["R6", "R15"] as const).map((rig) => <button className={`rounded-lg border p-3 text-left text-sm ${rigType === rig ? "border-violet-400 bg-violet-400/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"}`} key={rig} onClick={() => setRigType(rig)} type="button">Roblox {rig}</button>)}</div></section><section className="mt-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cleanup Quality</p><div className="mt-2 space-y-2">{(["fast", "balanced", "high"] as const).map((item) => <button className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left ${quality === item ? "border-violet-400 bg-violet-400/10" : "border-white/10 hover:border-white/20"}`} key={item} onClick={() => setQuality(item)} type="button"><span><span className="block text-sm font-medium text-slate-200">{item === "high" ? "High Quality" : item[0].toUpperCase() + item.slice(1)}</span><span className="mt-0.5 block text-xs text-slate-500">{qualityDescriptions[item]}</span></span>{quality === item && <Check size={16} className="text-violet-300" />}</button>)}</div></section><div className="mt-5 rounded-lg border border-white/10 bg-black/10 p-3"><div className="flex justify-between text-xs"><span className="text-slate-300">{message}</span><span className="text-violet-300">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10"><div className="h-full bg-violet-400 transition-[width]" style={{ width: `${progress}%` }} /></div>{error && <p className="mt-2 text-xs text-rose-200">{error}</p>}{result && <p className="mt-2 text-xs text-emerald-300">Draft applied to timeline. Keyframes remain fully editable.</p>}</div><div className="mt-6 flex justify-end gap-2"><Button onClick={() => setPanelOpen(false)} variant="ghost">Close</Button><Button disabled={isRunning} onClick={() => { void createRetargetedDraft(rigType); }}>{isRunning && <LoaderCircle className="animate-spin" size={15} />}{result ? "Rebuild Draft" : "Create Draft"}</Button></div></section></div>;
}
