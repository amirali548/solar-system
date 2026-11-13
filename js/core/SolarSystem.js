import * as THREE from 'three';
import { PLANETS, SUN } from '../data/planets.js';
import { makeGlowTexture } from './TextureFactory.js';
import { mulberry32 } from '../utils/noise.js';

const ORBIT_SEGMENTS = 320;
const DEG = Math.PI / 180;
const FOCUS_LINE_COLOR = new THREE.Color(0x8fbcff);

const MOON_SYSTEMS = {
  earth: [{ name: 'Moon', radius: 0.42, distance: 3.6, speed: 0.55, texture: 'moon' }],
  mars: [
    { name: 'Phobos', radius: 0.14, distance: 2.4, speed: 1.5, color: 0x8c7b6d },
    { name: 'Deimos', radius: 0.11, distance: 3.2, speed: 0.9, color: 0x9c8d7e }
  ],
  jupiter: [
    { name: 'Io', radius: 0.26, distance: 7.6, speed: 0.62, color: 0xd4c36a },
    { name: 'Europa', radius: 0.23, distance: 8.9, speed: 0.46, color: 0xd9d2c0 },
    { name: 'Ganymede', radius: 0.34, distance: 10.3, speed: 0.33, color: 0xa89c8c },
    { name: 'Callisto', radius: 0.31, distance: 11.9, speed: 0.24, color: 0x7d7268 }
  ],
  saturn: [{ name: 'Titan', radius: 0.3, distance: 7.6, speed: 0.5, color: 0xd2a15e }],
  neptune: [{ name: 'Triton', radius: 0.2, distance: 4.5, speed: 0.5, color: 0xbfc4c9 }]
};

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDirW;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDirW = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormalW;
  varying vec3 vViewDirW;

  void main() {
    float rim = 1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDirW)), 0.0, 1.0);
    rim = pow(rim, uPower);
    gl_FragColor = vec4(uColor * rim * uIntensity, rim * uIntensity);
  }
`;

function createAtmosphere(radius, color, intensity = 0.6, scale = 1.03, power = 3.6) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power }
    },
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * scale, 48, 32), material);
  return mesh;
}

export class SolarSystem {
  constructor(scene, textures) {
    this.scene = scene;
    this.textures = textures;
    this.group = new THREE.Group();
    this.group.name = 'solar-system';
    scene.add(this.group);

    this.bodies = new Map();
    this.hitTargets = [];
    this.orbitGroup = new THREE.Group();
    this.orbitGroup.name = 'orbits';
    this.group.add(this.orbitGroup);

    this.layoutScale = 1;
    this.selectedId = null;
    this.hoveredId = null;

    this.beltGroup = new THREE.Group();
    this.group.add(this.beltGroup);

    this.createSun();
    this.createPlanets();
    this.createAsteroidBelt();
    this.createKuiperBelt();
    this.createLighting();
  }

  createLighting() {
    this.sunLight = new THREE.PointLight(0xfff1dc, 4.2, 0, 0.26);
    this.sunLight.position.set(0, 0, 0);
    this.group.add(this.sunLight);

    this.ambient = new THREE.AmbientLight(0x3f4a63, 0.32);
    this.scene.add(this.ambient);

    this.fill = new THREE.HemisphereLight(0x9db6e0, 0x141a28, 0.62);
    this.scene.add(this.fill);
  }

  createSun() {
    const group = new THREE.Group();
    group.name = 'sun';

    const material = new THREE.MeshBasicMaterial({
      map: this.textures.sun,
      toneMapped: false,
      color: 0xfff8ec
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius, 64, 48), material);
    mesh.rotation.y = 1.2;
    group.add(mesh);

    const glowTexture = makeGlowTexture([
      [0, 'rgba(255, 250, 240, 1)'],
      [0.18, 'rgba(255, 226, 178, 0.72)'],
      [0.42, 'rgba(255, 168, 90, 0.24)'],
      [0.72, 'rgba(255, 130, 60, 0.06)'],
      [1, 'rgba(255, 110, 40, 0)']
    ]);
    const innerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffddb0,
      transparent: true,
      opacity: 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    innerGlow.scale.setScalar(SUN.radius * 3.2);
    group.add(innerGlow);

    const outerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffa45c,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    outerGlow.scale.setScalar(SUN.radius * 7);
    group.add(outerGlow);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(SUN.radius * 1.1, 16, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hit.userData.bodyId = 'sun';
    group.add(hit);
    this.hitTargets.push(hit);

    this.group.add(group);

    this.sun = {
      data: SUN,
      group,
      mesh,
      radius: SUN.radius,
      glows: [innerGlow, outerGlow],
      hit,
      texture: this.textures.sun,
      isSun: true
    };
    this.bodies.set('sun', this.sun);
  }

  createPlanets() {
    const random = mulberry32(4421);

    PLANETS.forEach((data, index) => {
      const container = new THREE.Group();
      container.name = data.id;
      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.z = data.axialTilt * DEG;
      container.add(tiltGroup);

      const params = { map: this.textures[data.id], roughness: 0.95, metalness: 0.0 };
      let material;
      if (data.id === 'earth') {
        material = new THREE.MeshPhongMaterial({
          map: this.textures.earth,
          normalMap: this.textures.earthNormal ?? null,
          specularMap: this.textures.earthSpecular ?? null,
          specular: new THREE.Color(0x29465c),
          shininess: 24
        });
      } else {
        material = new THREE.MeshStandardMaterial(params);
      }
      material.map.anisotropy = Math.min(8, this.textures[data.id].anisotropy || 1);

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 72, 48), material);
      mesh.rotation.y = random() * Math.PI * 2;
      tiltGroup.add(mesh);

      let clouds = null;
      if (data.id === 'earth' && this.textures.earthClouds) {
        clouds = new THREE.Mesh(
          new THREE.SphereGeometry(data.radius * 1.012, 64, 40),
          new THREE.MeshStandardMaterial({
            map: this.textures.earthClouds,
            transparent: true,
            opacity: 0.82,
            depthWrite: false,
            roughness: 1,
            metalness: 0
          })
        );
        clouds.rotation.y = mesh.rotation.y + 0.7;
        tiltGroup.add(clouds);
      }

      if (data.id === 'earth' && data.atmosphereColor) {
        tiltGroup.add(createAtmosphere(data.radius, data.atmosphereColor, 0.22, 1.045, 3.2));
        tiltGroup.add(createAtmosphere(data.radius, data.atmosphereColor, 0.07, 1.16, 1.8));
      }

      if (data.hasRings) {
        if (data.faintRings) {
          this.addUranusRings(tiltGroup, data.radius);
        } else {
          this.addSaturnRings(tiltGroup, data.radius);
        }
      }

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(data.radius * 1.9, data.radius + 1.4), 16, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
      );
      hit.userData.bodyId = data.id;
      container.add(hit);
      this.hitTargets.push(hit);

      this.group.add(container);

      const orbitLine = this.createOrbitLine(data);
      this.orbitGroup.add(orbitLine.line);

      const body = {
        data,
        container,
        tiltGroup,
        mesh,
        clouds,
        orbitLine: orbitLine.line,
        orbitMaterial: orbitLine.material,
        baseColor: new THREE.Color(data.colorHex),
        radius: data.radius,
        angle: data.startAngle,
        focusFade: 0,
        lineGlow: 0,
        hoverScale: 1,
        texture: this.textures[data.id],
        moons: [],
        hit,
        index
      };
      this.bodies.set(data.id, body);
      this.createMoons(body);
    });
  }

  addSaturnRings(tiltGroup, planetRadius) {
    const inner = planetRadius * 1.22;
    const outer = planetRadius * 2.38;
    const geometry = new THREE.RingGeometry(inner, outer, 220, 2);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < position.count; i += 1) {
      vertex.fromBufferAttribute(position, i);
      const radius = vertex.length();
      uv.setXY(i, (radius - inner) / (outer - inner), 0.5);
    }
    uv.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: this.textures.saturnRing,
      color: 0xfff2da,
      transparent: true,
      opacity: 0.95,
      alphaTest: 0.015,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 2;
    tiltGroup.add(ring);
  }

  addUranusRings(tiltGroup, planetRadius) {
    const bands = [
      { inner: 1.62, outer: 1.66, opacity: 0.24 },
      { inner: 1.78, outer: 1.81, opacity: 0.15 },
      { inner: 1.95, outer: 2.0, opacity: 0.1 }
    ];
    bands.forEach((band) => {
      const geometry = new THREE.RingGeometry(
        planetRadius * band.inner,
        planetRadius * band.outer,
        160,
        1
      );
      const material = new THREE.MeshBasicMaterial({
        color: 0xbcd6e2,
        transparent: true,
        opacity: band.opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = -Math.PI / 2;
      ring.renderOrder = 2;
      tiltGroup.add(ring);
    });
  }

  createMoons(body) {
    const definitions = MOON_SYSTEMS[body.data.id];
    if (!definitions) return;

    definitions.forEach((definition) => {
      const material = definition.texture
        ? new THREE.MeshStandardMaterial({ map: this.textures[definition.texture], roughness: 1 })
        : new THREE.MeshStandardMaterial({ color: definition.color, roughness: 1 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(definition.radius, 20, 14), material);
      mesh.userData.angle = Math.random() * Math.PI * 2;
      body.container.add(mesh);
      body.moons.push({ ...definition, mesh, angle: mesh.userData.angle });
    });
  }

  createOrbitLine(data) {
    const points = [];
    const b = Math.sqrt(1 - data.eccentricity * data.eccentricity);
    for (let i = 0; i < ORBIT_SEGMENTS; i += 1) {
      const angle = (i / ORBIT_SEGMENTS) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle) * b));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: data.colorHex,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.LineLoop(geometry, material);
    line.rotation.x = data.inclination * DEG;
    line.scale.set(data.orbitRadius, 1, data.orbitRadius * b);
    line.userData.baseScale = new THREE.Vector3(data.orbitRadius, 1, data.orbitRadius * b);
    return { line, material };
  }

  createAsteroidBelt() {
    const count = 1300;
    const random = mulberry32(7781);
    const geometry = new THREE.DodecahedronGeometry(0.085, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, flatShading: true });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 45 + random() * 8.5;
      const height = (random() - 0.5) * 3.2 * (0.35 + random());
      position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      rotation.setFromEuler(new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI));
      const size = 0.14 + Math.pow(random(), 3) * 1.15;
      scale.set(size, size * (0.6 + random() * 0.5), size);
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(i, matrix);
      const shade = 0.26 + random() * 0.34;
      color.setRGB(shade * 1.08, shade * 0.92, shade * 0.76);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    this.asteroidBelt = mesh;
    this.beltGroup.add(mesh);
  }

  createKuiperBelt() {
    const count = 2600;
    const random = mulberry32(3357);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 118 + random() * 16;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (random() - 0.5) * 9;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x91a9cf,
      map: makeGlowTexture([
        [0, 'rgba(210, 228, 255, 1)'],
        [0.4, 'rgba(190, 212, 245, 0.55)'],
        [1, 'rgba(160, 190, 240, 0)']
      ], 64),
      alphaTest: 0.02,
      size: 0.45,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.kuiperBelt = new THREE.Points(geometry, material);
    this.beltGroup.add(this.kuiperBelt);
  }

  setLayoutScale(scale) {
    this.layoutScale = scale;
    this.beltGroup.scale.setScalar(scale);
    this.bodies.forEach((body) => {
      if (body.orbitLine) {
        const base = body.orbitLine.userData.baseScale;
        body.orbitLine.scale.set(base.x * scale, 1, base.z * scale);
      }
    });
  }

  setOrbitsVisible(visible) {
    this.orbitGroup.visible = visible;
  }

  setHovered(id) {
    this.hoveredId = id;
  }

  setFocus(id) {
    this.selectedId = id;
  }

  clearFocus() {
    this.selectedId = null;
  }

  getBody(id) {
    return this.bodies.get(id) ?? null;
  }

  getRaycastTargets() {
    return this.hitTargets;
  }

  getWorldPosition(id, target = new THREE.Vector3()) {
    const body = this.bodies.get(id);
    if (!body) return target.set(0, 0, 0);
    if (body.isSun) return target.set(0, 0, 0);
    return body.container.getWorldPosition(target);
  }

  update(dt, simDt, elapsed) {
    const planets = PLANETS.length;

    for (let i = 0; i < planets; i += 1) {
      const body = this.bodies.get(PLANETS[i].id);
      const { data } = body;

      const isSelected = this.selectedId === body.data.id;
      const targetFade = isSelected ? 1 : 0;
      body.focusFade += (targetFade - body.focusFade) * Math.min(1, dt * 2.6);
      body.angle += data.orbitSpeed * simDt * (1 - body.focusFade * 0.96);

      const a = data.orbitRadius * this.layoutScale;
      const b = a * Math.sqrt(1 - data.eccentricity * data.eccentricity);
      const x = Math.cos(body.angle) * a;
      const zLocal = Math.sin(body.angle) * b;
      const inclination = data.inclination * DEG;
      body.container.position.set(
        x,
        -Math.sin(inclination) * zLocal,
        Math.cos(inclination) * zLocal
      );

      body.mesh.rotation.y += data.spinSpeed * simDt;
      if (body.clouds) body.clouds.rotation.y += data.spinSpeed * simDt * 1.18;

      const hoverTarget = this.hoveredId === body.data.id ? 1.045 : 1;
      body.hoverScale += (hoverTarget - body.hoverScale) * Math.min(1, dt * 8);
      body.tiltGroup.scale.setScalar(body.hoverScale);

      const glowTarget = isSelected ? 1 : 0;
      body.lineGlow += (glowTarget - body.lineGlow) * Math.min(1, dt * 3);
      const lineBase = this.selectedId ? 0.012 : 0.16;
      const lineTarget = this.selectedId ? lineBase : lineBase + body.lineGlow * 0.46;
      body.orbitMaterial.opacity += (lineTarget - body.orbitMaterial.opacity) * Math.min(1, dt * 3.2);
      body.orbitMaterial.color.copy(body.baseColor).lerp(FOCUS_LINE_COLOR, body.lineGlow * 0.8);

      body.moons.forEach((moon) => {
        moon.angle += moon.speed * simDt * 0.22;
        const distance = moon.distance * Math.max(0.9, this.layoutScale * 0.5 + 0.5);
        moon.mesh.position.set(
          Math.cos(moon.angle) * distance,
          Math.sin(moon.angle * 0.4) * 0.12,
          Math.sin(moon.angle) * distance
        );
        moon.mesh.rotation.y += simDt * 0.2;
      });
    }

    this.sun.mesh.rotation.y += SUN.rotationSpeed * simDt;
    const pulse = 1 + Math.sin(elapsed * 0.8) * 0.012;
    this.sun.glows[0].scale.setScalar(SUN.radius * 3.2 * pulse);
    this.sun.glows[1].scale.setScalar(SUN.radius * 7 * (2 - pulse));
    this.sun.glows[1].material.opacity = 0.11 + Math.sin(elapsed * 0.45) * 0.02;

    if (this.asteroidBelt) this.asteroidBelt.rotation.y += simDt * 0.012;
    if (this.kuiperBelt) this.kuiperBelt.rotation.y -= simDt * 0.0035;
  }
}
