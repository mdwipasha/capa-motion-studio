export const rigTypes = ["R6", "R15"] as const;

export type RigType = (typeof rigTypes)[number];

export interface ProjectMetadata {
  readonly id: string;
  readonly name: string;
  readonly rigType: RigType;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastOpenedAt?: string;
  readonly filePath?: string;
}

export interface CreateProjectInput {
  readonly name: string;
  readonly rigType: RigType;
}
