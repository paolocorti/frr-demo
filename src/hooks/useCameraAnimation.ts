import { useRef, useCallback, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useActivePath } from "../stores/cameraPathsStore";

interface UseCameraAnimationOptions {
  enabled?: boolean;
}

export function useCameraAnimation({
  enabled = false,
}: UseCameraAnimationOptions) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const activePath = useActivePath();

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

    // Get position and lookAt from curves
    const position = curve.getPoint(progressRef.current);
    const lookAt = lookAtCurve.getPoint(progressRef.current);

    camera.position.copy(position);
    camera.lookAt(lookAt);
  });

  return { reset, progress: progressRef };
}
