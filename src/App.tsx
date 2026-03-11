import { useState, useCallback, useRef } from "react";
import { Scene } from "./components/Scene";
import { UIOverlay } from "./components/UIOverlay";
import { ItemsCardStrip } from "./components/ItemsCardStrip";
import type { CameraControllerRef } from "./components/CameraController";
import { useSelectionStore } from "./stores/selectionStore";
import { useCameraPathsStore } from "./stores/cameraPathsStore";
import { getOverviewView } from "./utils/cameraViews";
import "./App.css";

function App() {
  const [isAnimating, setIsAnimating] = useState(true);
  const cameraControllerRef = useRef<CameraControllerRef | null>(null);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const setCurationSelection = useSelectionStore((s) => s.setCurationSelection);
  const isEditing = useCameraPathsStore((s) => s.isEditing);
  const setEditing = useCameraPathsStore((s) => s.setEditing);
  const paths = useCameraPathsStore((s) => s.paths);
  const setActivePath = useCameraPathsStore((s) => s.setActivePath);
  const addSvgPathWithLessZoom = useCameraPathsStore(
    (s) => s.addSvgPathWithLessZoom,
  );
  const CURATION_INDICES = [10, 25, 40, 55, 70, 85, 100, 115];

  const handleSearch = useCallback(() => {
    clearSelection();
    const lessZoomPath = paths.find((p) => p.name === "SVG Less Zoom");
    if (lessZoomPath) {
      setActivePath(lessZoomPath.id);
    } else {
      addSvgPathWithLessZoom();
    }
    // Restart animation from beginning with the SVG less-zoom path
    setIsAnimating(true);
    cameraControllerRef.current?.reset();
  }, [addSvgPathWithLessZoom, clearSelection, paths, setActivePath]);

  const handleCurationSelected = useCallback(() => {
    setIsAnimating(false);
    setCurationSelection(CURATION_INDICES);
    const view = getOverviewView();
    if (!cameraControllerRef.current) return;
    // Smoothly transition from current camera position to the overview view
    cameraControllerRef.current.startTransition(view.position, view.target, 2);
  }, [CURATION_INDICES, setCurationSelection]);

  const handleItemSelected = useCallback(
    (index: number) => {
      setIsAnimating(false);
      const baseIndex = CURATION_INDICES[index];
      if (baseIndex == null) return;
    },
    [CURATION_INDICES],
  );

  const handleToggleEditing = useCallback(() => {
    // When entering edit mode, stop the camera animation
    if (!isEditing) {
      setIsAnimating(false);
    }
    setEditing(!isEditing);
  }, [isEditing, setEditing]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Scene
        isAnimating={isAnimating}
        cameraControllerRef={cameraControllerRef}
      />
      <UIOverlay
        onSearch={handleSearch}
        onCurationSelected={handleCurationSelected}
        onItemSelected1={() => handleItemSelected(0)}
        onItemSelected2={() => handleItemSelected(1)}
        onToggleEditing={handleToggleEditing}
      />
      <ItemsCardStrip />
    </div>
  );
}

export default App;
