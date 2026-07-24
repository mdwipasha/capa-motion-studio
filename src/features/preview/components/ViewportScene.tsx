import { Grid } from "@react-three/drei";
import { RigPlaceholder } from "@/features/preview/components/RigPlaceholder";
import { CameraController } from "@/features/preview/components/CameraController";
import type { RigType } from "@/types/project";

interface ViewportSceneProps { readonly rigType: RigType; readonly isGridVisible: boolean; readonly showRig?: boolean; }

export function ViewportScene({ rigType, isGridVisible, showRig = true }: ViewportSceneProps) {
  return <><ambientLight intensity={0.65} /><directionalLight castShadow intensity={1.4} position={[6, 8, 5]} shadow-mapSize={[1024, 1024]} /><directionalLight intensity={0.3} position={[-5, 3, -4]} />{isGridVisible && <Grid args={[20, 20]} cellColor="#334155" cellSize={0.5} cellThickness={0.5} fadeDistance={20} fadeStrength={1.5} sectionColor="#64748b" sectionSize={2.5} sectionThickness={1} />}<axesHelper args={[2.5]} />{showRig && <RigPlaceholder rigType={rigType} />}<CameraController /></>;
}
