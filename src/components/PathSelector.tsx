import { useCameraPathsStore, useActivePath } from "../stores/cameraPathsStore";
import type { CSSProperties } from "react";

export function PathSelector({ isEditing }: { isEditing: boolean }) {
  const paths = useCameraPathsStore((s) => s.paths);
  const activePathId = useCameraPathsStore((s) => s.activePathId);
  const setActivePath = useCameraPathsStore((s) => s.setActivePath);
  const addPath = useCameraPathsStore((s) => s.addPath);
  const removePath = useCameraPathsStore((s) => s.removePath);
  const updatePath = useCameraPathsStore((s) => s.updatePath);
  const activePath = useActivePath();

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <select
          value={activePathId || ""}
          onChange={(e) => setActivePath(e.target.value || null)}
          style={selectStyle}
        >
          <option value="">Select a path...</option>
          {paths.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.waypoints.length} waypoints)
            </option>
          ))}
        </select>
      </div>

      {isEditing && (
        <div style={rowStyle}>
          <button style={buttonStyle} onClick={() => addPath()}>
            + New Path
          </button>
          {activePathId && (
            <button
              style={{ ...buttonStyle, background: "#ff4444" }}
              onClick={() => removePath(activePathId)}
            >
              Delete
            </button>
          )}
        </div>
      )}

      {activePath && isEditing && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Name:</label>
            <input
              type="text"
              value={activePath.name}
              onChange={(e) =>
                updatePath(activePath.id, { name: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Speed:</label>
            <input
              type="range"
              min="0.005"
              max="0.1"
              step="0.005"
              value={activePath.speed}
              onChange={(e) =>
                updatePath(activePath.id, { speed: parseFloat(e.target.value) })
              }
              style={{ flex: 1 }}
            />
            <span style={{ ...labelStyle, minWidth: "40px" }}>
              {activePath.speed.toFixed(3)}
            </span>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Loop:</label>
            <input
              type="checkbox"
              checked={activePath.loop}
              onChange={(e) =>
                updatePath(activePath.id, { loop: e.target.checked })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "10px",
  background: "rgba(0,0,0,0.7)",
  borderRadius: "8px",
  minWidth: "200px",
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const selectStyle: CSSProperties = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #333",
  background: "#222",
  color: "white",
};

const buttonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "4px",
  border: "none",
  background: "#4CAF50",
  color: "black",
  cursor: "pointer",
  fontSize: "12px",
};

const labelStyle: CSSProperties = {
  color: "white",
  fontSize: "12px",
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  borderRadius: "4px",
  border: "1px solid #333",
  background: "#222",
  color: "white",
  fontSize: "12px",
};
