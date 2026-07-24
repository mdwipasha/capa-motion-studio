import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { openCachedRecentProject } from "@/features/project/lib/project-file-service";
import { useProjectStore } from "@/stores/project-store";

const activeSessionKey = "capa-motion.session-active";

export function CrashRecoveryDialog() {
  const [open, setOpen] = useState(() => localStorage.getItem(activeSessionKey) === "true");
  const recentProjects = useProjectStore((state) => state.recentProjects);
  if (!open || recentProjects.length === 0) return null;
  const dismiss = (): void => { localStorage.removeItem(activeSessionKey); setOpen(false); };
  const restore = (): void => { try { openCachedRecentProject(recentProjects[0].id); } finally { dismiss(); } };
  return <div className="fixed inset-0 z-[75] grid place-items-center bg-black/65 p-4"><section className="w-full max-w-md rounded-xl border border-amber-400/20 bg-[#1a1c24] p-6 shadow-2xl"><AlertTriangle className="text-amber-300" size={22} /><h2 className="mt-3 text-lg font-semibold text-white">Recovered session found</h2><p className="mt-2 text-sm text-slate-400">CapaMotion may not have closed normally. Restore the latest local project snapshot?</p><div className="mt-6 flex justify-end gap-2"><Button onClick={dismiss} variant="ghost">No</Button><Button onClick={restore}>Restore Project</Button></div></section></div>;
}
