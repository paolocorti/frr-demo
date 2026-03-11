import { create } from "zustand";
import type { CameraPath, Waypoint } from "../types/cameraPath";
import { createPath, createWaypoint } from "../types/cameraPath";

const STORAGE_KEY = "camera-paths-v1";

interface CameraPathsState {
  paths: CameraPath[];
  activePathId: string | null;
  selectedWaypointId: string | null;
  isEditing: boolean;
  isDraggingWaypoint: boolean;

  // Path actions
  addPath: (name?: string) => void;
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

const DEFAULT_PATH: CameraPath = {
  id: "path-1772458000637-8ffl757or",
  name: "test",
  waypoints: [
    {
      id: "waypoint-1772458013046-jzjpsc7d1",
      position: [-5.186425161997555, 0.1, 5.673950598750155],
      lookAt: [26.5, 0, -61.5],
    },
    {
      id: "waypoint-1772458035968-uk79wqw6k",
      position: [-3.5174893041701445, 0.1, -0.3871888258556364],
      lookAt: [1, 0, 1.5],
    },
    {
      id: "waypoint-1772458049380-n5k84xyfx",
      position: [1.3856488331414591, 0.1, 4.900127073515091],
      lookAt: [0, 0, 0],
    },
    {
      id: "waypoint-1772461178671-nxqncfkno",
      position: [3.4005059047139703, 0.1, 0.15400122812511963],
      lookAt: [0, 0, 0],
    },
    {
      id: "waypoint-1772461190871-grg2g9t7m",
      position: [5.4064874452974205, 0.1, -6.196561690120127],
      lookAt: [0, 0, 0],
    },
  ],
  speed: 0.005,
  loop: true,
};

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
