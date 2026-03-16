import * as THREE from 'three';

export interface InstanceTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export function calculateInstanceTransforms(
  curve: THREE.CatmullRomCurve3,
  count: number
): InstanceTransform[] {
  if (count <= 0) {
    return [];
  }

  const transforms: InstanceTransform[] = [];
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const position = curve.getPoint(t);
    const tangent = curve.getTangent(t);

    // Calculate rotation to align with path tangent
    // Rectangles should stand up (Y-up) and follow the path in the XZ plane
    dummy.position.copy(position);

    // Get the tangent in XZ plane (ignore Y component)
    const tangentXZ = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();

    // Calculate angle to rotate around Y axis
    const angle = Math.atan2(tangentXZ.x, tangentXZ.z);

    // Set rotation: standing up, rotated to follow path direction
    dummy.rotation.set(0, angle, 0);

    transforms.push({
      position: position.clone(),
      quaternion: dummy.quaternion.clone(),
      scale: new THREE.Vector3(1, 1, 1)
    });
  }

  return transforms;
}

export function setInstancedMeshTransforms(
  mesh: THREE.InstancedMesh,
  transforms: InstanceTransform[]
): void {
  const matrix = new THREE.Matrix4();

  transforms.forEach((transform, index) => {
    matrix.compose(
      transform.position,
      transform.quaternion,
      transform.scale
    );
    mesh.setMatrixAt(index, matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
}
