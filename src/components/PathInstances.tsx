import { useMemo } from "react";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";
import { useSvgPath } from "../hooks/useSvgPath";
import { calculateInstanceTransforms } from "../utils/geometryHelpers";

const INSTANCE_COUNT = 1500;
const RECTANGLE_SIZE = { width: 0.08, height: 0.2, depth: 0.001 };
const COLOR_STOPS = [
  // new THREE.Color("#ffffff"), // white
  //new THREE.Color("#ffff00"), // yellow
  new THREE.Color("#d3d3d3"), // light gray
  //new THREE.Color("#ff0000"), // red
  //new THREE.Color("#555555"), // dark gray
];

export function PathInstances() {
  const { curve } = useSvgPath(INSTANCE_COUNT);

  const transforms = useMemo(
    () => calculateInstanceTransforms(curve, INSTANCE_COUNT),
    [curve],
  );

  const instances = useMemo(
    () =>
      transforms.map((transform, i) => {
        const colorIndex = i % COLOR_STOPS.length;
        const color = COLOR_STOPS[colorIndex];
        const scale = new THREE.Vector3(
          0.5 + Math.random() * 1.5,
          0.5 + Math.random() * 0.75,
          1,
        );

        return (
          <Instance
            key={i}
            position={transform.position}
            quaternion={transform.quaternion}
            scale={scale}
            color={color}
          />
        );
      }),
    [transforms],
  );

  return (
    <Instances limit={INSTANCE_COUNT}>
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
