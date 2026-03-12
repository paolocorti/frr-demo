import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Instances, Instance, Billboard } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useSvgPath } from "../hooks/useSvgPath";
import { calculateInstanceTransforms } from "../utils/geometryHelpers";
import { useSelectionStore } from "../stores/selectionStore";
import { useVisibleItemsStore } from "../stores/visibleItemsStore";
import { useDataItems } from "../hooks/useDataItems";
import { Text } from "@react-three/drei";

const RECTANGLE_SIZE = { width: 0.2, height: 0.2, depth: 0.001 };
const MIN_DEPTH_SCALE = 1;
const MAX_DEPTH_SCALE = 8;
const MEDIA_COUNT_FOR_MAX_DEPTH = 8;
const FLAG_SIZE: [number, number, number] = [0.04, 0.2, 0.001];
const LEFT_FLAG_LOCAL_OFFSET = new THREE.Vector3(-0.105, 0, 0.0);
const RIGHT_FLAG_LOCAL_OFFSET = new THREE.Vector3(0.105, 0, 0.0);

const colorType = {
  Issues: new THREE.Color("#8B153D"),
  Articles: new THREE.Color("#8B153D"),
  Publications: new THREE.Color("#8B153D"),
  Photographies: new THREE.Color("#F0EDE7"),
  Video: new THREE.Color("#F0EDE7"),
  Documents: new THREE.Color("#F0EDE7"),
  Audio: new THREE.Color("#F0EDE7"),
  Correspondences: new THREE.Color("#C9CAD4"),
  Drawings: new THREE.Color("#C9CAD4"),
  People: new THREE.Color("#BB0F33"),
  Companies: new THREE.Color("#BB0F33"),
  Events: new THREE.Color("#BB0F33"),
  Places: new THREE.Color("#BB0F33"),
  "Archival Units": new THREE.Color("#FFF200"),
  Files: new THREE.Color("#FFF200"),
  Objects: new THREE.Color("#FFF200"),
  "Signature Features": new THREE.Color("#ED1C24"),
  Models: new THREE.Color("#ED1C24"),
  Prototypes: new THREE.Color("#ED1C24"),
  "Sport car": new THREE.Color("#ED1C24"),
  Engines: new THREE.Color("#ED1C24"),
  SingleSeater: new THREE.Color("#ED1C24"),
  Meccanica: new THREE.Color("#ED1C24"),
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mapMediaCountToDepthScale(mediaCount: number): number {
  const normalized = clamp(mediaCount / MEDIA_COUNT_FOR_MAX_DEPTH, 0, 1);
  return MIN_DEPTH_SCALE + normalized * (MAX_DEPTH_SCALE - MIN_DEPTH_SCALE);
}

const COLOR_STOPS = [
  // new THREE.Color("#ffffff"), // white
  //new THREE.Color("#ffff00"), // yellow
  new THREE.Color("#d3d3d3"), // light gray
  //new THREE.Color("#ff0000"), // red
  //new THREE.Color("#555555"), // dark gray
];

type InstanceLayerData = {
  key: number | string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  scaleSideFlag: THREE.Vector3;
  color: THREE.Color;
  flagColor: THREE.Color;
  leftFlagPosition: THREE.Vector3;
  rightFlagPosition: THREE.Vector3;
};

type YearStartMarkerData = {
  key: string;
  year: string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  color: THREE.Color;
};

export function PathInstances() {
  const items = useDataItems();
  const selectedIndices = useSelectionStore((s) => s.selectedIndices);
  const setVisibleIds = useVisibleItemsStore((s) => s.setVisibleIds);
  const { camera } = useThree();

  const frustum = useRef(new THREE.Frustum());
  const projScreenMatrix = useRef(new THREE.Matrix4());
  const lastVisibleKey = useRef<string>("");

  const instanceCount = useMemo(
    () => Math.max(2, items.length || 0),
    [items.length],
  );

  const { curve } = useSvgPath();

  const transforms = useMemo(
    () => calculateInstanceTransforms(curve, instanceCount),
    [curve, instanceCount],
  );

  // Update list of items roughly inside the camera frustum
  const MAX_VISIBLE = 15;
  const MAX_DISTANCE = 10; // world units from camera

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
      if (distance > MAX_DISTANCE) continue;
      candidates.push({ id: item.id as number, distance });
    }

    // Fallback: if frustum check failed for some reason, approximate by distance only
    if (!candidates.length) {
      for (let i = 0; i < transforms.length; i += 1) {
        const item = items[i];
        if (!item || item.id == null) continue;
        const position = transforms[i].position;
        const distance = camera.position.distanceTo(position);
        if (distance <= MAX_DISTANCE) {
          candidates.push({ id: item.id as number, distance });
        }
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    // Only keep a subset (closest to camera) so we never flag all 500
    const visibleIds = candidates.slice(0, MAX_VISIBLE).map((c) => c.id);

    const key = visibleIds.join(",");
    if (key !== lastVisibleKey.current) {
      lastVisibleKey.current = key;
      setVisibleIds(visibleIds);
    }
  });

  const selectedIndexSet = useMemo(
    () => new Set(selectedIndices),
    [selectedIndices],
  );

  const instances = useMemo<InstanceLayerData[]>(
    () =>
      transforms.map((transform, i) => {
        const item = items[i];
        const colorIndex = i % COLOR_STOPS.length;
        const baseColor = COLOR_STOPS[colorIndex];
        const isSelected = selectedIndexSet.has(i);

        const position = transform.position.clone();
        if (isSelected) {
          position.y += 0.25;
        }

        const mediaCount = item?.media?.length ?? 0;
        const depthScale = mapMediaCountToDepthScale(mediaCount);
        const hasMedia = mediaCount > 0;

        let sizeWidth = 0;
        let sizeHeight = 0;

        if (hasMedia) {
          const media = item?.media?.[0];
          const mediaSize = (media as { size?: [number?, number?] } | undefined)
            ?.size;
          const mediaWidth = mediaSize?.[0] ?? 0;
          const mediaHeight = mediaSize?.[1] ?? 0;
          const aspectRatio =
            mediaWidth > 0 && mediaHeight > 0 ? mediaHeight / mediaWidth : 1;

          sizeWidth = 1;
          sizeHeight = aspectRatio;
        }

        const scale = hasMedia
          ? new THREE.Vector3(sizeWidth, sizeHeight, depthScale)
          : new THREE.Vector3(1, 0.5, depthScale);

        const scaleSideFlag = hasMedia
          ? new THREE.Vector3(0.2, sizeHeight, depthScale)
          : new THREE.Vector3(0.2, 0.5, depthScale);

        const color = isSelected ? baseColor : baseColor;
        const itemType = (item as { type?: keyof typeof colorType } | undefined)
          ?.type;
        const flagColor =
          (itemType ? colorType[itemType] : undefined) ??
          new THREE.Color("#ffffff");

        const leftFlagPosition = position
          .clone()
          .add(
            LEFT_FLAG_LOCAL_OFFSET.clone().applyQuaternion(
              transform.quaternion,
            ),
          );
        const rightFlagPosition = position
          .clone()
          .add(
            RIGHT_FLAG_LOCAL_OFFSET.clone().applyQuaternion(
              transform.quaternion,
            ),
          );

        return {
          key: item?.id ?? i,
          position,
          quaternion: transform.quaternion,
          scale,
          scaleSideFlag,
          color,
          flagColor,
          leftFlagPosition,
          rightFlagPosition,
        };
      }),
    [items, selectedIndexSet, transforms],
  );

  const yearStartMarkers = useMemo<YearStartMarkerData[]>(() => {
    const markers: YearStartMarkerData[] = [];
    let previousYear: number | null = null;
    const markerOffset = new THREE.Vector3(0, 0.32, 0);

    const count = Math.min(items.length, transforms.length);
    for (let i = 0; i < count; i += 1) {
      const item = items[i];
      const year = Number.parseInt(item?.year ?? "", 10);
      if (!Number.isFinite(year)) continue;

      // The first item of each year marks a new year boundary.
      if (year === previousYear) continue;
      previousYear = year;

      const transform = transforms[i];
      markers.push({
        key: `${year}-${item?.id ?? i}`,
        year: String(year),
        position: transform.position.clone().add(markerOffset),
        quaternion: transform.quaternion.clone(),
        scale: new THREE.Vector3(0.2, 0.2, 0.2),
        color: new THREE.Color("#00e5ff"),
      });
    }

    return markers;
  }, [items, transforms]);

  return (
    <>
      <Instances limit={instanceCount} frustumCulled={false}>
        <boxGeometry
          args={[
            RECTANGLE_SIZE.width,
            RECTANGLE_SIZE.height,
            RECTANGLE_SIZE.depth,
          ]}
        />
        <meshStandardMaterial color={"#5C5754"} side={THREE.DoubleSide} />
        {instances.map((instance) => (
          <Instance
            key={`main-${instance.key}`}
            position={instance.position}
            quaternion={instance.quaternion}
            scale={instance.scale}
            color={instance.color}
          />
        ))}
      </Instances>

      <Instances limit={instanceCount} frustumCulled={false}>
        <boxGeometry args={FLAG_SIZE} />
        <meshStandardMaterial color={"#ffffff"} side={THREE.DoubleSide} />
        {instances.map((instance) => (
          <Instance
            key={`left-flag-${instance.key}`}
            position={instance.leftFlagPosition}
            quaternion={instance.quaternion}
            color={instance.flagColor}
            scale={instance.scaleSideFlag}
          />
        ))}
      </Instances>

      <Instances limit={instanceCount} frustumCulled={false}>
        <boxGeometry args={FLAG_SIZE} />
        <meshStandardMaterial color={"#ffffff"} side={THREE.DoubleSide} />
        {instances.map((instance) => (
          <Instance
            key={`right-flag-${instance.key}`}
            position={instance.rightFlagPosition}
            quaternion={instance.quaternion}
            color={instance.flagColor}
            scale={instance.scaleSideFlag}
          />
        ))}
      </Instances>

      {yearStartMarkers.map((marker) => (
        <Billboard
          key={`year-label-${marker.key}`}
          position={[
            marker.position.x,
            marker.position.y - 0.12,
            marker.position.z,
          ]}
        >
          <Text
            fontSize={0.03}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.0035}
            outlineColor="#111111"
          >
            {marker.year}
          </Text>
        </Billboard>
      ))}
    </>
  );
}
