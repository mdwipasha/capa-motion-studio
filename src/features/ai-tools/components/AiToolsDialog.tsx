import { useMemo, useState } from "react";
import { BookMarked, FileVideo, Infinity, Library, LoaderCircle, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { applyGeneratedMotion } from "@/features/ai-tools/lib/apply-ai-tool-motion";
import { createAutoLoopDraft, generateTextMotion, motionPresets } from "@/features/ai-tools/lib/motion-presets";
import { useMotionStore } from "@/stores/motion-store";
import { usePoseStore } from "@/stores/pose-store";
import { useProjectStore } from "@/stores/project-store";
import { useAiStore } from "@/stores/ai-store";
import { useAiToolsStore } from "@/stores/ai-tools-store";
import type { AiToolTab, MotionPresetCategory } from "@/types/ai-tools";

const tabs: readonly { readonly id: AiToolTab; readonly label: string; readonly icon: typeof Wand2 }[] = [
  { id: "video", label: "Video", icon: FileVideo },
  { id: "text", label: "Text", icon: Wand2 },
  { id: "library", label: "Library", icon: Library },
  { id: "loop", label: "Loop", icon: Infinity },
  { id: "templates", label: "Templates", icon: BookMarked }
];

const categories: readonly MotionPresetCategory[] = ["locomotion", "action", "emote", "utility"];

export function AiToolsDialog() {
  const isOpen = useAiToolsStore((state) => state.isOpen);
  const activeTab = useAiToolsStore((state) => state.activeTab);
  const setTab = useAiToolsStore((state) => state.setTab);
  const close = useAiToolsStore((state) => state.close);
  const setAiPanelOpen = useAiStore((state) => state.setPanelOpen);
  const project = useProjectStore((state) => state.activeProject);
  const motion = useMotionStore((state) => state.motionData);
  const poses = usePoseStore((state) => state.poses);
  const [prompt, setPrompt] = useState("friendly wave");
  const [category, setCategory] = useState<MotionPresetCategory | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [isGenerating, setGenerating] = useState(false);

  const filteredPresets = useMemo(() => category === "all" ? motionPresets : motionPresets.filter((preset) => preset.category === category), [category]);
  if (!isOpen) return null;

  const rigType = project?.rigType ?? "R15";
  const fps = motion.timeline.fps;

  const applyDraft = (task: () => string): void => {
    try {
      setNotice(task());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to apply motion.");
    }
  };

  const runTextToMotion = (): void => {
    setGenerating(true);
    window.setTimeout(() => {
      applyDraft(() => applyGeneratedMotion(generateTextMotion(prompt, rigType, fps)));
      setGenerating(false);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <section className="flex max-h-[min(720px,calc(100vh-32px))] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#171820] shadow-2xl" role="dialog">
        <header className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Sparkles size={18} className="text-violet-300" />AI Tools</h2>
            <p className="mt-1 text-sm text-slate-400">Generate editable draft motion for the active Roblox rig.</p>
          </div>
          <Button aria-label="Close AI tools" onClick={close} size="sm" variant="ghost"><X size={16} /></Button>
        </header>

        <div className="flex border-b border-white/10 bg-black/10 px-4 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return <button className={`mr-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs ${activeTab === tab.id ? "bg-violet-400/20 text-violet-100" : "text-slate-400 hover:bg-white/5 hover:text-white"}`} key={tab.id} onClick={() => setTab(tab.id)} type="button"><Icon size={14} />{tab.label}</button>;
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {notice && <button className="mb-4 w-full rounded border border-violet-400/20 bg-violet-400/5 px-3 py-2 text-left text-xs text-violet-100" onClick={() => setNotice(null)} type="button">{notice}</button>}

          {activeTab === "video" && (
            <section className="rounded-lg border border-white/10 bg-black/10 p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="font-medium text-slate-100">Video to Animation</p>
                  <p className="mt-2 text-sm text-slate-400">Open the local AI Motion Pipeline for MP4, MOV, and AVI input. The runtime sidecar starts automatically when the pipeline runs.</p>
                </div>
                <Button onClick={() => { close(); setAiPanelOpen(true); }}><FileVideo size={15} />Open</Button>
              </div>
            </section>
          )}

          {activeTab === "text" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <section className="rounded-lg border border-white/10 bg-black/10 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="text-motion-prompt">Prompt</label>
                <textarea className="mt-3 min-h-36 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-slate-100 outline-none focus:border-violet-400" id="text-motion-prompt" onChange={(event) => setPrompt(event.target.value)} placeholder="wave, idle, jump, run..." value={prompt} />
                <div className="mt-4 flex justify-end">
                  <Button disabled={isGenerating || !project} onClick={runTextToMotion}>{isGenerating && <LoaderCircle className="animate-spin" size={15} />}Generate Draft</Button>
                </div>
              </section>
              <aside className="rounded-lg border border-white/10 bg-black/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recognized prompts</p>
                <div className="mt-3 flex flex-wrap gap-2">{motionPresets.flatMap((preset) => preset.promptTags.slice(0, 2)).map((tag) => <button className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300" key={tag} onClick={() => setPrompt(tag)} type="button">{tag}</button>)}</div>
                <p className="mt-4 text-xs text-slate-500">Output is normal editor keyframes and pose data, so you can edit every generated bone transform.</p>
              </aside>
            </div>
          )}

          {activeTab === "library" && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <FilterButton active={category === "all"} label="All" onClick={() => setCategory("all")} />
                {categories.map((item) => <FilterButton active={category === item} key={item} label={item} onClick={() => setCategory(item)} />)}
              </div>
              <PresetGrid onApply={(presetId) => {
                const preset = motionPresets.find((item) => item.id === presetId);
                if (preset) applyDraft(() => applyGeneratedMotion(preset.build(rigType, fps)));
              }} presets={filteredPresets} />
            </div>
          )}

          {activeTab === "loop" && (
            <section className="rounded-lg border border-white/10 bg-black/10 p-5">
              <p className="text-sm text-slate-300">Create a loop by adding a final pose that matches the first pose. This keeps the result editable and avoids adding a separate curve system.</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <Info label="Current Poses" value={poses.length.toString()} />
                <Info label="FPS" value={fps.toString()} />
                <Info label="Duration" value={`${motion.timeline.duration}s`} />
              </dl>
              <Button className="mt-5" disabled={poses.length === 0} onClick={() => applyDraft(() => applyGeneratedMotion(createAutoLoopDraft(poses, fps, motion.timeline.duration)))}><Infinity size={15} />Create Loop</Button>
            </section>
          )}

          {activeTab === "templates" && (
            <PresetGrid onApply={(presetId) => {
              const preset = motionPresets.find((item) => item.id === presetId);
              if (preset) applyDraft(() => applyGeneratedMotion(preset.build(rigType, fps)));
            }} presets={motionPresets} />
          )}
        </div>
      </section>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { readonly active: boolean; readonly label: string; readonly onClick: () => void }) {
  return <button className={`rounded-md border px-3 py-1.5 text-xs capitalize ${active ? "border-violet-300 bg-violet-300/15 text-violet-100" : "border-white/10 text-slate-400 hover:border-white/20"}`} onClick={onClick} type="button">{label}</button>;
}

function PresetGrid({ onApply, presets }: { readonly onApply: (presetId: string) => void; readonly presets: readonly typeof motionPresets[number][] }) {
  return <div className="grid gap-3 sm:grid-cols-2">{presets.map((preset) => <article className="rounded-lg border border-white/10 bg-black/10 p-4" key={preset.id}><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-100">{preset.name}</p><p className="mt-1 text-xs capitalize text-violet-200">{preset.category} - {preset.duration}s</p></div><Button onClick={() => onApply(preset.id)} size="sm">Apply</Button></div><p className="mt-3 text-sm text-slate-400">{preset.description}</p><div className="mt-3 flex flex-wrap gap-1">{preset.promptTags.map((tag) => <span className="rounded bg-white/5 px-2 py-1 text-[11px] text-slate-500" key={tag}>{tag}</span>)}</div></article>)}</div>;
}

function Info({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-100">{value}</dd></div>;
}
