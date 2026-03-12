import { useRef, useState, type CSSProperties } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControlsPathRig, type CameraControlsPathRigRef } from "./CameraControlsPathRig";
import svgFollowPath from "../data/svgFollow.json";
import type { CameraPath } from "../types/cameraPath";

interface CameraControlsTestPageProps {
  onBack: () => void;
}

export function CameraControlsTestPage({ onBack }: CameraControlsTestPageProps) {
  const rigRef = useRef<CameraControlsPathRigRef | null>(null);
  const [debug, setDebug] = useState({
    mode: "followPath",
    progress: 0.2,
    distance: 0,
  });

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: [8, 4, 7], fov: 60 }} style={{ background: "#202025" }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 6, 3]} intensity={1} />
        <gridHelper args={[40, 40, "#666", "#333"]} />
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#2a2a2f" />
        </mesh>

        <mesh position={[0.2, 0.4, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ff8866" />
        </mesh>

        <CameraControlsPathRig
          ref={rigRef}
          path={svgFollowPath as CameraPath}
          startT={0.2}
          scenePose={{ position: [0.5, 1.2, 3.2], target: [0.2, 0.4, 0] }}
          onDebugChange={setDebug}
        />
      </Canvas>

      <div style={overlayStyle}>
        <button
          type="button"
          style={buttonStyle}
          onClick={onBack}
          aria-label="Back to main page"
        >
          BACK TO MAIN
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => rigRef.current?.followPath()}
          aria-label="Resume camera path following"
        >
          FOLLOW PATH
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => rigRef.current?.goToScenePose()}
          aria-label="Transition camera to fixed scene position"
        >
          GO TO SCENE POSE
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => rigRef.current?.backToPath()}
          aria-label="Transition camera back to path following"
        >
          BACK TO PATH
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => rigRef.current?.goToPathPoint(0.65)}
          aria-label="Transition camera to a predefined path point"
        >
          GO TO PATH POINT
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => rigRef.current?.resetStart()}
          aria-label="Reset path following to initial start point"
        >
          RESET START
        </button>

        <div style={debugStyle} aria-live="polite">
          <div>Mode: {debug.mode}</div>
          <div>Path t: {debug.progress.toFixed(3)}</div>
          <div>Distance: {debug.distance.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "absolute",
  top: 16,
  left: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  zIndex: 20,
};

const buttonStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #555",
  background: "#111",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const debugStyle: CSSProperties = {
  marginTop: 8,
  background: "rgba(0,0,0,0.75)",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
  lineHeight: 1.4,
};
