import * as THREE from 'three';
import { PRECOMPUTED_SVG_PATH_POINTS } from './precomputedSvgPathPoints';

export function createCurveFromPoints(points: THREE.Vector3[]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

export function getPathCurve(): THREE.CatmullRomCurve3 {
  const points = PRECOMPUTED_SVG_PATH_POINTS.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z),
  );
  return createCurveFromPoints(points);
}
