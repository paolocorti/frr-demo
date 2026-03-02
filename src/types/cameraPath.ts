export interface Waypoint {
  id: string;
  position: [number, number, number];
  lookAt: [number, number, number];
}

export interface CameraPath {
  id: string;
  name: string;
  waypoints: Waypoint[];
  speed: number;
  loop: boolean;
}

export function createWaypoint(position: [number, number, number], lookAt: [number, number, number] = [0, 0, 0]): Waypoint {
  return {
    id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position,
    lookAt,
  };
}

export function createPath(name: string = 'New Path'): CameraPath {
  return {
    id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    waypoints: [],
    speed: 0.02,
    loop: true,
  };
}
