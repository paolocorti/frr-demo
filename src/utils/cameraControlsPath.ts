import * as THREE from "three";
import type { CameraPath } from "../types/cameraPath";

export interface PathCurves {
  positionCurve: THREE.CatmullRomCurve3;
  targetCurve: THREE.CatmullRomCurve3;
  speed: number;
  loop: boolean;
}

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export function createPathCurvesFromJson(path: CameraPath): PathCurves {
  const positionPoints = path.waypoints.map((w) => new THREE.Vector3(...w.position));
  const targetPoints = path.waypoints.map((w) => new THREE.Vector3(...w.lookAt));

  const positionCurve = new THREE.CatmullRomCurve3(
    positionPoints,
    path.loop,
    "catmullrom",
    0.5,
  );
  const targetCurve = new THREE.CatmullRomCurve3(
    targetPoints,
    path.loop,
    "catmullrom",
    0.5,
  );

  return {
    positionCurve,
    targetCurve,
    speed: path.speed,
    loop: path.loop,
  };
}

export function samplePathPose(curves: PathCurves, t: number): CameraPose {
  const normalizedT = Math.max(0, Math.min(1, t));
  return {
    position: curves.positionCurve.getPoint(normalizedT),
    target: curves.targetCurve.getPoint(normalizedT),
  };
}

export function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

export function lerpPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  const alpha = smoothstep(t);
  return {
    position: from.position.clone().lerp(to.position, alpha),
    target: from.target.clone().lerp(to.target, alpha),
  };
}
