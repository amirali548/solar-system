import * as THREE from 'three';
import { createFbm, mulberry32 } from '../utils/noise.js';

const TEXTURE_DEFS = {
  mercury: { url: 'assets/textures/mercury.jpg', fallback: { kind: 'rocky', color: '#9c948a', seed: 11 } },
  venus: { url: 'assets/textures/venus.jpg', fallback: { kind: 'cloudy', color: '#d9bc86', seed: 22 } },
  earth: { url: 'assets/textures/earth.jpg', fallback: { kind: 'earth', seed: 33 } },
  mars: { url: 'assets/textures/mars.jpg', fallback: { kind: 'rocky', color: '#b4552f', seed: 44 } },
  jupiter: { url: 'assets/textures/jupiter.jpg', fallback: { kind: 'gas', color: '#c9a67c', seed: 55 } },
  saturn: { url: 'assets/textures/saturn.jpg', fallback: { kind: 'gas', color: '#d8c08a', seed: 66 } },
  uranus: { url: 'assets/textures/uranus.jpg', fallback: { kind: 'gas', color: '#9ed8e0', seed: 77 } },
  neptune: { url: 'assets/textures/neptune.jpg', fallback: { kind: 'gas', color: '#3c64d8', seed: 88 } },
  sun: { url: 'assets/textures/sun.jpg', fallback: { kind: 'sun', seed: 99 } },
  moon: { url: 'assets/textures/moon.jpg', fallback: { kind: 'rocky', color: '#9a9a9a', seed: 101 } },
  stars: { url: 'assets/textures/stars.jpg', fallback: { kind: 'stars', seed: 202 } },
  saturnRing: { url: 'assets/textures/saturn_ring.png', fallback: { kind: 'ring', seed: 303 } },
  earthClouds: { url: 'assets/textures/earth_clouds.png', fallback: { kind: 'clouds', seed: 404 } },
  earthNormal: { url: 'assets/textures/earth_normal.jpg', color: false, fallback: null },
  earthSpecular: { url: 'assets/textures/earth_specular.jpg', color: false, fallback: null }
};

function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
}

function finish(canvasElement, { color = true, wrapS = THREE.RepeatWrapping, wrapT = THREE.ClampToEdgeWrapping } = {}) {
  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = wrapS;
  texture.wrapT = wrapT;
  texture.needsUpdate = true;
  return texture;
}

function makePlanetFallback(spec, size = 512) {
  const { kind, color = '#888888', seed = 1 } = spec;
  const canvasElement = canvas(size, size / 2);
  const ctx = canvasElement.getContext('2d');
  const fbm = createFbm(seed, 5);
  const base = new THREE.Color(color);
  const image = ctx.createImageData(canvasElement.width, canvasElement.height);
  const data = image.data;

  for (let y = 0; y < canvasElement.height; y += 1) {
    const v = y / canvasElement.height;
    const latitude = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < canvasElement.width; x += 1) {
      const u = x / canvasElement.width;
      const i = (y * canvasElement.width + x) * 4;
      let shade;

      if (kind === 'gas' || kind === 'cloudy' || kind === 'sun') {
        const bands = Math.sin(v * Math.PI * (kind === 'sun' ? 30 : 22) + fbm(u * 8, v * 14) * 3.2);
        shade = 0.78 + bands * 0.16 + fbm(u * 4, v * 26) * 0.12;
        if (kind === 'cloudy') shade = 0.88 + fbm(u * 6, v * 9) * 0.16;
        if (kind === 'sun') shade = 1.05 + fbm(u * 12, v * 12) * 0.28;
      } else if (kind === 'earth') {
        const land = fbm(u * 3.2, v * 4.5) + fbm(u * 7, v * 7) * 0.3;
        shade = 0.9;
        if (land > 0.06) {
          const t = Math.min(1, (land - 0.06) * 3.5);
          base.setRGB(0.08 + 0.22 * t, 0.2 + 0.3 * t, 0.08 + 0.1 * t);
        } else {
          base.setRGB(0.015, 0.11, 0.32);
        }
      } else {
        const craters = fbm(u * 6, v * 6) * 0.7 + fbm(u * 18, v * 18) * 0.3;
        shade = 0.82 + craters * 0.34 - Math.pow(latitude, 2.2) * 0.08;
      }

      const r = Math.min(255, Math.max(0, base.r * 255 * shade));
      const g = Math.min(255, Math.max(0, base.g * 255 * shade));
      const b = Math.min(255, Math.max(0, base.b * 255 * shade));
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finish(canvasElement);
}

function makeStarsFallback(seed = 202) {
  const canvasElement = canvas(2048, 1024);
  const ctx = canvasElement.getContext('2d');
  const random = mulberry32(seed);
  ctx.fillStyle = '#01030a';
  ctx.fillRect(0, 0, 2048, 1024);

  const band = ctx.createLinearGradient(0, 900, 2048, 100);
  band.addColorStop(0, 'rgba(30, 44, 96, 0)');
  band.addColorStop(0.45, 'rgba(70, 86, 140, 0.35)');
  band.addColorStop(0.55, 'rgba(90, 100, 160, 0.3)');
  band.addColorStop(1, 'rgba(30, 44, 96, 0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, 2048, 1024);

  for (let i = 0; i < 7000; i += 1) {
    const x = random() * 2048;
    const y = random() * 1024;
    const radius = random() < 0.985 ? 0.6 : 1.4;
    const alpha = 0.25 + random() * 0.7;
    ctx.fillStyle = `rgba(${200 + random() * 55 | 0}, ${210 + random() * 45 | 0}, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(canvasElement, { wrapT: THREE.ClampToEdgeWrapping });
}

function makeRingFallback() {
  const canvasElement = canvas(1024, 64);
  const ctx = canvasElement.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
  gradient.addColorStop(0, 'rgba(180, 160, 130, 0)');
  gradient.addColorStop(0.08, 'rgba(214, 196, 164, 0.75)');
  gradient.addColorStop(0.24, 'rgba(160, 142, 112, 0.28)');
  gradient.addColorStop(0.4, 'rgba(226, 210, 180, 0.9)');
  gradient.addColorStop(0.62, 'rgba(196, 178, 148, 0.55)');
  gradient.addColorStop(0.7, 'rgba(120, 108, 92, 0.08)');
  gradient.addColorStop(0.78, 'rgba(226, 210, 180, 0.8)');
  gradient.addColorStop(0.94, 'rgba(190, 172, 142, 0.35)');
  gradient.addColorStop(1, 'rgba(160, 145, 120, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 64);
  return finish(canvasElement, { wrapS: THREE.ClampToEdgeWrapping });
}

function makeCloudsFallback(seed = 404) {
  const canvasElement = canvas(1024, 512);
  const ctx = canvasElement.getContext('2d');
  const fbm = createFbm(seed, 5);
  const image = ctx.createImageData(1024, 512);
  const data = image.data;
  for (let y = 0; y < 512; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const nx = x / 1024;
      const ny = y / 512;
      const value = fbm(nx * 7, ny * 7) + fbm(nx * 16, ny * 16) * 0.35;
      const alpha = Math.max(0, Math.min(1, (value - 0.06) * 2.6));
      const i = (y * 1024 + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = alpha * 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finish(canvasElement);
}

function fallbackFor(spec) {
  if (!spec) return null;
  if (spec.kind === 'stars') return makeStarsFallback(spec.seed);
  if (spec.kind === 'ring') return makeRingFallback();
  if (spec.kind === 'clouds') return makeCloudsFallback(spec.seed);
  return makePlanetFallback(spec);
}

/**
 * Loads every texture in parallel. A procedural fallback is generated if a
 * file cannot be fetched so the scene is never left with blank materials.
 */
export function loadTextures(renderer, onProgress = () => {}) {
  const loader = new THREE.TextureLoader();
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const entries = Object.entries(TEXTURE_DEFS);
  const total = entries.length;
  let settled = 0;

  const jobs = entries.map(([key, def]) => new Promise((resolve) => {
    const done = (texture) => {
      settled += 1;
      onProgress(settled / total);
      resolve([key, texture]);
    };

    loader.load(
      def.url,
      (texture) => {
        const isColor = def.color !== false;
        texture.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = maxAnisotropy;
        texture.needsUpdate = true;
        done(texture);
      },
      undefined,
      () => {
        console.warn(`[textures] Falling back to procedural texture for "${key}"`);
        const texture = fallbackFor(def.fallback);
        if (texture) texture.anisotropy = maxAnisotropy;
        done(texture);
      }
    );
  }));

  return Promise.all(jobs).then((pairs) => Object.fromEntries(pairs));
}

/** Soft radial glow used for coronas, galaxies and preview backlights. */
export function makeGlowTexture(stops = [
  [0, 'rgba(255, 255, 255, 1)'],
  [0.25, 'rgba(255, 220, 160, 0.65)'],
  [0.55, 'rgba(255, 150, 70, 0.18)'],
  [1, 'rgba(255, 120, 40, 0)']
], size = 512) {
  const canvasElement = canvas(size, size);
  const ctx = canvasElement.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return finish(canvasElement);
}

export function makeNebulaTexture(seed, palette) {
  const size = 512;
  const canvasElement = canvas(size, size);
  const ctx = canvasElement.getContext('2d');
  const fbm = createFbm(seed, 6);
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const colors = palette.map((hex) => new THREE.Color(hex));

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x / size) * 2 - 1;
      const ny = (y / size) * 2 - 1;
      const radial = Math.sqrt(nx * nx + ny * ny);
      const cloud = fbm(x / size * 4, y / size * 4) * 0.5 + 0.5;
      const detail = fbm(x / size * 11 + 30, y / size * 11 + 30) * 0.5 + 0.5;
      let alpha = Math.max(0, cloud * 1.25 - radial * 0.95 - 0.12) * detail;
      alpha = Math.min(1, alpha * 1.7);
      const t = Math.min(1, Math.max(0, (cloud - 0.25) * 1.8));
      const color = colors[0].clone().lerp(colors[1], t).lerp(colors[2], detail * 0.55);
      const i = (y * size + x) * 4;
      data[i] = color.r * 255;
      data[i + 1] = color.g * 255;
      data[i + 2] = color.b * 255;
      data[i + 3] = alpha * 190;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finish(canvasElement);
}

export function makeGalaxyTexture(seed = 7) {
  const size = 512;
  const canvasElement = canvas(size, size);
  const ctx = canvasElement.getContext('2d');
  const random = mulberry32(seed);
  const center = size / 2;

  ctx.globalCompositeOperation = 'lighter';

  const halo = ctx.createRadialGradient(center, center, 4, center, center, size / 2);
  halo.addColorStop(0, 'rgba(255, 240, 220, 0.55)');
  halo.addColorStop(0.18, 'rgba(180, 196, 255, 0.18)');
  halo.addColorStop(0.6, 'rgba(120, 130, 255, 0.04)');
  halo.addColorStop(1, 'rgba(80, 90, 200, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const arms = 2;
  for (let i = 0; i < 5200; i += 1) {
    const radius = Math.pow(random(), 0.62) * (size * 0.44);
    const arm = Math.floor(random() * arms);
    const theta = (arm / arms) * Math.PI * 2 + radius * 0.035 + (random() - 0.5) * 1.1;
    const spread = 1 - radius / (size * 0.44);
    const x = center + Math.cos(theta) * radius + (random() - 0.5) * 18 * spread;
    const y = center + Math.sin(theta) * radius * 0.42 + (random() - 0.5) * 10 * spread;
    const alpha = 0.06 + random() * 0.4 * (0.35 + spread * 0.65);
    const warm = random() < 0.24;
    ctx.fillStyle = warm
      ? `rgba(255, 226, 190, ${alpha})`
      : `rgba(${170 + random() * 70 | 0}, ${190 + random() * 50 | 0}, 255, ${alpha})`;
    const dot = random() < 0.9 ? 0.7 : 1.5;
    ctx.fillRect(x, y, dot, dot * 0.8);
  }
  return finish(canvasElement);
}
