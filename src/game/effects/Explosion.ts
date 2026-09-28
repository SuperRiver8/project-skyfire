import Phaser from 'phaser';
import { explosionConfig } from '../../config/effects/explosion';
import { canvasArt, radialBall } from '../visuals/pseudo3d';

const CORE_KEY = 'explosion_core';
const BRIGHT_KEY = 'explosion_core_bright';
/** 贴图直径与旧半径的换算，保持原有视觉大小 */
const SIZE_RATIO = (explosionConfig.radius * 2) / 48;

export function ensureExplosionArt(scene: Phaser.Scene): void {
  canvasArt(scene, CORE_KEY, 48, 48, (ctx) => {
    radialBall(ctx, 24, 24, 24, [
      [0, 0xffffff],
      [0.22, 0xfff0b0],
      [0.5, 0xff9a3f, 0.95],
      [0.78, 0xe84c26, 0.55],
      [1, 0xe84c26, 0],
    ]);
  });
  canvasArt(scene, BRIGHT_KEY, 48, 48, (ctx) => {
    radialBall(ctx, 24, 24, 24, [
      [0, 0xffffff],
      [0.3, 0xeafcff],
      [0.6, 0x9fd8ff, 0.8],
      [1, 0x9fd8ff, 0],
    ]);
  });
}

export class Explosion extends Phaser.GameObjects.Image {
  private remainingMs = 0;
  private size = 1;
  private readonly ring: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene) {
    ensureExplosionArt(scene);
    super(scene, 0, 0, CORE_KEY);
    this.setActive(false).setVisible(false);
    this.ring = scene.add
      .circle(0, 0, 16, 0xffc36b, 0)
      .setStrokeStyle(3, 0xffe2aa, 0.9)
      .setActive(false)
      .setVisible(false);
    scene.add.existing(this);
  }

  activate(x: number, y: number, size = 1, bright = false): void {
    this.setPosition(x, y);
    this.size = size;
    this.setTexture(bright ? BRIGHT_KEY : CORE_KEY);
    this.remainingMs = explosionConfig.durationMs;
    this.setScale(explosionConfig.startScale * SIZE_RATIO * size);
    this.setAlpha(1);
    this.ring
      .setPosition(x, y)
      .setScale(0.35 * size)
      .setAlpha(0.85)
      .setStrokeStyle(3, bright ? 0xffffff : 0xffe2aa, 0.9)
      .setActive(true)
      .setVisible(true);
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.ring.setActive(false).setVisible(false);
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
      (explosionConfig.startScale +
        (explosionConfig.endScale - explosionConfig.startScale) * progress) *
        SIZE_RATIO *
        this.size,
    );
    this.setAlpha(Math.max(0, 1 - progress * 1.15));
    // 冲击环扩散更快，先一步消散
    this.ring
      .setScale((0.35 + progress * 2.4) * this.size)
      .setAlpha(Math.max(0, 0.85 - progress * 1.6));
    return this.remainingMs <= 0;
  }

  override destroy(fromScene?: boolean): void {
    this.ring.destroy();
    super.destroy(fromScene);
  }
}
