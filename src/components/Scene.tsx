import { Canvas } from "@react-three/fiber";
import { PathInstances } from "./PathInstances";
import { CameraController } from "./CameraController";
import type { CameraControllerRef } from "./CameraController";
import { CameraPathEditor } from "./CameraPathEditor";
import { useCameraPathsStore } from "../stores/cameraPathsStore";

interface SceneProps {
  isAnimating: boolean;
  isStarted: boolean;
  enableIdleMotion?: boolean;
  cameraControllerRef: React.RefObject<CameraControllerRef | null>;
}

export function Scene({
  isStarted = false,
  isAnimating,
  enableIdleMotion = false,
  cameraControllerRef,
}: SceneProps) {
  const isEditing = useCameraPathsStore((s) => s.isEditing);

  return (
    <Canvas
      camera={{ position: [6, 7, 5], fov: 60 }}
      style={{ background: "#111" }}
      onCreated={({ camera }) => {
        // Ensure deterministic first-frame orientation toward scene content.
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      }}
    >
      <ambientLight intensity={2} />
      {/* <directionalLight position={[10, 5, 10]} intensity={10} /> */}
      {/* <fog attach="fog" args={["#333", 2, 10]} /> */}

      <group position={[0, 0.1, 0]}>
        <PathInstances isStarted={isStarted} />
      </group>

      {/* <Grid args={[100, 100]} sectionColor={"#777"} cellSize={1} /> */}

      {/* Camera path editor - includes clickable ground */}
      {isEditing && <CameraPathEditor />}

      <CameraController
        ref={cameraControllerRef}
        isAnimating={isAnimating}
        enableIdleMotion={enableIdleMotion}
      />
    </Canvas>
  );
}
