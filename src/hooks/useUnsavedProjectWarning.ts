import { useEffect } from "react";
import { useProjectStore } from "@/stores/project-store";

/** Warn before closing a newly created project that has not yet been saved to .rma. */
export function useUnsavedProjectWarning(): void {
  const isUnsaved = useProjectStore((state) => Boolean(state.activeProject && !state.activeProject.filePath));
  useEffect(() => {
    if (!isUnsaved) return;
    const warn = (event: BeforeUnloadEvent): void => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isUnsaved]);
}
