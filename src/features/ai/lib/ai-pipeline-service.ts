import { cancelAiJob, getAiJob, startAiPipeline } from "@/features/ai/lib/ai-client";
import { useAiStore } from "@/stores/ai-store";

const supportedExtensions = [".mp4", ".mov", ".avi"];

export function validateVideoFile(file: File): void {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!supportedExtensions.includes(extension)) throw new Error("Unsupported video format. Use MP4, MOV, or AVI.");
  if (file.size === 0) throw new Error("The selected video file is empty.");
}

export async function runAiPipeline(file: File): Promise<void> {
  validateVideoFile(file);
  const store = useAiStore.getState();
  store.begin(file);
  try {
    const { jobId, metadata } = await startAiPipeline(file);
    useAiStore.getState().setJobId(jobId);
    useAiStore.getState().setMetadata(metadata);
    await pollJob(jobId);
  } catch (error) {
    useAiStore.getState().fail(error instanceof Error ? error.message : "AI pipeline failed.");
  }
}

async function pollJob(jobId: string): Promise<void> {
  while (true) {
    const job = await getAiJob(jobId);
    useAiStore.getState().updateProgress(job.step, job.progress, job.currentFrame, job.message);
    if (!job.isFinished) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 500));
      continue;
    }
    if (job.result) useAiStore.getState().complete(job.result);
    else useAiStore.getState().fail(job.error ?? "AI pipeline did not return a result.", job.step === "cancelled");
    return;
  }
}

export async function cancelActiveAiPipeline(): Promise<void> {
  const jobId = useAiStore.getState().jobId;
  if (!jobId) return;
  await cancelAiJob(jobId);
  useAiStore.getState().updateProgress("cancelled", useAiStore.getState().progress, useAiStore.getState().currentFrame, "Cancellation requested. Cleaning temporary resources.");
}
