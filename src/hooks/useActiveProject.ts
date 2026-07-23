import { useProjectStore } from "@/stores/project-store";
import type { ProjectMetadata } from "@/types/project";

/** The workspace is rendered only for an active project. */
export function useActiveProject(): ProjectMetadata {
  const project = useProjectStore((state) => state.activeProject);
  if (!project) throw new Error("An active project is required in the workspace.");
  return project;
}
