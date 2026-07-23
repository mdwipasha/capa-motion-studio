import type { CreateProjectInput, ProjectMetadata } from "@/types/project";

export function createProjectMetadata(input: CreateProjectInput): ProjectMetadata {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    rigType: input.rigType,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
