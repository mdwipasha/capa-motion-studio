import { useEffect, useState } from "react";
import { FolderOpen, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { checkRuntime, openLogFolder } from "@/lib/desktop";
import { useSettingsStore } from "@/stores/settings-store";
import type { RuntimeStatus } from "@/types/release";

interface SettingsDialogProps { readonly isOpen: boolean; readonly onClose: () => void; }

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const autosaveEnabled = useSettingsStore((state) => state.autosaveEnabled);
  const defaultFps = useSettingsStore((state) => state.defaultFps);
  const viewportBackgroundColor = useSettingsStore((state) => state.viewportBackgroundColor);
  const language = useSettingsStore((state) => state.language);
  const autoUpdateEnabled = useSettingsStore((state) => state.autoUpdateEnabled);
  const gpuAcceleration = useSettingsStore((state) => state.gpuAcceleration);
  const setAutosaveEnabled = useSettingsStore((state) => state.setAutosaveEnabled);
  const setDefaultFps = useSettingsStore((state) => state.setDefaultFps);
  const setViewportBackgroundColor = useSettingsStore((state) => state.setViewportBackgroundColor);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setAutoUpdateEnabled = useSettingsStore((state) => state.setAutoUpdateEnabled);
  const setGpuAcceleration = useSettingsStore((state) => state.setGpuAcceleration);
  const [colorInput, setColorInput] = useState(viewportBackgroundColor);
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  useEffect(() => { if (isOpen) void checkRuntime().then(setRuntime).catch(() => setRuntime(null)); }, [isOpen]);
  if (!isOpen) return null;
  const commitColor = (): void => { if (/^#[0-9a-f]{6}$/i.test(colorInput)) setViewportBackgroundColor(colorInput); else setColorInput(viewportBackgroundColor); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><section aria-labelledby="settings-title" className="max-h-[calc(100vh-32px)] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#1a1c24] p-6 shadow-2xl" role="dialog"><div className="flex items-start justify-between"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-white" id="settings-title"><Settings2 size={18} />Settings</h2><p className="mt-1 text-sm text-slate-400">Local project and release preferences.</p></div><Button aria-label="Close settings" onClick={onClose} size="sm" variant="ghost"><X size={16} /></Button></div><div className="mt-6 space-y-6"><section><Heading>General</Heading><label className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-300">Language <select className="rounded border border-white/10 bg-black/15 px-2 py-1.5 text-sm text-white" onChange={(event) => setLanguage(event.target.value as "en" | "id")} value={language}><option value="en">English</option><option value="id">Bahasa Indonesia</option></select></label></section><section><Heading>Editor</Heading><Toggle detail="Save a local recovery snapshot every 30 seconds." label="Autosave" onChange={setAutosaveEnabled} value={autosaveEnabled} /><label className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-300">Default FPS <input className="h-8 w-20 rounded border border-white/10 bg-black/15 px-2 text-right text-sm text-white outline-none focus:border-violet-400" max={60} min={1} onChange={(event) => setDefaultFps(Number(event.target.value))} type="number" value={defaultFps} /></label></section><section><Heading>AI</Heading><p className="mt-2 text-xs text-slate-500">Model directory: {runtime?.dataDirectory ? `${runtime.dataDirectory}\\models` : "Available in desktop build"}</p><label className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-300">GPU acceleration <select className="rounded border border-white/10 bg-black/15 px-2 py-1.5 text-sm text-white" onChange={(event) => setGpuAcceleration(event.target.value as "auto" | "off")} value={gpuAcceleration}><option value="auto">Auto (placeholder)</option><option value="off">Off</option></select></label></section><section><Heading>Updates</Heading><Toggle detail="Checks only signed release endpoints configured for production." label="Auto update" onChange={setAutoUpdateEnabled} value={autoUpdateEnabled} /></section><section><Heading>Viewport</Heading><label className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">Background color <input className="h-8 w-28 rounded border border-white/10 bg-black/15 px-2 font-mono text-xs text-white outline-none focus:border-violet-400" onBlur={commitColor} onChange={(event) => setColorInput(event.target.value)} value={colorInput} /></label></section><section><Heading>Advanced</Heading><p className="mt-2 text-xs text-slate-500">Log folder: {runtime?.logDirectory ?? "Available in desktop build"}</p><p className="mt-1 text-xs text-slate-500">Cache folder: {runtime?.dataDirectory ? `${runtime.dataDirectory}\\cache` : "Available in desktop build"}</p><Button className="mt-3" onClick={() => { void openLogFolder(); }} size="sm" variant="secondary"><FolderOpen size={14} />Open Log Folder</Button></section></div><div className="mt-7 flex justify-end"><Button onClick={onClose}>Done</Button></div></section></div>;
}

function Heading({ children }: { readonly children: string }) { return <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</p>; }
function Toggle({ label, detail, value, onChange }: { readonly label: string; readonly detail: string; readonly value: boolean; readonly onChange: (value: boolean) => void }) { return <label className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/10 px-3 py-2.5 text-sm text-slate-200"><span><span className="block font-medium">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{detail}</span></span><input checked={value} className="h-4 w-4 accent-violet-500" onChange={(event) => onChange(event.target.checked)} type="checkbox" /></label>; }
