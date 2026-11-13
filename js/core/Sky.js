import * as THREE from 'three';
import { makeGalaxyTexture, makeNebulaTexture } from './TextureFactory.js';
import { mulberry32 } from '../utils/noise.js';

const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float twinkle = 0.68 + 0.32 * sin(uTime * 1.4 + aPhase);
    gl_PointSize = aSize * uPixelRatio * (430.0 / -mvPosition.z) * twinkle;
    vTwinkle = twinkle;
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    float core = smoothstep(0.5, 0.0, dist);
    float halo = smoothstep(0.5, 0.12, dist) * 0.22;
    float alpha = (core + halo) * vTwinkle;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export class Sky {
  constructor(scene, textures) {
    this.group = new THREE.Group();
    this.group.name = 'sky';
    this.buildMilkyWay(textures.stars);
    this.buildStars();
    this.buildNebulae();
    this.buildGalaxies();
    scene.add(this.group);
  }

  buildMilkyWay(texture) {
    if (!texture) return;
    const geometry = new THREE.SphereGeometry(2400, 48, 32);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false,
      color: 0xffffff
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.y = 2.2;
    sphere.renderOrder = -10;
    this.group.add(sphere);
  }

  buildStars() {
    const count = 9000;
    const random = mulberry32(9182);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const palette = [
      new THREE.Color('#bcd4ff'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#fff4d6'),
      new THREE.Color('#ffd2a1'),
      new THREE.Color('#9fb8ff')
    ];

    for (let i = 0; i < count; i += 1) {
      const radius = 750 + random() * 1250;
      const theta = random() * Math.PI * 2;
      const cosPhi = random() * 2 - 1;
      const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
      positions[i * 3] = Math.cos(theta) * sinPhi * radius;
      positions[i * 3 + 1] = cosPhi * radius * 0.72;
      positions[i * 3 + 2] = Math.sin(theta) * sinPhi * radius;

      const color = palette[Math.floor(random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      const bright = random();
      sizes[i] = 0.7 + Math.pow(bright, 4.2) * 4.6;
      phases[i] = random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const stars = new THREE.Points(geometry, this.starMaterial);
    stars.frustumCulled = false;
    this.group.add(stars);
    this.stars = stars;
  }

  buildNebulae() {
    const configs = [
      { seed: 12, palette: ['#4b2ec9', '#7f5bff', '#2b6bff'], position: [-1500, 420, -1500], scale: 1650, opacity: 0.5 },
      { seed: 41, palette: ['#1b4bd8', '#3fa9ff', '#142e7a'], position: [1650, -380, -900], scale: 1450, opacity: 0.42 },
      { seed: 77, palette: ['#b23aff', '#ff6ab8', '#3b2a86'], position: [900, 700, -1750], scale: 1250, opacity: 0.3 },
      { seed: 129, palette: ['#0f6e8c', '#39e6ff', '#123a7a'], position: [-1300, -620, 900], scale: 1100, opacity: 0.26 }
    ];

    configs.forEach((config, index) => {
      const texture = makeNebulaTexture(config.seed, config.palette);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: config.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(...config.position);
      sprite.scale.setScalar(config.scale);
      sprite.material.rotation = index * 1.3;
      this.group.add(sprite);
    });
  }

  buildGalaxies() {
    const configs = [
      { seed: 5, position: [1750, 520, 1200], scale: 170, rotation: 0.6, opacity: 0.85 },
      { seed: 9, position: [-1850, -240, -1100], scale: 110, rotation: -1.4, opacity: 0.6 }
    ];
    configs.forEach((config) => {
      const texture = makeGalaxyTexture(config.seed);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: config.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(...config.position);
      sprite.scale.set(config.scale, config.scale * 0.5, 1);
      sprite.material.rotation = config.rotation;
      this.group.add(sprite);
    });
  }

  setPixelRatio(pixelRatio) {
    if (this.starMaterial) {
      this.starMaterial.uniforms.uPixelRatio.value = Math.min(pixelRatio, 2);
    }
  }

  update(dt, elapsed) {
    if (this.starMaterial) this.starMaterial.uniforms.uTime.value = elapsed;
    this.group.rotation.y += dt * 0.0016;
  }
}
