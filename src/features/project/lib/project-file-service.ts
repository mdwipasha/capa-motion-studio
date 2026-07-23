import { exporters } from "@/features/project/exporters";
import { getImporter } from "@/features/project/importers";
import { chooseFile, toRmaFileName } from "@/lib/file-transfer";
import { appVersion, parseRmaProject, toMotionData } from "@/lib/rma";
import { useCameraStore } from "@/stores/camera-store";
import { useMotionStore } from "@/stores/motion-store";
import { usePoseStore } from "@/stores/pose-store";
import { usePreviewStore } from "@/stores/preview-store";
import { useProjectStore } from "@/stores/project-store";
import { useRigStore } from "@/stores/rig-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { rmaFormatVersion, type RmaProjectFile } from "@/types/rma";

const snapshotStoragePrefix = "capa-motion.project.";

function snapshotKey(projectId: string): string {
  return `${snapshotStoragePrefix}${projectId}`;
}

export function createProjectDocument(): RmaProjectFile | null {
  const project = useProjectStore.getState().activeProject;
  if (!project) return null;
  const motion = useMotionStore.getState();
  const poses = usePoseStore.getState();
  const camera = useCameraStore.getState();
  const settings = useSettingsStore.getState();
  const workspace = useWorkspaceStore.getState();
  const preview = usePreviewStore.getState();
  const rig = useRigStore.getState();
  return {
    format: "capa-motion-rma",
    version: rmaFormatVersion,
    project: { ...project, updatedAt: new Date().toISOString() },
    rig: { type: project.rigType, selectedBoneId: rig.selectedBoneId },
    timeline: { fps: motion.motionData.timeline.fps, duration: motion.motionData.timeline.duration, currentFrame: motion.currentFrame },
    motion: { keyframes: motion.motionData.timeline.keyframes, boneRotations: poses.poses },
    settings: {
      camera: camera.view,
      editor: { autosaveEnabled: settings.autosaveEnabled, autosaveIntervalSeconds: settings.autosaveIntervalSeconds, defaultFps: settings.defaultFps, isBottomPanelOpen: workspace.isBottomPanelOpen },
      viewport: { backgroundColor: settings.viewportBackgroundColor, isGridVisible: preview.isGridVisible }
    },
    metadata: { appVersion }
  };
}

export function cacheProjectDocument(document: RmaProjectFile): void {
  localStorage.setItem(snapshotKey(document.project.id), JSON.stringify(document));
}

export function applyProjectDocument(document: RmaProjectFile, sourceName?: string): void {
  const project = { ...document.project, filePath: sourceName ?? document.project.filePath, lastOpenedAt: new Date().toISOString() };
  useMotionStore.getState().replaceMotion(toMotionData(document), document.timeline.currentFrame);
  usePoseStore.getState().replacePoses(document.motion.boneRotations, document.timeline.currentFrame);
  useCameraStore.getState().setView(document.settings.camera);
  useSettingsStore.getState().hydrateSettings({
    autosaveEnabled: document.settings.editor.autosaveEnabled,
    autosaveIntervalSeconds: document.settings.editor.autosaveIntervalSeconds,
    defaultFps: document.settings.editor.defaultFps,
    viewportBackgroundColor: document.settings.viewport.backgroundColor
  });
  useWorkspaceStore.getState().setBottomPanelOpen(document.settings.editor.isBottomPanelOpen);
  usePreviewStore.getState().setGridVisible(document.settings.viewport.isGridVisible);
  useRigStore.getState().loadRig(document.rig.type);
  useRigStore.getState().selectBone(document.rig.selectedBoneId);
  useProjectStore.getState().openProject(project);
  cacheProjectDocument({ ...document, project });
}

export async function saveActiveProject(saveAs = false): Promise<string> {
  const document = createProjectDocument();
  if (!document) throw new Error("Create or open a project before saving.");
  const fileName = saveAs || !document.project.filePath ? toRmaFileName(document.project.name) : document.project.filePath;
  const result = await exporters.rma.export(document, fileName);
  if (!result.ok) throw new Error(result.message);
  useProjectStore.getState().markProjectSaved(fileName);
  const savedDocument = createProjectDocument();
  if (savedDocument) cacheProjectDocument(savedDocument);
  return result.message;
}

export async function openProjectFile(): Promise<string | null> {
  const file = await chooseFile(".rma,application/json");
  if (!file) return null;
  const importer = getImporter(file);
  if (!importer) throw new Error("Unsupported project file. Choose a .rma file.");
  const result = await importer.import(file);
  if (!result.ok || !result.document) throw new Error(result.message);
  applyProjectDocument(result.document as RmaProjectFile, file.name);
  return result.message;
}

export function openCachedRecentProject(projectId: string): string {
  const content = localStorage.getItem(snapshotKey(projectId));
  if (!content) throw new Error("The local snapshot for this recent project is unavailable. Use Open to select its .rma file again.");
  const document = parseRmaProject(content);
  applyProjectDocument(document, document.project.filePath);
  return `Opened ${document.project.name}.`;
}

export async function importFile(): Promise<string | null> {
  const file = await chooseFile(".rma,.fbx,application/json");
  if (!file) return null;
  const importer = getImporter(file);
  if (!importer) throw new Error("Unsupported import format. Supported entries: .rma and .fbx.");
  const result = await importer.import(file);
  if (!result.ok) throw new Error(result.message);
  if (importer.id === "rma" && result.document) applyProjectDocument(result.document as RmaProjectFile, file.name);
  return result.message;
}

export async function exportFbx(): Promise<string> {
  const result = await exporters.fbx.export(undefined, "motion.fbx");
  if (!result.ok) throw new Error(result.message);
  return result.message;
}
