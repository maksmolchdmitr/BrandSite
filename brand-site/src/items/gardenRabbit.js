import { Group, Mesh, MathUtils, MeshStandardMaterial, SphereGeometry } from 'three';

const RING_STOPS = 24;
const RING_RADIUS = 0.93;
const RABBIT_SCALE = 0.58;

function polarPoint(index, radius) {
  const angle = index * 2 * Math.PI / RING_STOPS;
  return [Math.sin(angle) * radius, Math.cos(angle) * radius];
}

const RING = Array.from({ length: RING_STOPS + 1 }, (_, i) => polarPoint(i, RING_RADIUS));
const HOME = RING[0];
const BYPASSES = [
  { start: 1, end: 5, radius: 0.75 },
  { start: 8, end: 12, radius: 0.75 },
  { start: 14, end: 18, radius: 0.75 },
  { start: 19, end: 23, radius: 0.75 },
].map(({ start, end, radius }) => ({
  start,
  end,
  points: [RING[start], polarPoint(start + 1, radius), polarPoint(end - 1, radius), RING[end]],
}));
export const WALKWAYS = [RING, ...BYPASSES.map(({ points }) => points)];

function alternateLoop(bypasses) {
  const loop = [...RING];
  for (const { start, end, points } of [...bypasses].reverse()) {
    loop.splice(start, end - start + 1, ...points);
  }
  return loop;
}

function hopStops(path) {
  const stops = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const [x, z] = path[i - 1];
    const [nextX, nextZ] = path[i];
    const hops = Math.ceil(Math.hypot(nextX - x, nextZ - z) / 0.26);
    for (let hop = 1; hop <= hops; hop++) {
      const t = hop / hops;
      stops.push([MathUtils.lerp(x, nextX, t), MathUtils.lerp(z, nextZ, t)]);
    }
  }
  return stops;
}

const ROUTES = [
  hopStops(RING),
  hopStops(alternateLoop([BYPASSES[0], BYPASSES[2]])),
  hopStops(alternateLoop([BYPASSES[1], BYPASSES[3]]).reverse()),
];
const SOIL_HEIGHT = 0.84;
const REST_HEADING = 0.22;
const HOP_SECONDS = 0.42;
const TURN_SECONDS = 0.18;

export function createGardenRabbit() {
  const rabbit = new Group();
  rabbit.name = 'Garden rabbit';
  rabbit.position.set(HOME[0], SOIL_HEIGHT, HOME[1]);
  rabbit.rotation.y = REST_HEADING;
  rabbit.scale.setScalar(RABBIT_SCALE);

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

  let routeIndex = -1;
  let routeStart = 2;
  let lastHeading = REST_HEADING;

  function turnToward(heading, progress) {
    const difference = Math.atan2(Math.sin(heading - lastHeading), Math.cos(heading - lastHeading));
    rabbit.rotation.y = lastHeading + difference * MathUtils.smoothstep(progress, 0, 1);
  }

  function move(time) {
    if (time < routeStart) return;
    if (routeIndex === -1) routeIndex = Math.floor(Math.random() * ROUTES.length);
    const route = ROUTES[routeIndex];
    const elapsed = time - routeStart;
    const hopDuration = HOP_SECONDS + TURN_SECONDS;
    const step = Math.floor(elapsed / hopDuration);

    if (step >= route.length - 1) {
      rabbit.position.set(HOME[0], SOIL_HEIGHT, HOME[1]);
      rabbit.scale.y = RABBIT_SCALE;
      const endTurn = (elapsed - (route.length - 1) * hopDuration) / TURN_SECONDS;
      turnToward(REST_HEADING, endTurn);
      if (endTurn >= 1) {
        lastHeading = REST_HEADING;
        // Choose uniformly from the other two routes after each rest.
        routeIndex = (routeIndex + 1 + Math.floor(Math.random() * (ROUTES.length - 1))) % ROUTES.length;
        routeStart = time + 1.3 + Math.random() * 1.1;
      }
      return;
    }

    const [fromX, fromZ] = route[step];
    const [toX, toZ] = route[step + 1];
    const heading = Math.atan2(toX - fromX, toZ - fromZ);
    const hopTime = elapsed - step * hopDuration;
    const progress = MathUtils.clamp((hopTime - TURN_SECONDS) / HOP_SECONDS, 0, 1);
    turnToward(heading, hopTime / TURN_SECONDS);
    if (hopTime >= TURN_SECONDS) lastHeading = heading;

    const lift = Math.sin(Math.PI * progress);
    rabbit.position.set(
      MathUtils.lerp(fromX, toX, progress),
      SOIL_HEIGHT + 0.075 * lift,
      MathUtils.lerp(fromZ, toZ, progress),
    );
    const crouch = Math.sin(Math.PI * Math.min(1, hopTime / TURN_SECONDS));
    rabbit.scale.y = RABBIT_SCALE * (1 - 0.12 * crouch + 0.09 * lift);
  }

  return {
    rabbit,
    animate(time) {
      move(time);
      head.rotation.y = Math.sin(time * 1.05) * 0.13;
      ears[0].rotation.z = 0.22 + Math.sin(time * 2.3) * 0.065;
      ears[1].rotation.z = -0.22 + Math.sin(time * 2.3 + 1.2) * 0.055;
      const blinkTime = Math.abs(time % 4.3 - 3.5);
      const openness = Math.min(1, 0.12 + blinkTime * 12);
      for (const eye of eyes) eye.scale.y = 0.017 * openness;
    },
  };
}
