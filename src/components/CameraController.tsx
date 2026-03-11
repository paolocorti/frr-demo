import { forwardRef, useImperativeHandle, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCameraAnimation } from "../hooks/useCameraAnimation";
import { useCameraPathsStore } from "../stores/cameraPathsStore";
import type { Vec3 } from "../utils/cameraViews";

interface TransitionState {
  active: boolean;
  elapsed: number;
  duration: number;
  fromPos: Vec3;
  toPos: Vec3;
  target: Vec3;
}

export interface CameraControllerRef {
  reset: () => void;
  startAnimation: () => void;
  stopAnimation: () => void;
  setView: (position: Vec3, target: Vec3) => void;
  startTransition: (position: Vec3, target: Vec3, duration?: number) => void;
}

interface CameraControllerProps {
  isAnimating: boolean;
}

export const CameraController = forwardRef<
  CameraControllerRef,
  CameraControllerProps
>(function CameraController({ isAnimating }, ref) {
  const { camera } = useThree();
  const transitionRef = useRef<TransitionState | null>(null);
  const { reset: resetCamera } = useCameraAnimation({
    enabled: isAnimating,
  });
  const isDraggingWaypoint = useCameraPathsStore((s) => s.isDraggingWaypoint);

  useFrame((_, delta) => {
    if (isAnimating) return;
    const state = transitionRef.current;
    if (!state || !state.active) return;

    state.elapsed += delta;
    const alpha = Math.min(state.elapsed / state.duration, 1);

    const lerp = (a: number, b: number) => a + (b - a) * alpha;

    const [sx, sy, sz] = state.fromPos;
    const [ex, ey, ez] = state.toPos;
    const [tx, ty, tz] = state.target;

    const x = lerp(sx, ex);
    const y = lerp(sy, ey);
    const z = lerp(sz, ez);

    camera.position.set(x, y, z);
    camera.lookAt(tx, ty, tz);

    if (alpha >= 1) {
      state.active = false;
    }
  });

  useImperativeHandle(ref, () => ({
    reset: resetCamera,
    startAnimation: () => {
      // Animation is controlled by isAnimating prop
    },
    stopAnimation: () => {
      // Animation is controlled by isAnimating prop
    },
    setView: (position, target) => {
      camera.position.set(position[0], position[1], position[2]);
      camera.lookAt(target[0], target[1], target[2]);
    },
    startTransition: (position, target, duration = 1) => {
      transitionRef.current = {
        active: true,
        elapsed: 0,
        duration,
        fromPos: [camera.position.x, camera.position.y, camera.position.z],
        toPos: position,
        target,
      };
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
