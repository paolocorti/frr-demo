import { useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { WaypointMarker } from './WaypointMarker';
import { PathLine } from './PathLine';
import { useCameraPathsStore } from '../stores/cameraPathsStore';

export function CameraPathEditor() {
  const paths = useCameraPathsStore((s) => s.paths);
  const activePathId = useCameraPathsStore((s) => s.activePathId);
  const selectedWaypointId = useCameraPathsStore((s) => s.selectedWaypointId);
  const isEditing = useCameraPathsStore((s) => s.isEditing);
  const addWaypoint = useCameraPathsStore((s) => s.addWaypoint);
  const setSelectedWaypoint = useCameraPathsStore((s) => s.setSelectedWaypoint);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();

      if (!isEditing) {
        console.log('Not in edit mode');
        return;
      }

      if (!activePathId) {
        console.log('No active path - create a path first');
        return;
      }

      // Get click position on the XZ plane
      const point = e.point;
      const position: [number, number, number] = [point.x, 0.5, point.z];
      const lookAt: [number, number, number] = [0, 0, 0]; // Default look at center

      console.log('Adding waypoint at:', position);
      addWaypoint(activePathId, position, lookAt);
    },
    [isEditing, activePathId, addWaypoint]
  );

  const handleMissed = useCallback(() => {
    if (isEditing) {
      setSelectedWaypoint(null);
    }
  }, [isEditing, setSelectedWaypoint]);

  return (
    <group>
      {/* Clickable plane for adding waypoints - positioned above ground */}
      {isEditing && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onDoubleClick={handleClick}
          onPointerMissed={handleMissed}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Render all paths */}
      {paths.map((path) => (
        <group key={path.id}>
          <PathLine path={path} isActive={path.id === activePathId} />

          {/* Render waypoints for active path in edit mode */}
          {(isEditing || path.id === activePathId) &&
            path.waypoints.map((waypoint, index) => (
              <WaypointMarker
                key={waypoint.id}
                waypoint={waypoint}
                pathId={path.id}
                isSelected={waypoint.id === selectedWaypointId}
                index={index}
              />
            ))}
        </group>
      ))}
    </group>
  );
}
