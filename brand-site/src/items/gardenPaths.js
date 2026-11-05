import { Color, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, SphereGeometry, Vector3 } from 'three';
import { WALKWAYS } from './gardenRabbit.js';
const SOIL_TOP = 0.83;
const PATH_HALF_WIDTH = 0.058;
const PLANT_GROUPS = new Set([
  'Contents containment transform',
  'Rear fern depth group',
  'Upper leaf depth adjustment',
  'Static_Fern rachis',
  'Static_Wet slate',
]);

function nearPath(x, z, width = PATH_HALF_WIDTH) {
  for (const path of WALKWAYS) {
    for (let i = 1; i < path.length; i++) {
      const [ax, az] = path[i - 1];
      const dx = path[i][0] - ax;
      const dz = path[i][1] - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      if (Math.hypot(x - ax - t * dx, z - az - t * dz) < width) return true;
    }
  }
  return false;
}

function trimMoss(mesh) {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const indices = geometry.index;
  const inverse = new Matrix4().copy(mesh.matrixWorld).invert();
  const point = new Vector3();
  const onPath = new Uint8Array(position.count);
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    onPath[i] = nearPath(point.x, point.z);
    point.y = SOIL_TOP + Math.max(0, point.y - SOIL_TOP) * 0.42;
    point.applyMatrix4(inverse);
    position.setXYZ(i, point.x, point.y, point.z);
  }
  const keep = [];
  const count = indices ? indices.count : position.count;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices.getX(i) : i;
    const b = indices ? indices.getX(i + 1) : i + 1;
    const c = indices ? indices.getX(i + 2) : i + 2;
    if (!onPath[a] && !onPath[b] && !onPath[c]) keep.push(a, b, c);
  }
  geometry.setIndex(keep);
  position.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

export function addGardenPaths(model) {
  // Clear space for the loop while keeping the plant rigs together.
  const planting = new Group();
  planting.name = 'Central planting';
  planting.scale.set(0.76, 1, 0.76);
  for (const child of [...model.children]) {
    if (PLANT_GROUPS.has(child.userData.name)) planting.add(child);
  }
  model.add(planting);
  model.updateMatrixWorld(true);
  model.traverse((mesh) => {
    if (mesh.isMesh && mesh.material?.name?.startsWith('Moss tone ')) trimMoss(mesh);
  });

  // Small rounded stones form a continuous mosaic at the junctions.
  const tiles = [];
  const tileWidth = 0.034;
  const tileDepth = 0.030;
  for (let row = -34; row <= 34; row++) {
    const z = row * tileDepth;
    for (let column = -31; column <= 31; column++) {
      const x = (column + (row % 2) * 0.5) * tileWidth + Math.sin(row * 2.7 + column) * 0.003;
      if (Math.hypot(x, z) > 1.04 || !nearPath(x, z, PATH_HALF_WIDTH - 0.016)) continue;
      tiles.push({ x, z, shade: Math.abs(row * 73 + column * 137) % 5 });
    }
  }
  const pavers = new InstancedMesh(
    new SphereGeometry(1, 9, 5),
    new MeshStandardMaterial({ color: 0xffffff, roughness: 0.83 }),
    tiles.length,
  );
  pavers.name = 'Garden path tiles';
  pavers.receiveShadow = true;
  const transform = new Object3D();
  const colors = [0x8a785d, 0xa28e70, 0x9b8164, 0xb39a76, 0x97896f].map(hex => new Color(hex));
  tiles.forEach(({ x, z, shade }, i) => {
    transform.position.set(x, SOIL_TOP + 0.002, z);
    transform.rotation.y = i * 2.4;
    transform.scale.set(0.017 + Math.sin(i) * 0.002, 0.006, 0.014 + Math.cos(i * 1.3) * 0.002);
    transform.updateMatrix();
    pavers.setMatrixAt(i, transform.matrix);
    pavers.setColorAt(i, colors[shade]);
  });
  model.add(pavers);
}
