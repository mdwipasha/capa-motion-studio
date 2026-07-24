import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { AiMotionDialog } from "@/features/ai/components/AiMotionDialog";
import { RetargetDialog } from "@/features/retarget/components/RetargetDialog";
import { StudioShell } from "@/features/editor/components/StudioShell";
import { NewProjectDialog } from "@/features/project/components/NewProjectDialog";
import { WelcomeScreen } from "@/features/project/components/WelcomeScreen";
import { useProjectStore } from "@/stores/project-store";

export function App() {
  const activeProject = useProjectStore((state) => state.activeProject);

  return (
    <ErrorBoundary>
      {activeProject ? <StudioShell /> : <WelcomeScreen />}
      <NewProjectDialog />
      <AiMotionDialog />
      <RetargetDialog />
    </ErrorBoundary>
  );
}
