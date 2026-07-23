import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/stores/project-store";
import type { RigType } from "@/types/project";

export function NewProjectDialog() {
  const isOpen = useProjectStore((state) => state.isNewProjectDialogOpen);
  const setOpen = useProjectStore((state) => state.setNewProjectDialogOpen);
  const createProject = useProjectStore((state) => state.createProject);
  const [name, setName] = useState("");
  const [rigType, setRigType] = useState<RigType>("R15");

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!name.trim()) return;
    createProject({ name, rigType });
    setName("");
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm" role="presentation">
      <form aria-modal="true" aria-labelledby="new-project-title" className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1c24] p-6 shadow-2xl" onSubmit={handleSubmit} role="dialog">
        <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-white" id="new-project-title">Create project</h2><p className="mt-1 text-sm text-slate-400">Start a new Roblox animation workspace.</p></div><Button aria-label="Close dialog" onClick={() => setOpen(false)} size="sm" type="button" variant="ghost"><X size={16} /></Button></div>
        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="project-name">Project name</label>
        <input autoFocus className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#111218] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400" id="project-name" onChange={(event) => setName(event.target.value)} placeholder="e.g. Sword Combo" value={name} />
        <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-200">Target Roblox rig</legend><div className="mt-2 grid grid-cols-2 gap-3">{(["R6", "R15"] as const).map((rig) => <button className={`rounded-lg border p-3 text-left transition-colors ${rigType === rig ? "border-violet-400 bg-violet-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`} key={rig} onClick={() => setRigType(rig)} type="button"><span className="block text-sm font-semibold text-white">Roblox {rig}</span><span className="mt-1 block text-xs text-slate-400">{rig === "R6" ? "Classic 6-part character" : "15-part articulated character"}</span></button>)}</div></fieldset>
        <div className="mt-6 flex justify-end gap-2"><Button onClick={() => setOpen(false)} type="button" variant="ghost">Cancel</Button><Button disabled={!name.trim()} type="submit">Create project</Button></div>
      </form>
    </div>
  );
}
