import { useEffect } from "react";
import { applyProjectDocument } from "@/features/project/lib/project-file-service";
import { getLaunchProject } from "@/lib/desktop";
import { parseRmaProject } from "@/lib/rma";

export function useLaunchProject(): void {
  useEffect(() => { void getLaunchProject().then((content) => { if (content) applyProjectDocument(parseRmaProject(content), "Launch project.rma"); }).catch(() => undefined); }, []);
}
