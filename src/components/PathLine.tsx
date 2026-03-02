import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { CameraPath } from '../types/cameraPath';

interface PathLineProps {
  path: CameraPath;
  isActive: boolean;
}

export function PathLine({ path, isActive }: PathLineProps) {
  const points = useMemo(() => {
    if (path.waypoints.length < 2) return [];

    // Create smooth curve through waypoints
    const positions = path.waypoints.map((w) => new THREE.Vector3(...w.position));

    if (positions.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(positions, path.loop, 'catmullrom', 0.5);
      return curve.getPoints(100);
    }

    return positions;
  }, [path.waypoints, path.loop]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color={isActive ? '#00ff00' : '#666666'}
      lineWidth={isActive ? 3 : 1}
      opacity={isActive ? 1 : 0.5}
      transparent
    />
  );
}
