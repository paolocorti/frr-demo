import type { CSSProperties } from "react";
import { PathSelector } from "./PathSelector";
import { useCameraPathsStore } from "../stores/cameraPathsStore";
import { useVisibleItemsStore } from "../stores/visibleItemsStore";

interface UIOverlayProps {
  onSearch: () => void;
  onCurationSelected: () => void;
  onItemSelected1: () => void;
  onItemSelected2: () => void;
}

export function UIOverlay({
  onSearch,
  onCurationSelected,
  onItemSelected1,
  onItemSelected2,
}: UIOverlayProps) {
  const isEditing = useCameraPathsStore((s) => s.isEditing);
  const visibleIds = useVisibleItemsStore((s) => s.visibleIds);

  return (
    <div style={overlayStyle}>
      <div style={sectionStyle}>
        <button
          style={buttonStyle}
          type="button"
          onClick={onSearch}
          aria-label="Trigger search camera path"
        >
          SEARCH
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
      </div>

      {/* <div style={sectionStyle}>
        <button style={buttonStyle} onClick={onReset}>
          Reset Camera
        </button>
        <button style={buttonStyle} onClick={onToggleAnimation}>
          {isAnimating ? "Stop Animation" : "Play Animation"}
        </button>
      </div> */}

      <PathSelector isEditing={isEditing} />

      {visibleIds.length > 0 && (
        <div style={visibleListStyle} aria-live="polite">
          <strong>Visible IDs:</strong>{" "}
          <span>{visibleIds.join(", ")}</span>
        </div>
      )}

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
  gap: "8px",
};

const buttonStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: "13px",
  fontWeight: "bold",
  backgroundColor: "#000",
  border: "2px solid #333",
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

const visibleListStyle: CSSProperties = {
  marginTop: "8px",
  padding: "8px 10px",
  background: "rgba(0,0,0,0.65)",
  color: "white",
  borderRadius: "8px",
  fontSize: "11px",
  lineHeight: 1.4,
  maxWidth: "260px",
  wordWrap: "break-word",
};
