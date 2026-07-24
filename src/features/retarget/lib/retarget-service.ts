import { retargetMotion } from "@/features/retarget/lib/retarget-engine";
import { useAiStore } from "@/stores/ai-store";
import { useMotionStore } from "@/stores/motion-store";
import { usePoseStore } from "@/stores/pose-store";
import { useProjectStore } from "@/stores/project-store";
import { useRetargetStore } from "@/stores/retarget-store";
import type { RigType } from "@/types/project";

function pause(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

export async function createRetargetedDraft(rigType: RigType): Promise<void> {
  const source = useAiStore.getState().result?.motionData;
  if (!source?.reconstruction.length) {
    useRetargetStore.getState().fail("Run the local AI pipeline before retargeting.");
    return;
  }
  const projectRig = useProjectStore.getState().activeProject?.rigType;
  if (!projectRig || projectRig !== rigType) {
    useRetargetStore.getState().fail(`Target rig must match the active Roblox ${projectRig ?? "project"} metadata.`);
    return;
  }
  const store = useRetargetStore.getState();
  try {
    store.updateProgress("retargeting", 20, `Retargeting source joints to Roblox ${rigType}`);
    await pause();
    const result = retargetMotion(source, rigType, store.cleanupSettings);
    useRetargetStore.getState().updateProgress("cleanup", 70, "Applying rotation smoothing, jitter reduction, and keyframe reduction");
    await pause();
    useRetargetStore.getState().updateProgress("building_timeline", 90, "Building editable timeline keyframes");
    useMotionStore.getState().replaceMotion(result.motionData, 0);
    usePoseStore.getState().replacePoses(result.poses, 0);
    useRetargetStore.getState().complete(result);
  } catch (error) {
    useRetargetStore.getState().fail(error instanceof Error ? error.message : "Retargeting failed.");
  }
}
