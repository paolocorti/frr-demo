import { create } from "zustand";
import * as THREE from "three";
import type { CameraPath, Waypoint } from "../types/cameraPath";
import { createPath, createWaypoint } from "../types/cameraPath";
import { samplePointsFromPath } from "../utils/pathParser";

const STORAGE_KEY = "camera-paths-v1";

interface CameraPathsState {
  paths: CameraPath[];
  activePathId: string | null;
  selectedWaypointId: string | null;
  isEditing: boolean;
  isDraggingWaypoint: boolean;

  // Path actions
  addPath: (name?: string) => void;
  addSvgPath: () => void;
  addSvgPathWithLessZoom: () => void;
  removePath: (id: string) => void;
  updatePath: (id: string, updates: Partial<CameraPath>) => void;
  setActivePath: (id: string | null) => void;

  // Waypoint actions
  addWaypoint: (
    pathId: string,
    position: [number, number, number],
    lookAt?: [number, number, number],
  ) => void;
  removeWaypoint: (pathId: string, waypointId: string) => void;
  updateWaypoint: (
    pathId: string,
    waypointId: string,
    updates: Partial<Waypoint>,
  ) => void;
  setSelectedWaypoint: (id: string | null) => void;

  // Editor actions
  setEditing: (editing: boolean) => void;
  setDraggingWaypoint: (dragging: boolean) => void;

  // Persistence
  loadFromStorage: () => void;
}

interface GenerateCameraPathOptions {
  name?: string;
  numWaypoints?: number;
  lateralOffset?: number;
  heightOffset?: number;
  speed?: number;
  loop?: boolean;
}

const generateSvgBasedCameraPath = (
  options: GenerateCameraPathOptions = {},
): CameraPath => {
  const {
    name = "SVG Follow",
    numWaypoints = 80,
    lateralOffset = 0.3,
    heightOffset = 0.2,
    speed = 0.002,
    loop = true,
  } = options;

  const basePoints = samplePointsFromPath(numWaypoints);
  const waypoints: Waypoint[] = [];

  const pathId = `path-svg-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  for (let i = 0; i < basePoints.length; i += 1) {
    const current = basePoints[i];
    const prev = basePoints[i === 0 ? i : i - 1];
    const next = basePoints[i === basePoints.length - 1 ? i : i + 1];

    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const position = current
      .clone()
      .add(normal.multiplyScalar(lateralOffset))
      .add(new THREE.Vector3(0, heightOffset, 0));

    waypoints.push({
      id: `waypoint-svg-${pathId}-${i}`,
      position: [position.x, position.y, position.z],
      lookAt: [current.x, current.y, current.z],
    });
  }

  return {
    id: pathId,
    name,
    waypoints,
    speed,
    loop,
  };
};

const DEFAULT_PATH: CameraPath = generateSvgBasedCameraPath();

// Load from localStorage on init
const loadPathsFromStorage = (): CameraPath[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load paths from storage:", e);
  }
  return [DEFAULT_PATH];
};

const initialPaths = loadPathsFromStorage();

export const useCameraPathsStore = create<CameraPathsState>()((set) => ({
  paths: initialPaths,
  activePathId: initialPaths.length > 0 ? initialPaths[0].id : null,
  selectedWaypointId: null,
  isEditing: false,
  isDraggingWaypoint: false,

  // Path actions
  addPath: (name) => {
    const newPath = createPath(name);
    set((state) => ({
      paths: [...state.paths, newPath],
      activePathId: newPath.id,
    }));
  },

  addSvgPath: () => {
    const newPath = generateSvgBasedCameraPath();
    set((state) => ({
      paths: [...state.paths, newPath],
      activePathId: newPath.id,
    }));
  },

  addSvgPathWithLessZoom: () => {
    const newPath = generateSvgBasedCameraPath({
      name: "SVG Less Zoom",
      heightOffset: 0.75,
      lateralOffset: 0.5,
      speed: 0.004,
      loop: true,
    });

    set((state) => ({
      paths: [...state.paths, newPath],
      activePathId: newPath.id,
    }));
  },

  removePath: (id) =>
    set((state) => ({
      paths: state.paths.filter((p) => p.id !== id),
      activePathId: state.activePathId === id ? null : state.activePathId,
    })),

  updatePath: (id: string, updates: Partial<CameraPath>) =>
    set((state) => ({
      paths: state.paths.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  setActivePath: (id: string | null) => set({ activePathId: id }),

  // Waypoint actions
  addWaypoint: (
    pathId: string,
    position: [number, number, number],
    lookAt?: [number, number, number],
  ) => {
    const waypoint = createWaypoint(position, lookAt);
    set((state) => ({
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, waypoints: [...p.waypoints, waypoint] } : p,
      ),
    }));
  },

  removeWaypoint: (pathId: string, waypointId: string) =>
    set((state) => ({
      paths: state.paths.map((p) =>
        p.id === pathId
          ? { ...p, waypoints: p.waypoints.filter((w) => w.id !== waypointId) }
          : p,
      ),
      selectedWaypointId:
        state.selectedWaypointId === waypointId
          ? null
          : state.selectedWaypointId,
    })),

  updateWaypoint: (
    pathId: string,
    waypointId: string,
    updates: Partial<Waypoint>,
  ) =>
    set((state) => ({
      paths: state.paths.map((p) =>
        p.id === pathId
          ? {
              ...p,
              waypoints: p.waypoints.map((w) =>
                w.id === waypointId ? { ...w, ...updates } : w,
              ),
            }
          : p,
      ),
    })),

  setSelectedWaypoint: (id: string | null) => set({ selectedWaypointId: id }),

  // Editor actions
  setEditing: (editing: boolean) => set({ isEditing: editing }),

  setDraggingWaypoint: (dragging: boolean) =>
    set({ isDraggingWaypoint: dragging }),

  // Persistence
  loadFromStorage: () =>
    set(() => {
      const paths = loadPathsFromStorage();
      return {
        paths,
        activePathId: paths.length > 0 ? paths[0].id : null,
      };
    }),
}));

// Auto-save to localStorage when paths change
useCameraPathsStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.paths));
  } catch (e) {
    console.warn("Failed to save paths to storage:", e);
  }
});

// Selector to get active path
export const useActivePath = () =>
  useCameraPathsStore(
    (state) => state.paths.find((p) => p.id === state.activePathId) || null,
  );
