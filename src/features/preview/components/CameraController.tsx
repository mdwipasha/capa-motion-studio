import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useThree } from "@react-three/fiber";
import { useCameraStore } from "@/stores/camera-store";

const defaultCameraPosition: [number, number, number] = [7, 5, 9];

export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null);
  const resetRequestId = useCameraStore((state) => state.resetRequestId);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    camera.position.set(...defaultCameraPosition);
    camera.lookAt(0, 0.5, 0);
    controls.current?.target.set(0, 0.5, 0);
    controls.current?.update();
    invalidate();
  }, [camera, invalidate, resetRequestId]);

  return <OrbitControls ref={controls} enableDamping dampingFactor={0.08} maxDistance={30} minDistance={3} target={[0, 0.5, 0]} />;
}
