import * as THREE from 'three';
import { getLength, getPointAtLength } from '@remotion/paths';

// The d attribute from circuit.svg stroke path (class st1)
const SVG_PATH_D = `M229.8,256.4l98.3,160.4s25.4,37.3,44.6-14.1c19.2-51.4-2.8-115.2,2.8-139.5,5.6-24.3,23.7-74,75.1-74s80.2,5.6,75.7-80.2-43.5-92.6-43.5-92.6c0,0-7.9-19.2-46.9,54.8s-76.8,116.9-103.9,135.5c-27.1,18.6-169.4,180.7-173.4,194.3-4,13.6-39,110.1-77.9,94.3s11.3-63.2,44-112.4c32.8-49.1,50.3-138.4,57-155.3s15.8-31.1,44.6-42.9c28.8-11.9,80.4-29.5,110.7-56.5,30.8-27.5,49.5-60.6,61-56.5,20.4,7.4-27.7,58.2-87,105.6s-104.5,37.3-81.3,79.1Z`;

const SVG_VIEWBOX = { width: 595, height: 510 };
const SCALE_FACTOR = 40; // Adjust to scale the path in 3D space (was 50, increased 25%)

export function samplePointsFromPath(numSamples: number): THREE.Vector3[] {
  const totalLength = getLength(SVG_PATH_D);
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1);
    const distance = t * totalLength;

    // Get 2D point from SVG path
    const point2D = getPointAtLength(SVG_PATH_D, distance);

    // Convert to 3D space - rotated 90 degrees to lay flat on XZ plane
    // Center the SVG on origin and scale appropriately
    const x = (point2D.x - SVG_VIEWBOX.width / 2) / SCALE_FACTOR;
    const z = (point2D.y - SVG_VIEWBOX.height / 2) / SCALE_FACTOR; // Y becomes Z for flat layout
    const y = 0; // Flat on the grid

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

export function createCurveFromPoints(points: THREE.Vector3[]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

export function getPathCurve(numSamples: number = 1500): THREE.CatmullRomCurve3 {
  const points = samplePointsFromPath(numSamples);
  return createCurveFromPoints(points);
}
