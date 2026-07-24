import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useThree } from "@react-three/fiber";
import { useCameraStore } from "@/stores/camera-store";

export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null);
  const resetRequestId = useCameraStore((state) => state.resetRequestId);
  const view = useCameraStore((state) => state.view);
  const setView = useCameraStore((state) => state.setView);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    camera.position.set(...view.position);
    camera.lookAt(...view.target);
    controls.current?.target.set(...view.target);
    controls.current?.update();
    invalidate();
  }, [camera, invalidate, resetRequestId, view]);

  return <OrbitControls ref={controls} enableDamping dampingFactor={0.08} makeDefault maxDistance={30} minDistance={3} onEnd={() => {
    const control = controls.current;
    if (!control) return;
    setView({ position: [camera.position.x, camera.position.y, camera.position.z], target: [control.target.x, control.target.y, control.target.z] });
  }} target={view.target} />;
}
