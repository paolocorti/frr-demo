import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useSvgPath } from "../hooks/useSvgPath";
import { calculateInstanceTransforms } from "../utils/geometryHelpers";
import { useSelectionStore } from "../stores/selectionStore";
import { useVisibleItemsStore } from "../stores/visibleItemsStore";

const RECTANGLE_SIZE = { width: 0.08, height: 0.2, depth: 0.001 };
const COLOR_STOPS = [
  // new THREE.Color("#ffffff"), // white
  //new THREE.Color("#ffff00"), // yellow
  new THREE.Color("#d3d3d3"), // light gray
  //new THREE.Color("#ff0000"), // red
  //new THREE.Color("#555555"), // dark gray
];

export function PathInstances() {
  const [items, setItems] = useState<any[]>([]);
  const selectedIndices = useSelectionStore((s) => s.selectedIndices);
  const setVisibleIds = useVisibleItemsStore((s) => s.setVisibleIds);
  const { camera } = useThree();

  const frustum = useRef(new THREE.Frustum());
  const projScreenMatrix = useRef(new THREE.Matrix4());
  const lastVisibleKey = useRef<string>("");

  // Load JSON data from the public folder
  useEffect(() => {
    let isMounted = true;

    fetch("/data.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        if (isMounted && Array.isArray(data)) {
          setItems(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load data.json", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const instanceCount = useMemo(
    () => Math.max(2, items.length || 0),
    [items.length],
  );

  const { curve } = useSvgPath(instanceCount);

  const transforms = useMemo(
    () => calculateInstanceTransforms(curve, instanceCount),
    [curve, instanceCount],
  );

  // Update list of items roughly inside the camera frustum
  useFrame(() => {
    if (!items.length || !transforms.length) return;

    projScreenMatrix.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    frustum.current.setFromProjectionMatrix(projScreenMatrix.current);

    type Candidate = { id: number; distance: number };
    const candidates: Candidate[] = [];

    for (let i = 0; i < transforms.length; i += 1) {
      const item = items[i];
      if (!item || item.id == null) continue;

      const position = transforms[i].position;
      if (!frustum.current.containsPoint(position)) continue;

      const distance = camera.position.distanceTo(position);
      candidates.push({ id: item.id as number, distance });
    }

    // Fallback: if frustum check failed for some reason, approximate by distance only
    if (!candidates.length) {
      for (let i = 0; i < transforms.length; i += 1) {
        const item = items[i];
        if (!item || item.id == null) continue;
        const position = transforms[i].position;
        const distance = camera.position.distanceTo(position);
        candidates.push({ id: item.id as number, distance });
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    // Only keep a subset (closest to camera) so we never flag all 500
    const MAX_VISIBLE = 40;
    const visibleIds = candidates.slice(0, MAX_VISIBLE).map((c) => c.id);

    const key = visibleIds.join(",");
    if (key !== lastVisibleKey.current) {
      lastVisibleKey.current = key;
      setVisibleIds(visibleIds);
    }
  });

  const instances = useMemo(
    () =>
      transforms.map((transform, i) => {
        const item = items[i];
        const colorIndex = i % COLOR_STOPS.length;
        const baseColor = COLOR_STOPS[colorIndex];
        const isSelected = selectedIndices.includes(i);

        const position = transform.position.clone();
        if (isSelected) {
          position.y += 0.25;
        }

        const scale = new THREE.Vector3(
          0.5 + Math.random() * 1.5,
          0.5 + Math.random() * 0.75,
          1,
        );

        const color = isSelected ? new THREE.Color("#ff0000") : baseColor;

        return (
          <Instance
            key={item?.id ?? i}
            position={position}
            quaternion={transform.quaternion}
            scale={scale}
            color={color}
          >
            <mesh>
              <planeGeometry args={[0.1, 0.1]} />
              <meshStandardMaterial
                color={"white"}
                side={THREE.DoubleSide}
                opacity={0.9}
                transparent
              />
            </mesh>
          </Instance>
        );
      }),
    [items, selectedIndices, transforms],
  );

  return (
    <Instances limit={instanceCount}>
      <boxGeometry
        args={[
          RECTANGLE_SIZE.width,
          RECTANGLE_SIZE.height,
          RECTANGLE_SIZE.depth,
        ]}
      />
      <meshStandardMaterial
        metalness={0.5}
        roughness={0.9}
        opacity={0.9}
        transparent
      />
      {instances}
    </Instances>
  );
}
