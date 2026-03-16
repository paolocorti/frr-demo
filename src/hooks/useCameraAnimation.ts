import { useRef, useCallback, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useActivePath, useCameraPathsStore } from "../stores/cameraPathsStore";
import type { Vec3 } from "../utils/cameraViews";

interface UseCameraAnimationOptions {
  enabled?: boolean;
}

export interface PathPose {
  position: Vec3;
  target: Vec3;
}

export function useCameraAnimation({
  enabled = false,
}: UseCameraAnimationOptions) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const activePath = useActivePath();
  const zoomFactor = useCameraPathsStore((s) => s.zoomFactor);
  const targetZoomFactor = useCameraPathsStore((s) => s.targetZoomFactor);
  const lookAheadBias = useCameraPathsStore((s) => s.lookAheadBias);
  const speedMultiplier = useCameraPathsStore((s) => s.speedMultiplier);
  const setZoomFactor = useCameraPathsStore((s) => s.setZoomFactor);

  // Initial position
  const initialPosition = useRef(new THREE.Vector3(7, 5, 7));
  const initialTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAtRef = useRef<THREE.Vector3 | null>(null);
  const itemOrientationEnabledRef = useRef(false);

  // Create curve from waypoints
  const curve = useMemo(() => {
    if (!activePath || activePath.waypoints.length < 2) return null;

    const points = activePath.waypoints.map(
      (w) => new THREE.Vector3(...w.position),
    );
    return new THREE.CatmullRomCurve3(
      points,
      activePath.loop,
      "catmullrom",
      0.5,
    );
  }, [activePath]);

  // Create lookAt points curve
  const lookAtCurve = useMemo(() => {
    if (!activePath || activePath.waypoints.length < 2) return null;

    const points = activePath.waypoints.map(
      (w) => new THREE.Vector3(...w.lookAt),
    );
    return new THREE.CatmullRomCurve3(
      points,
      activePath.loop,
      "catmullrom",
      0.5,
    );
  }, [activePath]);

  const reset = useCallback(() => {
    progressRef.current = 0;
    camera.position.copy(initialPosition.current);
    camera.lookAt(initialTarget.current);
    if (!currentLookAtRef.current) {
      currentLookAtRef.current = new THREE.Vector3();
    }
    currentLookAtRef.current.copy(initialTarget.current);
  }, [camera]);

  const setProgress = useCallback((value: number) => {
    progressRef.current = Math.min(1, Math.max(0, value));
  }, []);

  const getProgress = useCallback(() => progressRef.current, []);

  const getPoseAtProgress = useCallback(
    (progress: number): PathPose | null => {
      if (!curve || !lookAtCurve || !activePath) return null;

      const clampedProgress = Math.min(1, Math.max(0, progress));
      const basePosition = curve.getPoint(clampedProgress);
      const lookAt = lookAtCurve.getPoint(clampedProgress);

      const lookAheadStep = 0.02;
      let lookAheadT = clampedProgress + lookAheadStep;
      if (lookAheadT > 1) {
        lookAheadT = activePath.loop ? lookAheadT - 1 : 1;
      }
      const movementLookAt = curve.getPoint(lookAheadT);
      const orientationBias = itemOrientationEnabledRef.current
        ? 1
        : lookAheadBias;
      const effectiveLookAt = lookAt
        .clone()
        .lerp(movementLookAt, orientationBias);

      const offset = new THREE.Vector3().subVectors(basePosition, lookAt);
      const baseDistance = offset.length() || 1;
      offset.normalize();

      const farMultiplier = 2.5;
      const distanceMultiplier = 1 + zoomFactor * (farMultiplier - 1);

      offset.multiplyScalar(baseDistance * distanceMultiplier);
      const finalPosition = new THREE.Vector3().addVectors(lookAt, offset);

      // Lower camera in Item Selected mode only
      if (itemOrientationEnabledRef.current) {
        finalPosition.y -= 0.1; // tune this value
      }

      return {
        position: [finalPosition.x, finalPosition.y, finalPosition.z],
        target: [effectiveLookAt.x, effectiveLookAt.y, effectiveLookAt.z],
      };
    },
    [activePath, curve, lookAheadBias, lookAtCurve, zoomFactor],
  );

  // Ensure the camera starts from the path's initial pose on mount
  useEffect(() => {
    reset();
    // We only want this once on mount for the current camera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!enabled || !curve || !lookAtCurve || !activePath) return;

    // Smoothly animate zoomFactor towards targetZoomFactor
    if (Math.abs(targetZoomFactor - zoomFactor) > 0.001) {
      const direction = targetZoomFactor > zoomFactor ? 1 : -1;
      const zoomSpeed = 0.5; // units per second
      let next = zoomFactor + direction * zoomSpeed * delta;
      if (
        (direction > 0 && next > targetZoomFactor) ||
        (direction < 0 && next < targetZoomFactor)
      ) {
        next = targetZoomFactor;
      }
      setZoomFactor(next);
    }

    const speed = Math.min(
      1,
      Math.max(0.0001, activePath.speed * speedMultiplier),
    );
    progressRef.current += speed * delta;

    if (progressRef.current > 1) {
      if (activePath.loop) {
        progressRef.current = 0;
      } else {
        progressRef.current = 1;
        return;
      }
    }

    const pose = getPoseAtProgress(progressRef.current);
    if (!pose) return;
    const effectiveLookAt = new THREE.Vector3(...pose.target);

    if (!currentLookAtRef.current) {
      currentLookAtRef.current = new THREE.Vector3();
    }
    currentLookAtRef.current.copy(effectiveLookAt);
    camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    camera.lookAt(effectiveLookAt);
  });

  return {
    reset,
    progress: progressRef,
    currentLookAtRef,
    setProgress,
    getProgress,
    getPoseAtProgress,
    setItemOrientationMode: (enabledMode: boolean) => {
      itemOrientationEnabledRef.current = enabledMode;
    },
  };
}
