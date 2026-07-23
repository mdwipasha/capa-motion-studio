import { useState } from "react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/stores/settings-store";

interface SettingsDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const autosaveEnabled = useSettingsStore((state) => state.autosaveEnabled);
  const defaultFps = useSettingsStore((state) => state.defaultFps);
  const viewportBackgroundColor = useSettingsStore((state) => state.viewportBackgroundColor);
  const setAutosaveEnabled = useSettingsStore((state) => state.setAutosaveEnabled);
  const setDefaultFps = useSettingsStore((state) => state.setDefaultFps);
  const setViewportBackgroundColor = useSettingsStore((state) => state.setViewportBackgroundColor);
  const [colorInput, setColorInput] = useState(viewportBackgroundColor);
  if (!isOpen) return null;
  const commitColor = (): void => {
    if (/^#[0-9a-f]{6}$/i.test(colorInput)) setViewportBackgroundColor(colorInput);
    else setColorInput(viewportBackgroundColor);
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><section aria-labelledby="settings-title" className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1c24] p-6 shadow-2xl" role="dialog"><div className="flex items-start justify-between"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-white" id="settings-title"><Settings2 size={18} />Settings</h2><p className="mt-1 text-sm text-slate-400">Preferences are stored in each .rma project.</p></div><Button aria-label="Close settings" onClick={onClose} size="sm" variant="ghost"><X size={16} /></Button></div><div className="mt-6 space-y-6"><section><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">General</p><label className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/10 px-3 py-2.5 text-sm text-slate-200"><span><span className="block font-medium">Autosave</span><span className="mt-0.5 block text-xs text-slate-500">Save a local recovery snapshot every 30 seconds.</span></span><input checked={autosaveEnabled} className="h-4 w-4 accent-violet-500" onChange={(event) => setAutosaveEnabled(event.target.checked)} type="checkbox" /></label></section><section><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Editor</p><label className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-300">Default FPS <input className="h-8 w-20 rounded border border-white/10 bg-black/15 px-2 text-right text-sm text-white outline-none focus:border-violet-400" max={60} min={1} onChange={(event) => setDefaultFps(Number(event.target.value))} type="number" value={defaultFps} /></label></section><section><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Viewport</p><label className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">Background color <input className="h-8 w-28 rounded border border-white/10 bg-black/15 px-2 font-mono text-xs text-white outline-none focus:border-violet-400" onBlur={commitColor} onChange={(event) => setColorInput(event.target.value)} value={colorInput} /></label></section></div><div className="mt-7 flex justify-end"><Button onClick={onClose}>Done</Button></div></section></div>;
}
