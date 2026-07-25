import type { GeneratedMotionDraft } from "@/types/ai-tools";
import { useMotionStore } from "@/stores/motion-store";
import { usePoseStore } from "@/stores/pose-store";

export function applyGeneratedMotion(draft: GeneratedMotionDraft): string {
  useMotionStore.getState().replaceMotion(draft.motionData, 0);
  usePoseStore.getState().replacePoses(draft.poses, 0);
  return `${draft.name} applied to the timeline.`;
}
