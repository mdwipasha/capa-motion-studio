import { useEffect } from "react";
import { cacheProjectDocument, createProjectDocument } from "@/features/project/lib/project-file-service";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";

export function useAutosave(): void {
  const projectId = useProjectStore((state) => state.activeProject?.id);
  const autosaveEnabled = useSettingsStore((state) => state.autosaveEnabled);
  const autosaveIntervalSeconds = useSettingsStore((state) => state.autosaveIntervalSeconds);
  useEffect(() => {
    if (!projectId || !autosaveEnabled) return;
    const interval = window.setInterval(() => {
      const document = createProjectDocument();
      if (document) cacheProjectDocument(document);
    }, autosaveIntervalSeconds * 1000);
    return () => window.clearInterval(interval);
  }, [autosaveEnabled, autosaveIntervalSeconds, projectId]);
}
