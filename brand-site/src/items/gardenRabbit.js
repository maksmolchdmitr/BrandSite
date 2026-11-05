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
const GROOMING = [
  // Wash the muzzle, rub the cheek, or scratch behind the ear.
  { duration: 1.05, paw: 0.12, pawSide: 1, pawStrokes: 3, pitch: 0.44, duck: 0.047, squint: 0.86 },
  { duration: 1.25, paw: 0.14, pawSide: 0, pawStrokes: 2, pitch: 0.27, roll: 0.28, duck: 0.041, squint: 0.75 },
  { duration: 1.15, paw: 0.16, pawSide: 1, pawStrokes: 4, roll: -0.36, duck: 0.04, fold: 0.29, twitch: 0.22 },
];
const randomBetween = (min, max) => MathUtils.lerp(min, max, Math.random());
const PET_REACTIONS = [
  // Lift the chin and close both eyes.
  { duration: 0.95, pitch: -0.38, roll: 0, yaw: 0, fold: 0.25, twitch: 0, squint: 0.94 },
  // Tilt the head and lean into the stroke.
  { duration: 1.15, pitch: -0.14, roll: 0.4, yaw: 0.23, fold: 0.1, twitch: 0, squint: 0.82 },
  // Duck and flick the ears twice.
  { duration: 0.85, pitch: 0.22, roll: -0.13, yaw: -0.1, fold: 0.12, twitch: 0.34, squint: 0.58 },
  // Give two quick nods.
  { duration: 1.05, nod: 0.46, squint: 0.65 },
  // Rub the cheek gently from side to side.
  { duration: 1.35, shake: 0.52, roll: -0.26, squint: 0.96 },
  // Perk up one ear, then the other.
  { duration: 1.05, perk: 0.26, yaw: 0.18 },
  // Tuck the chin and flatten both ears.
  { duration: 1.3, pitch: 0.37, fold: 0.62, duck: 0.031, squint: 0.89 },
  // Stretch the nose forward and sniff.
  { duration: 1.1, pitch: -0.22, reach: 0.034, sniff: 0.14 },
  // Lift one front paw.
  { duration: 1.2, paw: 0.055, roll: 0.16, yaw: -0.25, squint: 0.45 },
  // Sway the head from one shoulder to the other.
  { duration: 1.4, sway: 0.64, pitch: -0.1, fold: 0.17, squint: 0.92 },
];

export function createGardenRabbit(onLand = () => {}) {
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
  const frontPaws = [];
  for (const side of [-1, 1]) {
    oval(rabbit, clay, side * 0.07, 0.047, -0.025, 0.058, 0.045, 0.065);
    frontPaws.push(oval(rabbit, cream, side * 0.045, 0.025, 0.061, 0.03, 0.025, 0.048));
  }

  const head = new Group();
  head.position.set(0, 0.196, 0.044);
  const headRest = head.position.clone();
  const pawRest = frontPaws[0].position.clone();
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
  let step = 0;
  let stepStart = 2;
  let hopDuration = 0;
  let turnDuration = 0;
  let hopHeight = 0;
  let fastHops = 0;
  let hopsToGroom = Math.floor(randomBetween(4, 10));
  let lastHeading = REST_HEADING;
  let walkTime = 0;
  let nextLanding = 0;
  let stopAt = Infinity;
  let petRest = 0;
  let petHeld = false;
  let petPending = false;
  const remainingReactions = [];
  let reactionIndex = -1;
  let reaction;
  let reactionTime = 0;
  let groomingLeft = 0;
  let lastGroom = -1;
  let idleTime = 0;

  function planHop() {
    if (!fastHops && Math.random() < 0.25) fastHops = Math.floor(randomBetween(2, 5));
    turnDuration = fastHops ? randomBetween(0.09, 0.16) : randomBetween(0.16, 0.3);
    hopDuration = fastHops ? randomBetween(0.22, 0.34) : randomBetween(0.35, 0.56);
    hopHeight = randomBetween(0.035, 0.075);
    fastHops = Math.max(0, fastHops - 1);
  }

  function beginGroom() {
    lastGroom = lastGroom < 0
      ? Math.floor(Math.random() * GROOMING.length)
      : (lastGroom + 1 + Math.floor(Math.random() * (GROOMING.length - 1))) % GROOMING.length;
    reaction = { ...GROOMING[lastGroom], pawStrokes: Math.floor(randomBetween(2, 6)) };
    reactionTime = 0;
    groomingLeft--;
  }

  function move(time) {
    nextLanding = 0;
    if (time < stepStart) return;
    if (routeIndex < 0) {
      routeIndex = Math.floor(Math.random() * ROUTES.length);
      planHop();
    }

    let route = ROUTES[routeIndex];
    let landing = stepStart + turnDuration + hopDuration;
    if (time >= landing) {
      const [x, z] = route[++step];
      rabbit.position.set(x, SOIL_HEIGHT, z);
      rabbit.scale.y = RABBIT_SCALE;
      lastHeading = rabbit.rotation.y;
      onLand();
      stepStart = landing;
      if (step === route.length - 1) {
        step = 0;
        routeIndex = (routeIndex + 1 + Math.floor(Math.random() * (ROUTES.length - 1))) % ROUTES.length;
        stepStart += randomBetween(0.65, 1.9);
      }
      planHop();
      if (--hopsToGroom === 0) {
        hopsToGroom = Math.floor(randomBetween(4, 13));
        if (stopAt === Infinity) {
          groomingLeft = Math.floor(randomBetween(1, 5));
          walkTime = landing;
          beginGroom();
          return;
        }
      }
      if (time < stepStart) return;
      route = ROUTES[routeIndex];
      landing = stepStart + turnDuration + hopDuration;
    }

    const [fromX, fromZ] = route[step];
    const [toX, toZ] = route[step + 1];
    const heading = Math.atan2(toX - fromX, toZ - fromZ);
    const hopTime = time - stepStart;
    const difference = Math.atan2(Math.sin(heading - lastHeading), Math.cos(heading - lastHeading));
    rabbit.rotation.y = lastHeading + difference * MathUtils.smoothstep(hopTime, 0, turnDuration);
    const progress = MathUtils.clamp((hopTime - turnDuration) / hopDuration, 0, 1);
    nextLanding = progress > 0 && progress < 1 ? landing : 0;
    const lift = Math.sin(Math.PI * progress);
    rabbit.position.set(
      MathUtils.lerp(fromX, toX, progress),
      SOIL_HEIGHT + hopHeight * lift,
      MathUtils.lerp(fromZ, toZ, progress),
    );
    const crouch = Math.sin(Math.PI * Math.min(1, hopTime / turnDuration));
    rabbit.scale.y = RABBIT_SCALE * (1 - 0.12 * crouch + 0.09 * lift);
  }

  function beginPet() {
    if (!remainingReactions.length) {
      for (const index of PET_REACTIONS.keys()) remainingReactions.push(index);
      // Draw the first reaction of a new round from the other nine.
      const previous = reactionIndex < 0 ? [] : remainingReactions.splice(reactionIndex, 1);
      const choice = Math.floor(Math.random() * remainingReactions.length);
      [reactionIndex] = remainingReactions.splice(choice, 1);
      remainingReactions.push(...previous);
    } else {
      const choice = Math.floor(Math.random() * remainingReactions.length);
      [reactionIndex] = remainingReactions.splice(choice, 1);
    }
    reaction = PET_REACTIONS[reactionIndex];
    reactionTime = 0;
    groomingLeft = 0;
    petRest = 5;
  }

  return {
    rabbit,
    setHeld(held) { petHeld = held; },
    pet(canWalk) {
      if (stopAt !== Infinity || reactionTime < (reaction?.duration ?? 0)) {
        petPending = true;
      } else if (petRest === 0 && canWalk && nextLanding) {
        stopAt = nextLanding;
      } else {
        petPending = false;
        beginPet();
      }
    },
    animate(delta, speed) {
      if (reaction && reactionTime < reaction.duration) {
        const reactionSpeed = reaction.pawStrokes && !petPending ? speed : 1;
        reactionTime = Math.min(reaction.duration, reactionTime + delta * reactionSpeed);
      } else if (petPending && stopAt === Infinity) {
        petPending = false;
        beginPet();
      } else if (petRest > 0) {
        if (!petHeld) petRest = Math.max(0, petRest - delta);
      } else if (groomingLeft > 0) {
        if (speed > 0) beginGroom();
      } else if (speed > 0 || stopAt !== Infinity) {
        walkTime = Math.min(stopAt, walkTime + delta * speed);
        move(walkTime);
        if (walkTime === stopAt || (stopAt !== Infinity && speed === 0)) {
          stopAt = Infinity;
          beginPet();
        }
      }

      idleTime += delta * speed;
      const current = reaction;
      const phase = current ? reactionTime / current.duration : 1;
      const ease = current && phase < 1 ? Math.sin(Math.PI * phase) ** 2 : 0;
      const twitch = ease * (current?.twitch ?? 0) * Math.sin(4 * Math.PI * phase);
      const wave = Math.sin(2 * Math.PI * phase);
      const nod = Math.sin(2 * Math.PI * phase) ** 2;
      head.rotation.x = ease * ((current?.pitch ?? 0) + nod * (current?.nod ?? 0)
        + Math.sin(8 * Math.PI * phase) * (current?.sniff ?? 0));
      head.rotation.z = ease * ((current?.roll ?? 0) + wave * (current?.sway ?? 0));
      head.rotation.y = Math.sin(idleTime * 1.05) * 0.13
        + ease * ((current?.yaw ?? 0) + wave * (current?.shake ?? 0));
      head.position.y = headRest.y - ease * (current?.duck ?? 0);
      head.position.z = headRest.z + ease * (current?.reach ?? 0);
      const pawStroke = current?.pawStrokes ? 0.68 + 0.32 * Math.cos(2 * Math.PI * phase * current.pawStrokes) : 1;
      frontPaws.forEach((paw, side) => {
        const lift = side === (current?.pawSide ?? 1) ? ease * pawStroke * (current?.paw ?? 0) : 0;
        paw.position.y = pawRest.y + lift;
        paw.position.z = pawRest.z + lift * 0.18;
      });
      const fold = ease * (current?.fold ?? 0);
      const perk = ease * wave * (current?.perk ?? 0);
      ears[0].rotation.z = 0.22 + Math.sin(idleTime * 2.3) * 0.065 + fold + twitch - Math.max(0, perk);
      ears[1].rotation.z = -0.22 + Math.sin(idleTime * 2.3 + 1.2) * 0.055 - fold + twitch * 0.5 - Math.min(0, perk);
      const blinkTime = Math.abs(idleTime % 4.3 - 3.5);
      const openness = Math.min(1, 0.12 + blinkTime * 12) * (1 - ease * (current?.squint ?? 0));
      for (const eye of eyes) eye.scale.y = 0.017 * openness;
    },
  };
}
