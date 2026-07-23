import type { AiJobStatus, VideoMetadata } from "@/types/ai";

const aiServiceUrl = "http://127.0.0.1:8765";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${aiServiceUrl}${path}`, init);
  } catch {
    throw new Error("Local AI service is unavailable. Start it with: python python/server.py");
  }
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Local AI service returned an error.");
  return payload;
}

export async function startAiPipeline(file: File): Promise<{ readonly jobId: string; readonly metadata: VideoMetadata }> {
  return request<{ readonly jobId: string; readonly metadata: VideoMetadata }>("/api/pipeline/run", { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream", "X-File-Name": file.name }, body: file });
}

export function getAiJob(jobId: string): Promise<AiJobStatus> {
  return request<AiJobStatus>(`/api/jobs/${jobId}`);
}

export async function cancelAiJob(jobId: string): Promise<void> {
  await request<{ readonly message: string }>(`/api/jobs/${jobId}/cancel`, { method: "POST" });
}
