import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { useCameraAnimation } from "../hooks/useCameraAnimation";
import { useCameraPathsStore } from "../stores/cameraPathsStore";
import type { Vec3 } from "../utils/cameraViews";
import { lerpPose } from "../utils/cameraControlsPath";

interface TransitionState {
  active: boolean;
  elapsed: number;
  duration: number;
  fromPos: Vec3;
  fromTarget: Vec3;
  toPos: Vec3;
  toTarget: Vec3;
}

export interface CameraControllerRef {
  reset: () => void;
  startAnimation: () => void;
  stopAnimation: () => void;
  setItemOrientationMode: (enabled: boolean) => void;
  setView: (position: Vec3, target: Vec3) => void;
  setPathProgress: (progress: number) => void;
  getPathPoseAtProgress: (
    progress: number,
  ) => { position: Vec3; target: Vec3 } | null;
  startTransitionToPathProgress: (progress: number, duration?: number) => boolean;
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const {
    reset: resetCamera,
    currentLookAtRef,
    setProgress,
    getPoseAtProgress,
    setItemOrientationMode,
  } = useCameraAnimation({
    enabled: isAnimating && !isTransitioning,
  });
  const isDraggingWaypoint = useCameraPathsStore((s) => s.isDraggingWaypoint);

  useEffect(() => {
    // CameraControls can initialize after camera pose is set. Re-apply pose
    // on the next frame so controls and camera are always in sync at startup.
    let raf1 = 0;
    let raf2 = 0;

    const syncInitialPose = () => {
      const target = currentLookAtRef.current ?? new THREE.Vector3(0, 0, 0);
      camera.lookAt(target);
      controlsRef.current?.setLookAt(
        camera.position.x,
        camera.position.y,
        camera.position.z,
        target.x,
        target.y,
        target.z,
        false,
      );
    };

    raf1 = window.requestAnimationFrame(() => {
      syncInitialPose();
      raf2 = window.requestAnimationFrame(syncInitialPose);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [camera, currentLookAtRef]);

  useFrame((_, delta) => {
    const state = transitionRef.current;
    if (state?.active) {
      state.elapsed += delta;
      const alpha = Math.min(state.elapsed / state.duration, 1);
      const pose = lerpPose(
        {
          position: new THREE.Vector3(...state.fromPos),
          target: new THREE.Vector3(...state.fromTarget),
        },
        {
          position: new THREE.Vector3(...state.toPos),
          target: new THREE.Vector3(...state.toTarget),
        },
        alpha,
      );

      camera.position.copy(pose.position);
      camera.lookAt(pose.target);

      controlsRef.current?.setLookAt(
        pose.position.x,
        pose.position.y,
        pose.position.z,
        pose.target.x,
        pose.target.y,
        pose.target.z,
        false,
      );

      if (alpha >= 1) {
        state.active = false;
        setIsTransitioning(false);
      }
      return;
    }

    if (isAnimating && currentLookAtRef.current && controlsRef.current) {
      controlsRef.current.setLookAt(
        camera.position.x,
        camera.position.y,
        camera.position.z,
        currentLookAtRef.current.x,
        currentLookAtRef.current.y,
        currentLookAtRef.current.z,
        false,
      );
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
    setItemOrientationMode: (enabledMode) => {
      setItemOrientationMode(enabledMode);
    },
    setView: (position, target) => {
      camera.position.set(position[0], position[1], position[2]);
      camera.lookAt(target[0], target[1], target[2]);
      controlsRef.current?.setLookAt(
        position[0],
        position[1],
        position[2],
        target[0],
        target[1],
        target[2],
        false,
      );
    },
    setPathProgress: (progress) => {
      setProgress(progress);
    },
    getPathPoseAtProgress: (progress) => getPoseAtProgress(progress),
    startTransitionToPathProgress: (progress, duration = 1) => {
      const pathPose = getPoseAtProgress(progress);
      if (!pathPose) return false;
      setProgress(progress);
      setIsTransitioning(true);
      const fromPos: Vec3 = [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ];

      let fromTarget: Vec3;
      const controlsTarget = new THREE.Vector3();
      if (controlsRef.current?.getTarget) {
        controlsRef.current.getTarget(controlsTarget);
        fromTarget = [controlsTarget.x, controlsTarget.y, controlsTarget.z];
      } else if (currentLookAtRef?.current) {
        fromTarget = [
          currentLookAtRef.current.x,
          currentLookAtRef.current.y,
          currentLookAtRef.current.z,
        ];
      } else {
        const direction = camera.getWorldDirection(new THREE.Vector3());
        const currentTarget = direction.clone().add(camera.position);
        fromTarget = [currentTarget.x, currentTarget.y, currentTarget.z];
      }

      transitionRef.current = {
        active: true,
        elapsed: 0,
        duration,
        fromPos,
        fromTarget,
        toPos: pathPose.position,
        toTarget: pathPose.target,
      };
      return true;
    },
    startTransition: (position, target, duration = 1) => {
      setIsTransitioning(true);
      const fromPos: Vec3 = [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ];

      let fromTarget: Vec3;
      const controlsTarget = new THREE.Vector3();
      if (controlsRef.current?.getTarget) {
        controlsRef.current.getTarget(controlsTarget);
        fromTarget = [controlsTarget.x, controlsTarget.y, controlsTarget.z];
      } else if (currentLookAtRef?.current) {
        fromTarget = [
          currentLookAtRef.current.x,
          currentLookAtRef.current.y,
          currentLookAtRef.current.z,
        ];
      } else {
        // Fallback: derive from camera direction
        const direction = camera.getWorldDirection(new THREE.Vector3());
        const currentTarget = direction.clone().add(camera.position);
        fromTarget = [
          currentTarget.x,
          currentTarget.y,
          currentTarget.z,
        ];
      }

      transitionRef.current = {
        active: true,
        elapsed: 0,
        duration,
        fromPos,
        fromTarget,
        toPos: position,
        toTarget: target,
      };
    },
  }));

  return (
    <CameraControls
      ref={controlsRef}
      enabled={!isAnimating && !isDraggingWaypoint && !isTransitioning}
      makeDefault
      minDistance={2}
      maxDistance={50}
    />
  );
});
