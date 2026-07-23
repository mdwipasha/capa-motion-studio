import { Canvas } from "@react-three/fiber";
import { Box } from "lucide-react";
import { usePreviewStore } from "@/stores/preview-store";

/**
 * Stable integration boundary for the future Three.js editor scene.
 * The canvas intentionally contains no model or animation in this milestone.
 */
export function PreviewViewport() {
  const isGridVisible = usePreviewStore((state) => state.isGridVisible);

  return <div className="relative h-full w-full overflow-hidden bg-[#0c0d12]"><Canvas camera={{ fov: 45, position: [0, 0, 5] }} frameloop="demand" gl={{ antialias: true }}><color args={["#0c0d12"]} attach="background" /></Canvas><div className={`preview-grid pointer-events-none ${isGridVisible ? "opacity-100" : "opacity-0"}`} /><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="max-w-sm text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-violet-300"><Box size={26} /></div><h2 className="mt-4 text-sm font-medium text-slate-200">3D preview is ready for integration</h2><p className="mt-2 text-xs leading-5 text-slate-500">The preview boundary is isolated for a future React Three Fiber scene, models, camera controls, and playback.</p></div></div></div>;
}
