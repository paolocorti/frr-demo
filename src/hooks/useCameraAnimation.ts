import { useRef, useCallback, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useActivePath, useCameraPathsStore } from "../stores/cameraPathsStore";

interface UseCameraAnimationOptions {
  enabled?: boolean;
}

export function useCameraAnimation({
  enabled = false,
}: UseCameraAnimationOptions) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const activePath = useActivePath();
  const zoomFactor = useCameraPathsStore((s) => s.zoomFactor);
  const targetZoomFactor = useCameraPathsStore((s) => s.targetZoomFactor);
  const setZoomFactor = useCameraPathsStore((s) => s.setZoomFactor);

  // Initial position
  const initialPosition = useRef(new THREE.Vector3(7, 5, 7));
  const initialTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Create curve from waypoints
  const curve = useMemo(() => {
    if (!activePath || activePath.waypoints.length < 2) return null;

    const points = activePath.waypoints.map(
      (w) => new THREE.Vector3(...w.position)
    );
    return new THREE.CatmullRomCurve3(
      points,
      activePath.loop,
      "catmullrom",
      0.5
    );
  }, [activePath]);

  // Create lookAt points curve
  const lookAtCurve = useMemo(() => {
    if (!activePath || activePath.waypoints.length < 2) return null;

    const points = activePath.waypoints.map(
      (w) => new THREE.Vector3(...w.lookAt)
    );
    return new THREE.CatmullRomCurve3(
      points,
      activePath.loop,
      "catmullrom",
      0.5
    );
  }, [activePath]);

  const reset = useCallback(() => {
    progressRef.current = 0;
    camera.position.copy(initialPosition.current);
    camera.lookAt(initialTarget.current);
  }, [camera]);

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

    const speed = activePath.speed;
    progressRef.current += speed * delta;

    if (progressRef.current > 1) {
      if (activePath.loop) {
        progressRef.current = 0;
      } else {
        progressRef.current = 1;
        return;
      }
    }

    // Get base position and lookAt from curves
    const basePosition = curve.getPoint(progressRef.current);
    const lookAt = lookAtCurve.getPoint(progressRef.current);

    // Compute an offset vector from lookAt to camera and scale it with zoomFactor
    const offset = new THREE.Vector3().subVectors(basePosition, lookAt);
    const baseDistance = offset.length() || 1;
    offset.normalize();

    // When zoomFactor = 0 → original distance
    // When zoomFactor = 1 → farther away by this multiplier
    const farMultiplier = 2.5;
    const distanceMultiplier = 1 + zoomFactor * (farMultiplier - 1);

    offset.multiplyScalar(baseDistance * distanceMultiplier);
    const finalPosition = new THREE.Vector3().addVectors(lookAt, offset);

    camera.position.copy(finalPosition);
    camera.lookAt(lookAt);
  });

  return { reset, progress: progressRef };
}
