import { Canvas } from "@react-three/fiber";
import { PathInstances } from "./PathInstances";
import { CameraController } from "./CameraController";
import type { CameraControllerRef } from "./CameraController";
import { Grid } from "@react-three/drei";
import { CameraPathEditor } from "./CameraPathEditor";
import { useCameraPathsStore } from "../stores/cameraPathsStore";

interface SceneProps {
  isAnimating: boolean;
  cameraControllerRef: React.RefObject<CameraControllerRef | null>;
}

export function Scene({ isAnimating, cameraControllerRef }: SceneProps) {
  const isEditing = useCameraPathsStore((s) => s.isEditing);

  return (
    <Canvas
      camera={{ position: [8, 4, 7], fov: 60 }}
      style={{ background: "#333" }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[0, 5, 10]} intensity={1} />
      <fog attach="fog" args={["#333", 5, 30]} />

      <group position={[0, 0.1, 0]}>
        <PathInstances />
      </group>

      {/* <Grid args={[100, 100]} sectionColor={"#777"} cellSize={1} /> */}

      {/* Camera path editor - includes clickable ground */}
      {isEditing && <CameraPathEditor />}

      <CameraController ref={cameraControllerRef} isAnimating={isAnimating} />
    </Canvas>
  );
}
