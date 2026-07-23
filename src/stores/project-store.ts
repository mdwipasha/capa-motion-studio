import { create } from "zustand";
import { createProjectMetadata } from "@/lib/project";
import type { CreateProjectInput, ProjectMetadata } from "@/types/project";

interface ProjectState {
  activeProject: ProjectMetadata | null;
  recentProjects: ProjectMetadata[];
  isNewProjectDialogOpen: boolean;
  createProject: (input: CreateProjectInput) => void;
  openProject: (project: ProjectMetadata) => void;
  saveProject: () => void;
  setNewProjectDialogOpen: (isOpen: boolean) => void;
}

const mockRecentProjects: ProjectMetadata[] = [
  { id: "demo-r15", name: "Sword Combo", rigType: "R15", createdAt: "2026-07-18T10:00:00.000Z", updatedAt: "2026-07-22T08:30:00.000Z", filePath: "C:/CapaMotion/Sword Combo.rma" },
  { id: "demo-r6", name: "Retro Dance", rigType: "R6", createdAt: "2026-07-16T10:00:00.000Z", updatedAt: "2026-07-20T12:00:00.000Z", filePath: "C:/CapaMotion/Retro Dance.rma" }
];

export const useProjectStore = create<ProjectState>((set) => ({
  activeProject: null,
  recentProjects: mockRecentProjects,
  isNewProjectDialogOpen: false,
  createProject: (input) => {
    const project = createProjectMetadata(input);
    set((state) => ({ activeProject: project, recentProjects: [project, ...state.recentProjects] }));
  },
  openProject: (project) => set((state) => ({ activeProject: project, recentProjects: [project, ...state.recentProjects.filter((item) => item.id !== project.id)] })),
  saveProject: () => set((state) => state.activeProject ? { activeProject: { ...state.activeProject, updatedAt: new Date().toISOString() } } : state),
  setNewProjectDialogOpen: (isOpen) => set({ isNewProjectDialogOpen: isOpen })
}));
