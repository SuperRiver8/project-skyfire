import Phaser from 'phaser';
import { explosionConfig } from '../../config/effects/explosion';

export class Explosion extends Phaser.GameObjects.Arc {
  private remainingMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, explosionConfig.radius, 0xffa343, explosionConfig.alpha);
    this.setStrokeStyle(3, 0xffe2aa);
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(x: number, y: number): void {
    this.setPosition(x, y);
    this.remainingMs = explosionConfig.durationMs;
    this.setScale(explosionConfig.startScale);
    this.setAlpha(explosionConfig.alpha);
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.remainingMs = 0;
  }

  isActive(): boolean {
    return this.active;
  }

  advance(deltaMs: number): boolean {
    this.remainingMs -= deltaMs;
    const progress =
      1 - Math.max(0, this.remainingMs) / explosionConfig.durationMs;
    this.setScale(
      explosionConfig.startScale +
        (explosionConfig.endScale - explosionConfig.startScale) * progress,
    );
    this.setAlpha(explosionConfig.alpha * (1 - progress));
    return this.remainingMs <= 0;
  }
}
