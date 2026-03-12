import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Line } from "@react-three/drei";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import type { CameraPath } from "../types/cameraPath";
import {
  createPathCurvesFromJson,
  lerpPose,
  samplePathPose,
  type CameraPose,
} from "../utils/cameraControlsPath";

type CameraMode = "followPath" | "toScenePose" | "atScenePose" | "backToPath";

interface TransitionState {
  active: boolean;
  elapsed: number;
  duration: number;
  from: CameraPose;
  to: CameraPose;
  nextMode: CameraMode;
}

export interface CameraControlsPathRigRef {
  followPath: () => void;
  goToScenePose: () => void;
  backToPath: () => void;
  goToPathPoint: (t: number) => void;
  resetStart: () => void;
}

interface CameraControlsPathRigProps {
  path: CameraPath;
  startT?: number;
  scenePose?: {
    position: [number, number, number];
    target: [number, number, number];
  };
  onDebugChange?: (debug: {
    mode: CameraMode;
    progress: number;
    distance: number;
  }) => void;
}

export const CameraControlsPathRig = forwardRef<
  CameraControlsPathRigRef,
  CameraControlsPathRigProps
>(function CameraControlsPathRig(
  {
    path,
    startT = 0.2,
    scenePose = { position: [0.5, 1.2, 3.2], target: [0.2, 0.4, 0] },
    onDebugChange,
  },
  ref,
) {
  const { camera } = useThree();
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const currentTargetRef = useRef(new THREE.Vector3());
  const progressRef = useRef(startT);
  const [mode, setMode] = useState<CameraMode>("followPath");
  const transitionRef = useRef<TransitionState | null>(null);

  const curves = useMemo(() => createPathCurvesFromJson(path), [path]);
  const pathLine = useMemo(() => curves.positionCurve.getPoints(300), [curves]);

  const scenePoseVectors = useMemo(
    () => ({
      position: new THREE.Vector3(...scenePose.position),
      target: new THREE.Vector3(...scenePose.target),
    }),
    [scenePose.position, scenePose.target],
  );

  const getCurrentPose = (): CameraPose => {
    const target = new THREE.Vector3();
    if (controlsRef.current?.getTarget) {
      controlsRef.current.getTarget(target);
    } else {
      target.copy(currentTargetRef.current);
    }

    return {
      position: camera.position.clone(),
      target,
    };
  };

  const applyPose = (pose: CameraPose) => {
    if (!controlsRef.current?.setLookAt) return;
    currentTargetRef.current.copy(pose.target);
    controlsRef.current.setLookAt(
      pose.position.x,
      pose.position.y,
      pose.position.z,
      pose.target.x,
      pose.target.y,
      pose.target.z,
      false,
    );
  };

  const startTransition = (
    to: CameraPose,
    nextMode: CameraMode,
    duration = 2,
  ) => {
    transitionRef.current = {
      active: true,
      elapsed: 0,
      duration,
      from: getCurrentPose(),
      to,
      nextMode,
    };
    setMode(nextMode === "atScenePose" ? "toScenePose" : "backToPath");
  };

  const normalizeT = (value: number) => Math.max(0, Math.min(1, value));

  useImperativeHandle(ref, () => ({
    followPath: () => {
      setMode("followPath");
      transitionRef.current = null;
    },
    goToScenePose: () => {
      startTransition(
        {
          position: scenePoseVectors.position.clone(),
          target: scenePoseVectors.target.clone(),
        },
        "atScenePose",
      );
    },
    backToPath: () => {
      const targetPathPose = samplePathPose(curves, progressRef.current);
      startTransition(targetPathPose, "followPath");
    },
    goToPathPoint: (t: number) => {
      const pointT = normalizeT(t);
      const targetPathPose = samplePathPose(curves, pointT);
      transitionRef.current = {
        active: true,
        elapsed: 0,
        duration: 2,
        from: getCurrentPose(),
        to: targetPathPose,
        nextMode: "followPath",
      };
      progressRef.current = pointT;
      setMode("backToPath");
    },
    resetStart: () => {
      progressRef.current = startT;
      const pose = samplePathPose(curves, progressRef.current);
      applyPose(pose);
      setMode("followPath");
      transitionRef.current = null;
    },
  }));

  useFrame((_, delta) => {
    if (mode === "followPath") {
      progressRef.current += curves.speed * delta;
      if (progressRef.current > 1) {
        progressRef.current = curves.loop ? 0 : 1;
      }

      const pose = samplePathPose(curves, progressRef.current);
      applyPose(pose);
    }

    const transition = transitionRef.current;
    if (transition?.active) {
      transition.elapsed += delta;
      const alpha = Math.min(transition.elapsed / transition.duration, 1);
      const pose = lerpPose(transition.from, transition.to, alpha);
      applyPose(pose);

      if (alpha >= 1) {
        transition.active = false;
        transitionRef.current = null;
        setMode(transition.nextMode);
      }
    }

    const distance = camera.position.distanceTo(currentTargetRef.current);
    onDebugChange?.({
      mode,
      progress: progressRef.current,
      distance,
    });
  });

  return (
    <>
      <CameraControls ref={controlsRef} makeDefault />
      <Line points={pathLine} color="#66ccff" lineWidth={1} />
    </>
  );
});
