import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';

export function createGardenRabbit() {
  const rabbit = new Group();
  rabbit.name = 'Garden rabbit';
  rabbit.position.set(-0.48, 0.72, 0.64);
  rabbit.rotation.y = 0.22;
  rabbit.scale.setScalar(1.35);

  const sphere = new SphereGeometry(1, 20, 14);
  const clay = new MeshStandardMaterial({ color: 0xcc976e, roughness: 0.73 });
  const cream = new MeshStandardMaterial({ color: 0xf4d9b2, roughness: 0.78 });
  const pink = new MeshStandardMaterial({ color: 0xc87e78, roughness: 0.74 });
  const dark = new MeshStandardMaterial({ color: 0x24191b, roughness: 0.28 });

  function oval(parent, material, x, y, z, width, height, depth) {
    const mesh = new Mesh(sphere, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  oval(rabbit, clay, 0, 0.109, -0.018, 0.105, 0.119, 0.091);
  oval(rabbit, cream, 0, 0.098, 0.047, 0.068, 0.081, 0.033);
  oval(rabbit, cream, 0, 0.054, -0.108, 0.042, 0.039, 0.045);
  for (const side of [-1, 1]) {
    oval(rabbit, clay, side * 0.07, 0.047, -0.025, 0.058, 0.045, 0.065);
    oval(rabbit, cream, side * 0.045, 0.025, 0.061, 0.03, 0.025, 0.048);
  }

  const head = new Group();
  head.position.set(0, 0.196, 0.044);
  rabbit.add(head);
  oval(head, clay, 0, 0, 0, 0.096, 0.085, 0.083);
  oval(head, cream, 0, -0.03, 0.061, 0.054, 0.037, 0.039);
  oval(head, pink, 0, -0.01, 0.097, 0.015, 0.01, 0.009);
  const ears = [];
  const eyes = [];

  for (const side of [-1, 1]) {
    eyes.push(oval(head, dark, side * 0.049, 0.014, 0.067, 0.015, 0.017, 0.011));
    const ear = new Group();
    ear.position.set(side * 0.045, 0.057, -0.004);
    ear.rotation.z = -side * 0.22;
    head.add(ear);
    oval(ear, clay, 0, 0.067, 0, 0.027, 0.078, 0.021);
    oval(ear, pink, 0, 0.073, 0.015, 0.016, 0.055, 0.008);
    ears.push(ear);
  }

  return {
    rabbit,
    animate(time) {
      head.rotation.y = Math.sin(time * 1.05) * 0.13;
      ears[0].rotation.z = 0.22 + Math.sin(time * 2.3) * 0.065;
      ears[1].rotation.z = -0.22 + Math.sin(time * 2.3 + 1.2) * 0.055;
      const blinkTime = Math.abs(time % 4.3 - 3.5);
      const openness = Math.min(1, 0.12 + blinkTime * 12);
      for (const eye of eyes) eye.scale.y = 0.017 * openness;
    },
  };
}
