export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
export const easeInOutQuint = (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2);

export class TweenManager {
  constructor() {
    this.tweens = [];
  }

  add({ duration = 1, delay = 0, ease = easeInOutCubic, onUpdate, onComplete }) {
    const tween = {
      duration: Math.max(0.0001, duration),
      delay: Math.max(0, delay),
      ease,
      onUpdate,
      onComplete,
      elapsed: 0,
      completed: false
    };
    this.tweens.push(tween);
    return tween;
  }

  update(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      const tween = this.tweens[i];
      tween.elapsed += dt;
      if (tween.elapsed < tween.delay) continue;

      const time = tween.elapsed - tween.delay;
      const raw = Math.min(1, time / tween.duration);
      tween.onUpdate?.(tween.ease(raw), raw);

      if (raw >= 1) {
        tween.completed = true;
        this.tweens.splice(i, 1);
        tween.onComplete?.();
      }
    }
  }

  clear() {
    this.tweens.length = 0;
  }

  get busy() {
    return this.tweens.length > 0;
  }
}
