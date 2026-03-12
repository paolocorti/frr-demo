import { useState, useCallback, useRef, useEffect } from "react";
import { Scene } from "./components/Scene";
import { UIOverlay } from "./components/UIOverlay";
import { ItemsCardStrip } from "./components/ItemsCardStrip";
import { CameraControlsTestPage } from "./components/CameraControlsTestPage";
import type { CameraControllerRef } from "./components/CameraController";
import { useSelectionStore } from "./stores/selectionStore";
import { useCameraPathsStore } from "./stores/cameraPathsStore";
import { getCurationView } from "./utils/cameraViews";
import { useDataItems } from "./hooks/useDataItems";
import "./App.css";

const CURATION_IDS = [
  11283, 11292, 11294, 11297, 11301, 11303, 11304, 11307, 11309, 11311, 11312,
  11314, 11315, 11316, 11318, 11320, 11323, 11324, 11326, 11328, 11333, 11334,
  11335, 11336, 11337, 11338, 11339, 11340, 11344, 11346, 11354, 11356,
];

function App() {
  const [page, setPage] = useState<"main" | "cameraControlsTest">("main");
  const [isAnimating, setIsAnimating] = useState(true);
  const cameraControllerRef = useRef<CameraControllerRef | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const items = useDataItems();
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const selectedIndices = useSelectionStore((s) => s.selectedIndices);
  const setCurationSelection = useSelectionStore((s) => s.setCurationSelection);
  //const isEditing = useCameraPathsStore((s) => s.isEditing);
  // const setEditing = useCameraPathsStore((s) => s.setEditing);
  const setZoomTarget = useCameraPathsStore((s) => s.setZoomTarget);
  const setLookAheadBias = useCameraPathsStore((s) => s.setLookAheadBias);
  const setSpeedMultiplier = useCameraPathsStore((s) => s.setSpeedMultiplier);

  useEffect(() => {
    // Align initial camera with the path-defined starting pose.
    // Retry for a few frames in case the controller ref is not ready yet.
    let rafId = 0;
    let attempts = 0;
    const maxAttempts = 20;

    const tryReset = () => {
      attempts += 1;
      if (cameraControllerRef.current) {
        cameraControllerRef.current.reset();
        return;
      }
      if (attempts < maxAttempts) {
        rafId = window.requestAnimationFrame(tryReset);
      }
    };

    rafId = window.requestAnimationFrame(tryReset);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (resumeTimerRef.current != null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(() => {
    clearSelection();
    // Zoom out along the current active path
    setZoomTarget(1);
    setLookAheadBias(0);
    setSpeedMultiplier(2.5);
    cameraControllerRef.current?.setItemOrientationMode(false);
    // Restart animation from beginning
    setIsAnimating(true);
    cameraControllerRef.current?.reset();
  }, [clearSelection, setLookAheadBias, setSpeedMultiplier, setZoomTarget]);

  const handleCurationSelected = useCallback(() => {
    setIsAnimating(false);
    setCurationSelection(CURATION_IDS, items);
    // Move to a precise curated camera view and zoom level
    setZoomTarget(0.2);
    setLookAheadBias(0);
    setSpeedMultiplier(1);
    cameraControllerRef.current?.setItemOrientationMode(false);
    const view = getCurationView();
    if (!cameraControllerRef.current) return;
    // Smoothly transition from current camera position to the curated view
    cameraControllerRef.current.startTransition(view.position, view.target, 2);
  }, [
    items,
    setCurationSelection,
    setLookAheadBias,
    setSpeedMultiplier,
    setZoomTarget,
  ]);

  const handleItemSelected = useCallback(
    (index: number) => {
      const selectedIndex = selectedIndices[index] ?? selectedIndices[0];
      if (selectedIndex == null) return;
      clearSelection();
      if (items.length < 2 || !cameraControllerRef.current) return;

      const normalizedIndex = Math.max(
        0,
        Math.min(items.length - 1, selectedIndex),
      );
      const t = normalizedIndex / (items.length - 1);

      setIsAnimating(false);
      setZoomTarget(0);
      // In item-follow mode, bias target toward movement direction
      setLookAheadBias(0.75);
      setSpeedMultiplier(1);
      cameraControllerRef.current.setItemOrientationMode(true);
      const started = cameraControllerRef.current.startTransitionToPathProgress(
        t,
        1.3,
      );
      if (!started) return;

      if (resumeTimerRef.current != null) {
        window.clearTimeout(resumeTimerRef.current);
      }
      resumeTimerRef.current = window.setTimeout(() => {
        setIsAnimating(true);
      }, 1300);
    },
    [
      clearSelection,
      items.length,
      selectedIndices,
      setLookAheadBias,
      setSpeedMultiplier,
      setZoomTarget,
    ],
  );

  // const handleToggleEditing = useCallback(() => {
  //   // When entering edit mode, stop the camera animation
  //   if (!isEditing) {
  //     setIsAnimating(false);
  //   }
  //   setEditing(!isEditing);
  // }, [isEditing, setEditing]);

  if (page === "cameraControlsTest") {
    return <CameraControlsTestPage onBack={() => setPage("main")} />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* <button
        type="button"
        onClick={() => setPage("cameraControlsTest")}
        aria-label="Open CameraControls test page"
        aria-pressed={false}
        style={testPageButtonStyle}
      >
        CAMERA CONTROLS TEST
      </button> */}

      <Scene
        isAnimating={isAnimating}
        cameraControllerRef={cameraControllerRef}
      />
      <UIOverlay
        onSearch={handleSearch}
        onCurationSelected={handleCurationSelected}
        onItemSelected1={() => handleItemSelected(0)}
        onItemSelected2={() => handleItemSelected(1)}
        onItemSelected3={() => handleItemSelected(2)}
        onItemSelected4={() => handleItemSelected(3)}
        onItemSelected5={() => handleItemSelected(4)}
        onItemSelected6={() => handleItemSelected(5)}
        //onToggleEditing={handleToggleEditing}
      />
      <ItemsCardStrip />
    </div>
  );
}

export default App;
