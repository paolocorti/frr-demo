import type { CSSProperties } from "react";
import { useCameraPathsStore } from "../stores/cameraPathsStore";

interface UIOverlayProps {
  onStart: () => void;
  onSearch: () => void;
  onCurationSelected: () => void;
  onItemSelected1: () => void;
  onItemSelected2: () => void;
  onItemSelected3: () => void;
  onItemSelected4: () => void;
  onItemSelected5: () => void;
  onItemSelected6: () => void;
}

export function UIOverlay({
  onStart,
  onSearch,
  onCurationSelected,
  onItemSelected1,
  onItemSelected2,
  onItemSelected3,
  onItemSelected4,
  onItemSelected5,
  onItemSelected6,
}: UIOverlayProps) {
  const isEditing = useCameraPathsStore((s) => s.isEditing);
  // const visibleIds = useVisibleItemsStore((s) => s.visibleIds);
  // const activePath = useActivePath();

  // const handleExportPath = () => {
  //   if (!activePath) return;

  //   const data = {
  //     id: activePath.id,
  //     name: activePath.name,
  //     speed: activePath.speed,
  //     loop: activePath.loop,
  //     waypoints: activePath.waypoints,
  //   };

  //   const json = JSON.stringify(data, null, 2);
  //   const blob = new Blob([json], { type: "application/json" });
  //   const url = URL.createObjectURL(blob);

  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `${activePath.name || "camera-path"}.json`;
  //   a.click();

  //   URL.revokeObjectURL(url);
  // };

  return (
    <div style={overlayStyle}>
      <div style={sectionStyle}>
        <button
          style={buttonStyle}
          type="button"
          onClick={onStart}
          aria-label="Trigger search camera path"
        >
          START
        </button>
        <button
          style={buttonStyle}
          type="button"
          onClick={onSearch}
          aria-label="Trigger search camera path"
        >
          SEARCH START
        </button>
        <button
          style={buttonStyle}
          type="button"
          onClick={onCurationSelected}
          aria-label="Show curation selection"
        >
          CURATION SELECTED
        </button>
      </div>

      <div style={sectionStyle}>
        <button
          style={buttonStyle}
          type="button"
          onClick={onItemSelected1}
          aria-label="Focus camera on first selected item"
        >
          ITEM SELECTED
        </button>
        <button
          style={buttonStyle}
          type="button"
          onClick={onItemSelected2}
          aria-label="Focus camera on second selected item"
        >
          ITEM SELECTED 2
        </button>
        <button
          style={buttonStyle}
          type="button"
          onClick={onItemSelected3}
          aria-label="Focus camera on third selected item"
        >
          ITEM SELECTED 3
        </button>
        <button
          style={buttonStyle}
          type="button"
          onClick={onItemSelected4}
          aria-label="Focus camera on fourth selected item"
        >
          ITEM SELECTED 4
        </button>
        <button
          style={buttonStyle}
          type="button"
          onClick={onItemSelected5}
          aria-label="Focus camera on fifth selected item"
        >
          ITEM SELECTED 5
        </button>
        <button
          style={buttonStyle}
          type="button"
          onClick={onItemSelected6}
          aria-label="Focus camera on sixth selected item"
        >
          ITEM SELECTED 6
        </button>
      </div>

      <div style={sectionStyle}>
        {/* <button
          style={buttonStyle}
          type="button"
          onClick={onToggleEditing}
          aria-pressed={isEditing}
          aria-label={
            isEditing
              ? "Exit camera path editing mode"
              : "Enter camera path editing mode"
          }
        >
          {isEditing ? "DONE EDITING PATH" : "EDIT CAMERA PATH"}
        </button> */}
        {/* <button
          style={buttonStyle}
          type="button"
          onClick={handleExportPath}
          disabled={!activePath}
          aria-label="Export current camera path as JSON"
        >
          EXPORT CAMERA PATH JSON
        </button> */}
      </div>
      {/*
      <div style={sectionStyle}>
        <button style={buttonStyle} onClick={onReset}>
          Reset Camera
        </button>
        <button style={buttonStyle} onClick={onToggleAnimation}>
          {isAnimating ? "Stop Animation" : "Play Animation"}
        </button>
      </div>  */}

      {/* <PathSelector isEditing={isEditing} /> */}
      {/* 
      {visibleIds.length > 0 && (
        <div style={visibleListStyle} aria-live="polite">
          <strong>Visible IDs:</strong> <span>{visibleIds.join(", ")}</span>
        </div>
      )} */}

      {isEditing && (
        <div style={instructionsStyle}>
          <strong>Instructions:</strong>
          <br />
          • Click on the grid to add waypoints
          <br />
          • Click a waypoint to select it
          <br />
          • Drag to move selected waypoint
          <br />• Green arrows show look direction
        </div>
      )}
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "absolute",
  top: "20px",
  left: "20px",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const buttonStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: "13px",
  fontWeight: "bold",
  backgroundColor: "#000",
  border: "2px solid #333",
  color: "white",
  borderRadius: "8px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
};

const instructionsStyle: CSSProperties = {
  background: "rgba(0,0,0,0.7)",
  color: "white",
  padding: "10px",
  borderRadius: "8px",
  fontSize: "12px",
  lineHeight: "1.5",
  maxWidth: "200px",
};
