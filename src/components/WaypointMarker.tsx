import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { Waypoint } from "../types/cameraPath";
import { useCameraPathsStore } from "../stores/cameraPathsStore";

interface WaypointMarkerProps {
  waypoint: Waypoint;
  pathId: string;
  isSelected: boolean;
  index: number;
}

export function WaypointMarker({
  waypoint,
  pathId,
  isSelected,
  index,
}: WaypointMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster } = useThree();

  const updateWaypoint = useCameraPathsStore((s) => s.updateWaypoint);
  const setSelectedWaypoint = useCameraPathsStore((s) => s.setSelectedWaypoint);
  const removeWaypoint = useCameraPathsStore((s) => s.removeWaypoint);
  const isEditing = useCameraPathsStore((s) => s.isEditing);
  const setDraggingWaypoint = useCameraPathsStore((s) => s.setDraggingWaypoint);

  const position = new THREE.Vector3(...waypoint.position);
  const lookAt = new THREE.Vector3(...waypoint.lookAt);

  // Calculate direction arrow
  const direction = lookAt.clone().sub(position).normalize();
  const arrowLength = Math.min(lookAt.distanceTo(position) * 0.3, 2);

  // Drag handlers
  const handlePointerDown = useCallback(
    (e: {
      stopPropagation: () => void;
      pointerId: number;
      target: { setPointerCapture: (id: number) => void };
    }) => {
      if (!isEditing) return;
      e.stopPropagation();
      setSelectedWaypoint(waypoint.id);
      setIsDragging(true);
      setDraggingWaypoint(true);
      e.target.setPointerCapture(e.pointerId);
    },
    [isEditing, waypoint.id, setSelectedWaypoint, setDraggingWaypoint],
  );

  const handlePointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      if (!isDragging || !isEditing) return;

      // Cast ray from camera through pointer position
      const plane = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        -waypoint.position[1],
      );
      const point = new THREE.Vector3();
      const coords = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      raycaster.setFromCamera(coords, camera);
      raycaster.ray.intersectPlane(plane, point);

      if (point) {
        const newPos: [number, number, number] = [
          point.x,
          waypoint.position[1],
          point.z,
        ];
        updateWaypoint(pathId, waypoint.id, { position: newPos });
      }
    },
    [
      isDragging,
      isEditing,
      waypoint.position,
      pathId,
      waypoint.id,
      updateWaypoint,
      camera,
      raycaster,
    ],
  );

  const handlePointerUp = useCallback(
    (e: {
      pointerId: number;
      target: { releasePointerCapture: (id: number) => void };
    }) => {
      setIsDragging(false);
      setDraggingWaypoint(false);
      e.target.releasePointerCapture(e.pointerId);
    },
    [setDraggingWaypoint],
  );

  return (
    <group>
      {/* Waypoint sphere */}
      <mesh
        ref={meshRef}
        position={waypoint.position}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={isDragging ? "#ff8800" : isSelected ? "#ffff00" : "#00ff00"}
          emissive={isDragging ? "#ff8800" : isSelected ? "#ffff00" : "#00ff00"}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Waypoint number label */}
      <Html
        position={[
          waypoint.position[0],
          waypoint.position[1] + 0.4,
          waypoint.position[2],
        ]}
        center
      >
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          #{index + 1}
        </div>
      </Html>

      {/* Direction arrow */}
      <arrowHelper
        args={[
          direction,
          position,
          arrowLength,
          isSelected ? "#ffff00" : "#00ff00",
          0.2,
          0.1,
        ]}
      />

      {/* Edit controls for selected waypoint */}
      {isSelected && isEditing && (
        <Html
          position={[
            waypoint.position[0],
            waypoint.position[1] + 1.5,
            waypoint.position[2],
          ]}
          center
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(0,0,0,0.85)",
              padding: "10px",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              minWidth: "120px",
            }}
          >
            <div
              style={{ color: "#888", fontSize: "10px", fontWeight: "bold" }}
            >
              Position
            </div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <span style={{ color: "#888", fontSize: "10px" }}>Y:</span>
              <input
                type="number"
                step="0.1"
                value={waypoint.position[1].toFixed(2)}
                onChange={(e) => {
                  const newPos = [...waypoint.position] as [
                    number,
                    number,
                    number,
                  ];
                  newPos[1] = parseFloat(e.target.value) || 0;
                  updateWaypoint(pathId, waypoint.id, { position: newPos });
                }}
                style={{
                  width: "60px",
                  padding: "2px 4px",
                  fontSize: "11px",
                  background: "#333",
                  color: "white",
                  border: "1px solid #555",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div
              style={{
                color: "#888",
                fontSize: "10px",
                fontWeight: "bold",
                marginTop: "4px",
              }}
            >
              Look At (Camera Direction)
            </div>
            {(["X", "Y", "Z"] as const).map((axis, i) => (
              <div
                key={axis}
                style={{ display: "flex", gap: "4px", alignItems: "center" }}
              >
                <span style={{ color: "#888", fontSize: "10px" }}>{axis}:</span>
                <input
                  type="number"
                  step="0.5"
                  value={waypoint.lookAt[i].toFixed(2)}
                  onChange={(e) => {
                    const newLookAt = [...waypoint.lookAt] as [
                      number,
                      number,
                      number,
                    ];
                    newLookAt[i] = parseFloat(e.target.value) || 0;
                    updateWaypoint(pathId, waypoint.id, { lookAt: newLookAt });
                  }}
                  style={{
                    width: "60px",
                    padding: "2px 4px",
                    fontSize: "11px",
                    background: "#333",
                    color: "white",
                    border: "1px solid #555",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => removeWaypoint(pathId, waypoint.id)}
              style={{
                background: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "11px",
                marginTop: "4px",
              }}
            >
              Delete
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
