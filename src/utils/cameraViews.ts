export type Vec3 = [number, number, number];

export interface CameraView {
  position: Vec3;
  target: Vec3;
}

export const getOverviewView = (): CameraView => ({
  position: [0, 1, 6],
  target: [0, 0, 0],
});

export const getCurationView = (): CameraView => ({
  // Tuned for a closer, more focused framing on the central area
  position: [0.5, 1.2, 3.2],
  target: [0.2, 0.4, 0],
});

export const getItemView = (
  position: Vec3,
  forward: Vec3,
  distance = 2,
): CameraView => {
  const [px, py, pz] = position;
  const [fx, fy, fz] = forward;

  const length = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  const nx = fx / length;
  const ny = fy / length;
  const nz = fz / length;

  const cx = px - nx * distance;
  const cy = py - ny * distance;
  const cz = pz - nz * distance;

  return {
    position: [cx, cy, cz],
    target: position,
  };
};
