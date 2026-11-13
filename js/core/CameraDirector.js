import * as THREE from 'three';
import { TweenManager, easeInOutCubic, easeOutCubic } from '../utils/tween.js';

const UP = new THREE.Vector3(0, 1, 0);
const DEG = Math.PI / 180;
const SYSTEM_FIT_RADIUS = 138;

/**
 * Owns all camera movement: intro dolly, cinematic planet focus,
 * follow-tracking while inspecting and the return to the orrery.
 */
export class CameraDirector {
  constructor(camera, controls, system) {
    this.camera = camera;
    this.controls = controls;
    this.system = system;
    this.tweens = new TweenManager();

    this.state = 'boot';
    this.focusId = null;
    this.focusShift = new THREE.Vector3();
    this.lastFocusPos = new THREE.Vector3();
    this.focusOffset = new THREE.Vector3();
    this.onStateChange = null;

    this._tmpA = new THREE.Vector3();
    this._tmpB = new THREE.Vector3();
    this._tmpC = new THREE.Vector3();
    this._tmpD = new THREE.Vector3();
    this._tmpE = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
  }

  get isMobile() {
    return window.matchMedia('(max-width: 760px)').matches;
  }

  computeOverviewPosition() {
    const scale = this.system.layoutScale || 1;
    const portrait = this.camera.aspect < 0.82;
    const radius = SYSTEM_FIT_RADIUS * scale * (portrait ? 0.82 : 1);
    const aspect = Math.max(0.35, this.camera.aspect);
    const tan = Math.tan((this.camera.fov * DEG) / 2);
    const horizontalDistance = radius / (tan * aspect);
    const verticalDistance = (radius * 0.52) / tan;
    const distance = Math.max(horizontalDistance, verticalDistance) * 1.06;
    return new THREE.Vector3(0, distance * (portrait ? 0.72 : 0.35), distance * (portrait ? 0.69 : 0.937));
  }

  setState(state) {
    this.state = state;
    this.onStateChange?.(state);
  }

  startIntro() {
    const start = new THREE.Vector3(0, 240, 560);
    this.camera.position.copy(start);
    this.controls.target.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
    this.controls.enabled = false;
    this.setState('flying');
    this.flyToOverview(5.2, easeInOutCubic);
  }

  flyToOverview(duration = 2.1, ease = easeOutCubic) {
    this.tweens.clear();
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 900;
    this.setState('flying');
    this.focusId = null;

    const fromPosition = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const toPosition = this.computeOverviewPosition();
    const toTarget = new THREE.Vector3(0, 0, 0);
    const arcHeight = Math.min(70, fromPosition.distanceTo(toPosition) * 0.16);

    this.tweens.add({
      duration,
      ease,
      onUpdate: (t) => {
        this.camera.position.lerpVectors(fromPosition, toPosition, t);
        this.camera.position.y += Math.sin(t * Math.PI) * arcHeight;
        this._lookTarget.lerpVectors(fromTarget, toTarget, t);
        this.controls.target.copy(this._lookTarget);
        this.camera.lookAt(this._lookTarget);
      },
      onComplete: () => {
        this.camera.position.copy(toPosition);
        this.controls.target.copy(toTarget);
        this.controls.enabled = true;
        this.controls.update();
        this.setState('overview');
      }
    });
  }

  focusOn(id) {
    const body = this.system.getBody(id);
    if (!body) return;

    this.tweens.clear();
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.focusId = id;
    this.setState('flying');

    const planetPos = this.system.getWorldPosition(id);
    const mobile = this.isMobile;
    const distance = body.radius * body.data.focusDistance * (mobile ? 1.62 : 1);
    const tan = Math.tan((this.camera.fov * DEG) / 2);

    const direction = this._tmpA;
    if (body.isSun) {
      direction.set(0.52, 0.42, 1).normalize();
    } else {
      const toSun = this._tmpB.copy(planetPos).multiplyScalar(-1).normalize();
      const side = this._tmpC.crossVectors(toSun, UP);
      if (side.lengthSq() < 0.0001) side.set(1, 0, 0);
      side.normalize();
      direction.copy(toSun).multiplyScalar(0.78).addScaledVector(side, 0.56).addScaledVector(UP, 0.3).normalize();
      if (body.data.hasRings) {
        const tilt = (body.data.axialTilt || 0) * DEG;
        this._tmpE.set(-Math.sin(tilt), Math.cos(tilt), 0);
        if (this._tmpE.dot(direction) < 0) this._tmpE.negate();
        direction.addScaledVector(this._tmpE, 0.9).normalize();
      }
    }

    const offset = direction.clone().multiplyScalar(distance);
    const endCamera = planetPos.clone().add(offset);

    const viewDir = planetPos.clone().sub(endCamera).normalize();
    const right = new THREE.Vector3().crossVectors(viewDir, UP).normalize();
    if (right.lengthSq() < 0.0001) right.set(1, 0, 0);

    const halfHeight = distance * tan;
    const shift = new THREE.Vector3();
    if (mobile) {
      shift.addScaledVector(right, halfHeight * 0.06);
      shift.addScaledVector(UP, -halfHeight * 0.52);
    } else {
      shift.addScaledVector(right, halfHeight * 0.3);
      shift.addScaledVector(UP, -halfHeight * 0.03);
    }

    this.focusOffset.copy(offset);
    this.focusShift.copy(shift);
    this.lastFocusPos.copy(planetPos);

    const fromPosition = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const arcHeight = Math.min(30, fromPosition.distanceTo(endCamera) * 0.07);
    const duration = fromPosition.distanceTo(endCamera) > 200 ? 2.5 : 1.9;

    const endTarget = new THREE.Vector3();
    const liveCamera = new THREE.Vector3();

    this.tweens.add({
      duration,
      ease: easeInOutCubic,
      onUpdate: (t) => {
        this.system.getWorldPosition(id, this._tmpD);
        liveCamera.copy(this._tmpD).add(this.focusOffset);
        endTarget.copy(this._tmpD).add(this.focusShift);

        this.camera.position.lerpVectors(fromPosition, liveCamera, t);
        this.camera.position.y += Math.sin(t * Math.PI) * arcHeight;
        this._lookTarget.lerpVectors(fromTarget, endTarget, t);
        this.controls.target.copy(this._lookTarget);
        this.camera.lookAt(this._lookTarget);
      },
      onComplete: () => {
        this.system.getWorldPosition(id, this.lastFocusPos);
        this.controls.target.copy(this.lastFocusPos).add(this.focusShift);
        this.controls.minDistance = Math.max(1.8, body.radius * 1.5);
        this.controls.maxDistance = 420;
        this.controls.enabled = true;
        this.controls.update();
        this.setState('focused');
      }
    });
  }

  returnToOverview(duration = 2.0) {
    if (this.state === 'flying' && !this.focusId) return;
    this.flyToOverview(duration, easeInOutCubic);
  }

  update(dt) {
    this.tweens.update(dt);

    if (this.state === 'focused' && this.focusId) {
      const live = this.system.getWorldPosition(this.focusId, this._tmpA);
      this._tmpB.subVectors(live, this.lastFocusPos);
      this.camera.position.add(this._tmpB);
      this.controls.target.copy(live).add(this.focusShift);
      this.lastFocusPos.copy(live);
    }
  }

  handleResize() {
    if (this.state === 'overview') {
      this.camera.position.copy(this.computeOverviewPosition());
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }
}
