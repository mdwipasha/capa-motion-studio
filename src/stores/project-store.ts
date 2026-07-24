import { create } from "zustand";
import { createProjectMetadata } from "@/lib/project";
import type { CreateProjectInput, ProjectMetadata } from "@/types/project";

interface ProjectState {
  activeProject: ProjectMetadata | null;
  recentProjects: ProjectMetadata[];
  isNewProjectDialogOpen: boolean;
  createProject: (input: CreateProjectInput) => void;
  openProject: (project: ProjectMetadata) => void;
  markProjectSaved: (filePath?: string) => void;
  removeRecentProject: (projectId: string) => void;
  togglePinnedProject: (projectId: string) => void;
  toggleFavoriteProject: (projectId: string) => void;
  resetProject: () => void;
  setNewProjectDialogOpen: (isOpen: boolean) => void;
}

const recentProjectsStorageKey = "capa-motion.recent-projects";

function loadRecentProjects(): ProjectMetadata[] {
  try {
    const value = localStorage.getItem(recentProjectsStorageKey);
    return value ? JSON.parse(value) as ProjectMetadata[] : [];
  } catch {
    return [];
  }
}

function persistRecentProjects(projects: readonly ProjectMetadata[]): void {
  localStorage.setItem(recentProjectsStorageKey, JSON.stringify(projects.slice(0, 10)));
}

function addRecentProject(projects: readonly ProjectMetadata[], project: ProjectMetadata): ProjectMetadata[] {
  const next = [project, ...projects.filter((item) => item.id !== project.id)].slice(0, 10);
  persistRecentProjects(next);
  return next;
}

export const useProjectStore = create<ProjectState>((set) => ({
  activeProject: null,
  recentProjects: loadRecentProjects(),
  isNewProjectDialogOpen: false,
  createProject: (input) => {
    const project = createProjectMetadata(input);
    set({ activeProject: project });
  },
  openProject: (project) => set((state) => {
    const openedProject = { ...project, lastOpenedAt: new Date().toISOString() };
    return { activeProject: openedProject, recentProjects: addRecentProject(state.recentProjects, openedProject) };
  }),
  markProjectSaved: (filePath) => set((state) => {
    if (!state.activeProject) return state;
    const savedProject = { ...state.activeProject, filePath: filePath ?? state.activeProject.filePath, updatedAt: new Date().toISOString(), lastOpenedAt: new Date().toISOString() };
    return { activeProject: savedProject, recentProjects: addRecentProject(state.recentProjects, savedProject) };
  }),
  removeRecentProject: (projectId) => set((state) => {
    const recentProjects = state.recentProjects.filter((project) => project.id !== projectId);
    persistRecentProjects(recentProjects);
    return { recentProjects };
  }),
  togglePinnedProject: (projectId) => set((state) => {
    const recentProjects = state.recentProjects.map((project) => project.id === projectId ? { ...project, isPinned: !project.isPinned } : project).sort((left, right) => Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned)));
    persistRecentProjects(recentProjects);
    return { recentProjects };
  }),
  toggleFavoriteProject: (projectId) => set((state) => {
    const recentProjects = state.recentProjects.map((project) => project.id === projectId ? { ...project, isFavorite: !project.isFavorite } : project);
    persistRecentProjects(recentProjects);
    return { recentProjects };
  }),
  resetProject: () => set({ activeProject: null }),
  setNewProjectDialogOpen: (isOpen) => set({ isNewProjectDialogOpen: isOpen })
}));
