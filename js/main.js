import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { loadTextures } from './core/TextureFactory.js';
import { Sky } from './core/Sky.js';
import { SolarSystem } from './core/SolarSystem.js';
import { CameraDirector } from './core/CameraDirector.js';
import { PlanetPreview } from './ui/PlanetPreview.js';
import { UIController } from './ui/UIController.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function isMobileWidth() {
  return window.innerWidth <= 760;
}

function computeLayoutScale() {
  if (window.innerWidth <= 760) return 0.8;
  if (window.innerWidth <= 1100) return 0.9;
  return 1;
}

function computeFov() {
  return isMobileWidth() ? 58 : 46;
}

async function boot() {
  const container = document.getElementById('scene');

  const callbacks = {
    onSelect: (id) => selectBody(id),
    onClose: () => closeBody(),
    onTogglePause: () => togglePause(),
    onSpeedChange: (value) => setSpeed(value),
    onToggleOrbits: () => toggleOrbits(),
    onReset: () => resetView(),
    onStartExploring: () => {}
  };

  const ui = new UIController(callbacks);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false
    });
  } catch (error) {
    console.error('[boot] WebGL unavailable', error);
    ui.showFatal('WebGL could not be initialised in this browser. Enable hardware acceleration or try another browser.');
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobileWidth() ? 1.6 : 1.85);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.setAttribute('aria-label', '3D solar system viewport');
  renderer.domElement.tabIndex = 0;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(computeFov(), width / height, 0.05, 7000);
  camera.position.set(0, 240, 560);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 6;
  controls.maxDistance = 900;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI - 0.12;
  controls.autoRotateSpeed = 0.16;
  controls.target.set(0, 0, 0);
  controls.update();

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    isMobileWidth() ? 0.46 : 0.62,
    0.55,
    0.82
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let system = null;
  let sky = null;
  let director = null;
  let preview = null;
  let speed = 1;
  let paused = false;
  let orbitsVisible = true;
  let hoverId = null;
  let lastInteraction = performance.now();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerClient = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let pointerInside = false;
  let pointerType = 'mouse';
  let dragStart = null;
  let dragging = false;
  const focusWorld = new THREE.Vector3();

  const loadingMessages = (ratio) => {
    if (ratio < 0.35) return 'ACQUIRING PLANETARY TEXTURES';
    if (ratio < 0.68) return 'MAPPING SURFACE DETAIL';
    if (ratio < 0.9) return 'RESOLVING ATMOSPHERES';
    return 'ALIGNING OPTICAL SYSTEMS';
  };

  ui.setLoading(0.03, 'ACQUIRING PLANETARY TEXTURES');

  let textures;
  try {
    textures = await loadTextures(renderer, (ratio) => {
      ui.setLoading(0.04 + ratio * 0.88, loadingMessages(ratio));
    });
  } catch (error) {
    console.error('[boot] texture pipeline failed', error);
    ui.showFatal('The planetary texture pipeline failed to start. Please reload the page.');
    return;
  }

  ui.setLoading(0.94, 'CALIBRATING ORBITAL MECHANICS');
  await nextFrame();

  sky = new Sky(scene, textures);
  system = new SolarSystem(scene, textures);
  system.setLayoutScale(computeLayoutScale());
  system.setOrbitsVisible(orbitsVisible);

  preview = new PlanetPreview(document.getElementById('preview-canvas'), textures);
  director = new CameraDirector(camera, controls, system);
  director.onStateChange = (state) => {
    if (state === 'overview') lastInteraction = performance.now();
  };

  window.orbital = { scene, camera, renderer, controls, system, director, ui, preview };

  function pick(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(system.getRaycastTargets(), false);
    return hits.length ? hits[0].object.userData.bodyId : null;
  }

  function selectBody(id) {
    if (!system) return;
    const body = system.getBody(id);
    if (!body) return;
    ui.hideHero();
    ui.hideTooltip();
    hoverId = null;
    system.setHovered(null);
    document.body.classList.remove('is-hovering-planet');
    system.setFocus(id);
    director.focusOn(id);
    ui.openBody(body, preview);
    lastInteraction = performance.now();
  }

  function closeBody() {
    if (!ui.panelOpen) return;
    ui.closePanel();
    if (preview) preview.hide();
    if (system) system.clearFocus();
    if (director) director.returnToOverview();
    lastInteraction = performance.now();
  }

  function togglePause() {
    paused = !paused;
    ui.setPaused(paused);
  }

  function setSpeed(value) {
    speed = value;
    if (paused && value > 0) {
      paused = false;
      ui.setPaused(false);
    }
  }

  function toggleOrbits() {
    orbitsVisible = !orbitsVisible;
    system.setOrbitsVisible(orbitsVisible);
    ui.setOrbitsVisible(orbitsVisible);
  }

  function resetView() {
    ui.hideHero();
    ui.closePanel();
    if (preview) preview.hide();
    system.clearFocus();
    director.returnToOverview(1.8);
    lastInteraction = performance.now();
  }

  function markInteraction() {
    lastInteraction = performance.now();
    controls.autoRotate = false;
  }

  renderer.domElement.addEventListener('pointerdown', (event) => {
    markInteraction();
    ui.hideHero();
    if (event.button !== undefined && event.button !== 0) return;
    pointerType = event.pointerType || 'mouse';
    dragStart = { x: event.clientX, y: event.clientY, distance: 0 };
    dragging = false;
  });

  renderer.domElement.addEventListener('pointermove', (event) => {
    pointerInside = true;
    pointerClient.x = event.clientX;
    pointerClient.y = event.clientY;
    pointerType = event.pointerType || 'mouse';

    if (dragStart) {
      dragStart.distance = Math.max(dragStart.distance, Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y));
      if (dragStart.distance > 6 && !dragging) {
        dragging = true;
        document.body.classList.add('is-dragging');
        ui.hideTooltip();
      }
    }

    if (pointerType === 'mouse' && hoverId) {
      ui.moveTooltip(event.clientX, event.clientY);
    }
  });

  const endPointer = (event) => {
    const wasDragging = dragging;
    const distance = dragStart ? dragStart.distance : 0;
    dragStart = null;
    dragging = false;
    document.body.classList.remove('is-dragging');

    if (!wasDragging && distance < 7 && event.button !== 2) {
      const id = pick(event.clientX, event.clientY);
      if (id) selectBody(id);
    }
  };

  renderer.domElement.addEventListener('pointerup', endPointer);
  renderer.domElement.addEventListener('pointercancel', () => {
    dragStart = null;
    dragging = false;
    document.body.classList.remove('is-dragging');
  });

  renderer.domElement.addEventListener('pointerleave', () => {
    pointerInside = false;
    if (hoverId) {
      hoverId = null;
      system.setHovered(null);
      ui.hideTooltip();
      document.body.classList.remove('is-hovering-planet');
    }
  });

  renderer.domElement.addEventListener('wheel', markInteraction, { passive: true });
  controls.addEventListener('start', markInteraction);

  document.addEventListener('pointerdown', () => ui.hideHero(), { passive: true });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.code === 'Escape') closeBody();
    else if (event.code === 'Space') {
      event.preventDefault();
      togglePause();
    } else if (event.key === 'o' || event.key === 'O') toggleOrbits();
    else if (event.key === 'r' || event.key === 'R') resetView();
  });

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => window.setTimeout(handleResize, 220));

  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobileWidth() ? 1.6 : 1.85);

    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);

    camera.aspect = w / h;
    camera.fov = computeFov();
    camera.updateProjectionMatrix();

    bloom.strength = isMobileWidth() ? 0.46 : 0.62;
    sky.setPixelRatio(dpr);
    system.setLayoutScale(computeLayoutScale());
    director.handleResize();
  }

  function updateHover() {
    if (ui.panelOpen || !system || dragging || pointerType !== 'mouse' || !pointerInside) {
      if (hoverId) {
        hoverId = null;
        system.setHovered(null);
        ui.hideTooltip();
        document.body.classList.remove('is-hovering-planet');
      }
      return;
    }

    const id = pick(pointerClient.x, pointerClient.y);
    if (id !== hoverId) {
      hoverId = id;
      system.setHovered(id);
      document.body.classList.toggle('is-hovering-planet', Boolean(id));
      if (id) {
        const body = system.getBody(id);
        ui.showTooltip(body.data, pointerClient.x, pointerClient.y);
      } else {
        ui.hideTooltip();
      }
    }
  }

  const clock = new THREE.Clock();
  let elapsed = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    if (system) {
      const simDt = paused ? 0 : dt * speed;
      system.update(dt, simDt, elapsed);
    }
    if (sky) sky.update(dt, elapsed);
    if (director) director.update(dt);

    if (director && director.state === 'overview' && performance.now() - lastInteraction > 9000) {
      controls.autoRotate = true;
    } else if (director && director.state !== 'overview') {
      controls.autoRotate = false;
    }

    if (!director || director.state !== 'flying') controls.update();

    updateHover();

    if (system && director && ui.panelOpen && director.focusId) {
      const body = system.getBody(director.focusId);
      if (body) {
        system.getWorldPosition(director.focusId, focusWorld);
        const tagRadius = body.radius * (body.data.hasRings ? 2.05 : 1);
        ui.updateFocusTag(focusWorld, tagRadius, camera, true);
      }
    }

    composer.render();

    if (preview && ui.panelOpen) preview.render(dt);
  }

  handleResize();
  ui.setActiveSpeed(speed);
  ui.setPaused(false);
  ui.setOrbitsVisible(true);

  ui.setLoading(1, 'SYSTEM READY');
  await new Promise((resolve) => window.setTimeout(resolve, 520));

  if (prefersReducedMotion) {
    const overview = director.computeOverviewPosition();
    camera.position.copy(overview);
    controls.target.set(0, 0, 0);
    controls.enabled = true;
    controls.update();
    director.setState('overview');
  } else {
    director.startIntro();
  }

  ui.hideLoader();
  animate();
}

boot().catch((error) => {
  console.error('[boot] fatal error', error);
  const fatal = document.getElementById('fatal');
  const message = document.getElementById('fatal-message');
  if (fatal) fatal.hidden = false;
  if (message) message.textContent = `The orrery failed to start: ${error.message}`;
});
