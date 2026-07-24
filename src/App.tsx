import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { AiMotionDialog } from "@/features/ai/components/AiMotionDialog";
import { RetargetDialog } from "@/features/retarget/components/RetargetDialog";
import { CrashRecoveryDialog } from "@/features/release/components/CrashRecoveryDialog";
import { FirstLaunchWizard } from "@/features/release/components/FirstLaunchWizard";
import { ReleaseCenterDialog } from "@/features/release/components/ReleaseCenterDialog";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import { useLaunchProject } from "@/hooks/useLaunchProject";
import { useUnsavedProjectWarning } from "@/hooks/useUnsavedProjectWarning";
import { StudioShell } from "@/features/editor/components/StudioShell";
import { NewProjectDialog } from "@/features/project/components/NewProjectDialog";
import { WelcomeScreen } from "@/features/project/components/WelcomeScreen";
import { useProjectStore } from "@/stores/project-store";

export function App() {
  const activeProject = useProjectStore((state) => state.activeProject);
  useSessionRecovery();
  useLaunchProject();
  useUnsavedProjectWarning();

  return (
    <ErrorBoundary>
      {activeProject ? <StudioShell /> : <WelcomeScreen />}
      <NewProjectDialog />
      <AiMotionDialog />
      <RetargetDialog />
      <CrashRecoveryDialog />
      <FirstLaunchWizard />
      <ReleaseCenterDialog />
    </ErrorBoundary>
  );
}
