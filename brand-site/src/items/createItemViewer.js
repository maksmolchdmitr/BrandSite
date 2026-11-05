import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clampSpeed, DETENT, pointerDialDelta, speedAfterTurn } from './dialControl.js';
import { createGardenAudio } from './gardenAudio.js';
import { addGardenPaths } from './gardenPaths.js';
import { createGardenRabbit } from './gardenRabbit.js';
import { normalizeClipOrigin } from './modelTime.js';

export function createItemViewer(host, { label, onState, onProgress, onError, onAudioError }) {
  let disposed = false;
  let model;
  let mixer;
  let rabbit;
  let dial;
  let dialRest;
  let dialAxis;
  let dialAngle = 0;
  let drag = null;
  let orbiting = false;
  let frame;
  let lastFrame = performance.now();
  let lastHover = 0;
  const state = { speed: 1, playing: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, soundEnabled: true, volume: 100, dragging: false, ready: false };
  const abort = new AbortController();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
  canvas.style.touchAction = 'none';
  canvas.style.cursor = 'grab';
  host.appendChild(canvas);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf3f7ed, 0x6c705b, 1.8));
  const key = new THREE.DirectionalLight(0xffe1b3, 3.2);
  key.position.set(-3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -3;
  key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0001;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8f4ff, 1.3);
  fill.position.set(4, 3, -2);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 0.9;
  controls.maxDistance = 13;
  controls.minPolarAngle = 0.035;
  controls.maxPolarAngle = Math.PI - 0.035;
  const initialPosition = new THREE.Vector3();
  const initialTarget = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const centerWorld = new THREE.Vector3();
  const worldAxis = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const pickables = [];
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${import.meta.env.BASE_URL}items/draco/`);
  draco.setWorkerLimit(2);
  const loader = new GLTFLoader().setDRACOLoader(draco);

  const effectiveSpeed = () => state.playing ? state.speed : 0;
  const emit = () => { if (!disposed) onState({ ...state }); };
  const audio = createGardenAudio({
    getTime: () => mixer?.time || 0,
    getSpeed: effectiveSpeed,
    onError: () => {
      state.soundEnabled = false;
      emit();
      if (!disposed) onAudioError();
    },
  });

  function resize() {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function setSpeed(value) {
    state.speed = clampSpeed(value);
    if (mixer) mixer.timeScale = effectiveSpeed();
    audio.sync();
    emit();
  }

  function dialCenter() {
    const rect = canvas.getBoundingClientRect();
    const p = dial.getWorldPosition(centerWorld).clone().project(camera);
    return { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2 };
  }

  function hitsDial(event) {
    if (!model || !dial) return false;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    if (!hit) return false;
    let object = hit.object;
    while (object) {
      if (object === dial) return true;
      object = object.parent;
    }
    return false;
  }

  function pointerDown(event) {
    if (event.pointerType === 'mouse') unlockAudio();
    if (drag || event.button !== 0 || !state.ready || !hitsDial(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    controls.enabled = false;
    // Stop any camera damping inherited from an earlier orbit before grabbing the knob.
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;
    const point = { x: event.clientX, y: event.clientY };
    dial.getWorldQuaternion(quaternion);
    worldAxis.copy(dialAxis).applyQuaternion(quaternion);
    const center = dialCenter();
    const facing = worldAxis.dot(camera.position.clone().sub(dial.getWorldPosition(centerWorld)));
    drag = { id: event.pointerId, point, center, mode: Math.hypot(point.x - center.x, point.y - center.y) < 12 ? 'linear' : 'angular', sign: facing >= 0 ? -1 : 1 };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'ew-resize';
    state.dragging = true;
    emit();
  }

  function pointerMove(event) {
    if (drag && event.pointerId === drag.id) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const point = { x: event.clientX, y: event.clientY };
      const delta = THREE.MathUtils.clamp(pointerDialDelta(drag.point, point, drag.center, drag.mode), -0.4, 0.4);
      drag.point = point;
      const speed = speedAfterTurn(state.speed, delta);
      if (speed === state.speed) return;
      const oldDetent = Math.floor(dialAngle / DETENT);
      dialAngle += (speed - state.speed) * Math.PI / 1.5 * drag.sign;
      if (oldDetent !== Math.floor(dialAngle / DETENT)) audio.click(delta);
      state.playing = true;
      setSpeed(speed);
      return;
    }
    if (!orbiting && performance.now() - lastHover > 45) {
      lastHover = performance.now();
      canvas.style.cursor = hitsDial(event) ? 'ew-resize' : 'grab';
    }
  }

  function endDrag(event) {
    if (!drag || (event?.pointerId != null && event.pointerId !== drag.id)) return;
    const id = drag.id;
    drag = null;
    state.dragging = false;
    controls.enabled = true;
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    emit();
  }

  function orbitStart() { orbiting = true; canvas.style.cursor = 'grabbing'; }
  function orbitEnd() { orbiting = false; if (!drag) canvas.style.cursor = 'grab'; }
  controls.addEventListener('start', orbitStart);
  controls.addEventListener('end', orbitEnd);
  function unlockAudio() {
    if (state.ready && state.soundEnabled) void audio.activate();
  }
  document.addEventListener('pointerup', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  canvas.addEventListener('pointerdown', pointerDown, true);
  canvas.addEventListener('pointermove', pointerMove, true);
  canvas.addEventListener('pointerup', endDrag, true);
  canvas.addEventListener('pointercancel', endDrag, true);
  canvas.addEventListener('lostpointercapture', endDrag);
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  function tick(now) {
    if (disposed) return;
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    mixer?.update(delta);
    if (rabbit) rabbit.animate(mixer.time);
    // The scene clip may contain static transforms. Apply the user-controlled pose last.
    if (dial && dialRest) dial.quaternion.copy(dialRest).multiply(quaternion.setFromAxisAngle(dialAxis, dialAngle));
    controls.update(delta);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }

  function visibilityChanged() {
    endDrag();
    cancelAnimationFrame(frame);
    audio.setActive(!document.hidden);
    if (!document.hidden && !disposed) { lastFrame = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function contextLost(event) {
    event.preventDefault();
    if (!disposed) { cancelAnimationFrame(frame); audio.setActive(false); onError(); }
  }
  document.addEventListener('visibilitychange', visibilityChanged);
  canvas.addEventListener('webglcontextlost', contextLost);
  resize();
  frame = requestAnimationFrame(tick);

  function disposeModel(root) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    root.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
      object.skeleton?.dispose();
    });
    for (const texture of textures) { texture.dispose(); texture.image?.close?.(); }
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
  }

  return {
    async load(url) {
      try {
        const response = await fetch(url, { signal: abort.signal });
        if (!response.ok) throw new Error(`Model ${response.status}`);
        const total = Number(response.headers.get('content-length'));
        let buffer;
        if (response.body && total > 0) {
          const reader = response.body.getReader();
          const chunks = [];
          let loaded = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value); loaded += value.byteLength;
            if (!disposed) onProgress(Math.min(95, Math.round(loaded / total * 95)));
          }
          const bytes = new Uint8Array(loaded);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
          buffer = bytes.buffer;
        } else buffer = await response.arrayBuffer();
        const gltf = await loader.parseAsync(buffer, url.slice(0, url.lastIndexOf('/') + 1));
        if (disposed) { disposeModel(gltf.scene); return; }
        model = gltf.scene;
        scene.add(model);
        dial = model.getObjectByName('WeatherDial');
        const axis = model.getObjectByName('WeatherDialAxis');
        if (!dial || !axis) throw new Error('Dial missing from model');
        dialRest = dial.quaternion.clone();
        dialAxis = axis.position.clone().normalize();
        model.traverse((object) => {
          if (!object.isMesh) return;
          const shell = object.userData.glassShell || object.material?.name === 'Web capsule glass';
          object.castShadow = !shell;
          object.receiveShadow = !shell;
          if (shell) {
            object.material.depthWrite = false;
            object.material.side = THREE.FrontSide;
            object.renderOrder = 2;
          } else pickables.push(object);
        });
        addGardenPaths(model);
        rabbit = createGardenRabbit(() => audio.land());
        model.add(rabbit.rabbit);
        mixer = new THREE.AnimationMixer(model);
        // Scene exports can use absolute frame times. Normalise the common origin once.
        for (const clip of gltf.animations) {
          normalizeClipOrigin(clip);
          mixer.clipAction(clip).play();
        }
        mixer.timeScale = effectiveSpeed();
        mixer.update(0);
        scene.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        floor.position.y = bounds.min.y - 0.004;
        initialTarget.copy(center);
        const distance = Math.max(size.y, size.x / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(35 / 2))) * 1.16;
        initialPosition.copy(center).add(new THREE.Vector3(0.10, 0.15, 1).normalize().multiplyScalar(distance));
        camera.position.copy(initialPosition);
        controls.target.copy(initialTarget);
        controls.update();
        state.ready = true;
        audio.setEnabled(state.soundEnabled);
        onProgress(100);
        emit();
      } catch (error) {
        if (!disposed && error.name !== 'AbortError') onError();
      }
    },
    setPlaying(value) {
      state.playing = value;
      if (mixer) mixer.timeScale = effectiveSpeed();
      audio.sync();
      emit();
    },
    setVolume(percent) {
      if (!Number.isFinite(percent)) return;
      state.volume = THREE.MathUtils.clamp(percent, 0, 100);
      audio.setVolume(state.volume / 100);
      emit();
    },
    toggleSound() {
      state.soundEnabled = !state.soundEnabled;
      audio.setEnabled(state.soundEnabled);
      emit();
    },
    resetView() {
      endDrag();
      camera.position.copy(initialPosition);
      controls.target.copy(initialTarget);
      controls.update();
    },
    dispose() {
      if (disposed) return;
      endDrag();
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      document.removeEventListener('pointerup', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      canvas.removeEventListener('pointerdown', pointerDown, true);
      canvas.removeEventListener('pointermove', pointerMove, true);
      canvas.removeEventListener('pointerup', endDrag, true);
      canvas.removeEventListener('pointercancel', endDrag, true);
      canvas.removeEventListener('lostpointercapture', endDrag);
      controls.removeEventListener('start', orbitStart);
      controls.removeEventListener('end', orbitEnd);
      controls.dispose();
      audio.dispose();
      draco.dispose();
      if (mixer) { mixer.stopAllAction(); mixer.uncacheRoot(model); }
      if (model) { scene.remove(model); disposeModel(model); }
      floor.geometry.dispose(); floor.material.dispose();
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
