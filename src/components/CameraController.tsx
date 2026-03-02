import { forwardRef, useImperativeHandle } from "react";
import { OrbitControls } from "@react-three/drei";
import { useCameraAnimation } from "../hooks/useCameraAnimation";
import { useCameraPathsStore } from "../stores/cameraPathsStore";

export interface CameraControllerRef {
  reset: () => void;
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CameraControllerProps {
  isAnimating: boolean;
}

export const CameraController = forwardRef<
  CameraControllerRef,
  CameraControllerProps
>(function CameraController({ isAnimating }, ref) {
  const { reset: resetCamera } = useCameraAnimation({
    enabled: isAnimating,
  });
  const isDraggingWaypoint = useCameraPathsStore((s) => s.isDraggingWaypoint);

  useImperativeHandle(ref, () => ({
    reset: resetCamera,
    startAnimation: () => {
      // Animation is controlled by isAnimating prop
    },
    stopAnimation: () => {
      // Animation is controlled by isAnimating prop
    },
  }));

  return (
    <OrbitControls
      enabled={!isAnimating && !isDraggingWaypoint}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={50}
    />
  );
});
