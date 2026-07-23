import { Canvas } from "@react-three/fiber";
import { Rotate3D } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ViewportScene } from "@/features/preview/components/ViewportScene";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCameraStore } from "@/stores/camera-store";
import { usePreviewStore } from "@/stores/preview-store";
import { useSettingsStore } from "@/stores/settings-store";

/**
 * Isolated React Three Fiber boundary. Rig loading can replace RigPlaceholder
 * without coupling the surrounding editor UI to the renderer.
 */
export function PreviewViewport() {
  const isGridVisible = usePreviewStore((state) => state.isGridVisible);
  const requestCameraReset = useCameraStore((state) => state.requestReset);
  const project = useActiveProject();
  const backgroundColor = useSettingsStore((state) => state.viewportBackgroundColor);

  return <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor }}><Canvas camera={{ fov: 45, position: [7, 5, 9] }} dpr={[1, 2]} frameloop="demand" gl={{ antialias: true, powerPreference: "high-performance" }} shadows><color args={[backgroundColor]} attach="background" /><ViewportScene isGridVisible={isGridVisible} rigType={project.rigType} /></Canvas><div className="absolute left-3 top-3 rounded-md border border-white/10 bg-[#15161d]/90 px-2.5 py-1.5 text-xs text-slate-400 backdrop-blur"><span className="text-slate-500">Preview</span><span className="mx-1.5 text-white/20">/</span>Roblox {project.rigType}</div><Button className="absolute bottom-3 right-3 bg-[#15161d]/90" onClick={requestCameraReset} size="sm" variant="secondary"><Rotate3D size={14} />Reset Camera</Button></div>;
}
