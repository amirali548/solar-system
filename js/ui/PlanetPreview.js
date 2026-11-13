import * as THREE from 'three';
import { makeGlowTexture } from '../core/TextureFactory.js';

const DEG = Math.PI / 180;

/**
 * Small independent WebGL viewport used inside the info panel.
 * Re-uses the same high-resolution textures as the main scene.
 */
export class PlanetPreview {
  constructor(canvas, textures) {
    this.canvas = canvas;
    this.textures = textures;
    this.active = false;
    this.body = null;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1.8, 0.1, 60);
    this.camera.position.set(0.35, 0.55, 4.1);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0x93a8d8, 0.55));
    const key = new THREE.DirectionalLight(0xfff3e0, 3.1);
    key.position.set(3.2, 2.2, 3.4);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x6f9bff, 14, 0, 2);
    rim.position.set(-3.5, -1.4, 2.4);
    this.scene.add(rim);

    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.tiltGroup = new THREE.Group();
    this.root.add(this.tiltGroup);

    this.glowTexture = makeGlowTexture();
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: 0x6f9bff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    this.glow.scale.setScalar(2.9);
    this.glow.position.z = -0.6;
    this.scene.add(this.glow);

    this.mesh = null;
    this.clouds = null;
    this.ring = null;
    this.geometry = new THREE.SphereGeometry(1, 64, 44);
    this.ringGeometry = null;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  clearContent() {
    this.tiltGroup.children.forEach((child) => {
      if (child.userData.disposable) {
        if (child.geometry && child.geometry !== this.geometry) child.geometry.dispose();
        child.material?.dispose();
      }
    });
    this.tiltGroup.clear();
    this.mesh = null;
    this.clouds = null;
    this.ring = null;
  }

  show(body) {
    const data = body.data;
    this.body = body;
    this.clearContent();
    this.tiltGroup.rotation.z = (data.axialTilt ?? 0) * DEG;
    this.tiltGroup.rotation.x = 0;
    this.root.rotation.set(0, 0, 0);

    let material;
    if (body.isSun) {
      material = new THREE.MeshBasicMaterial({
        map: body.texture,
        toneMapped: false,
        color: 0xfff3dd
      });
    } else if (data.id === 'earth') {
      material = new THREE.MeshPhongMaterial({
        map: body.texture,
        normalMap: this.textures.earthNormal ?? null,
        specularMap: this.textures.earthSpecular ?? null,
        specular: new THREE.Color(0x2c4d66),
        shininess: 26
      });
    } else {
      material = new THREE.MeshStandardMaterial({ map: body.texture, roughness: 0.92, metalness: 0 });
    }

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.userData.disposable = true;
    this.tiltGroup.add(this.mesh);

    if (data.id === 'earth' && this.textures.earthClouds) {
      this.clouds = new THREE.Mesh(
        this.geometry.clone(),
        new THREE.MeshStandardMaterial({
          map: this.textures.earthClouds,
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          roughness: 1
        })
      );
      this.clouds.scale.setScalar(1.012);
      this.clouds.userData.disposable = true;
      this.tiltGroup.add(this.clouds);
    }

    if (data.hasRings && !data.faintRings) {
      const inner = 1.35;
      const outer = 2.42;
      const geometry = new THREE.RingGeometry(inner, outer, 160, 2);
      const position = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      const vertex = new THREE.Vector3();
      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i);
        uv.setXY(i, (vertex.length() - inner) / (outer - inner), 0.5);
      }
      uv.needsUpdate = true;
      const ringMaterial = new THREE.MeshStandardMaterial({
        map: this.textures.saturnRing,
        transparent: true,
        alphaTest: 0.015,
        opacity: 0.95,
        side: THREE.DoubleSide,
        roughness: 1,
        metalness: 0,
        depthWrite: false
      });
      this.ring = new THREE.Mesh(geometry, ringMaterial);
      this.ring.rotation.x = -Math.PI / 2;
      this.ring.userData.disposable = true;
      this.tiltGroup.add(this.ring);
      this.camera.position.set(0.5, 0.9, 5.0);
    } else if (data.faintRings) {
      const geometry = new THREE.RingGeometry(1.5, 1.62, 120, 1);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xcfeaf2,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      this.ring = new THREE.Mesh(geometry, ringMaterial);
      this.ring.rotation.x = -Math.PI / 2;
      this.ring.userData.disposable = true;
      this.tiltGroup.add(this.ring);
      this.camera.position.set(0.45, 0.7, 4.4);
    } else {
      this.camera.position.set(0.35, 0.55, 4.1);
    }

    this.camera.lookAt(0, 0, 0);
    this.glow.material.color.set(body.isSun ? 0xffb45e : data.colorHex);
    this.glow.material.opacity = body.isSun ? 0.55 : 0.22;
    this.glow.scale.setScalar(body.isSun ? 3.6 : 2.9);

    this.active = true;
    this.root.rotation.y = 0;
    this.resize();
    this.render(0);
  }

  hide() {
    this.active = false;
  }

  render(dt) {
    if (!this.active) return;
    const isSun = this.body?.isSun;
    if (this.mesh) this.mesh.rotation.y += dt * (isSun ? 0.08 : 0.32);
    if (this.clouds) this.clouds.rotation.y += dt * 0.4;
    this.glow.material.rotation += dt * 0.03;
    this.renderer.render(this.scene, this.camera);
  }
}
