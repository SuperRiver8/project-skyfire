import Phaser from 'phaser';
import { aircraftEffectVisuals } from '../../config/aircraft/aircraftVisuals';
import { ObjectPool } from '../utils/ObjectPool';
import type { Enemy } from './Enemy';

class FallingWreck extends Phaser.GameObjects.Image {
  private remainingMs = 0;
  private driftX = 0;
  private spin = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'enemy_scout');
    this.setDepth(8).setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(enemy: Enemy): void {
    this.setTexture(enemy.texture.key).setPosition(enemy.x, enemy.y);
    this.setScale(enemy.scaleX, enemy.scaleY).setRotation(enemy.rotation);
    this.setFlipY(false).setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.setAlpha(1).setActive(true).setVisible(true);
    this.remainingMs = aircraftEffectVisuals.enemyDeathMs;
    this.driftX = enemy.x < 270 ? -42 : 42;
    this.spin = enemy.x < 270 ? -3.1 : 3.1;
  }

  advance(deltaMs: number): boolean {
    this.remainingMs -= deltaMs;
    const progress =
      1 - Math.max(0, this.remainingMs) / aircraftEffectVisuals.enemyDeathMs;
    this.x += (this.driftX * deltaMs) / 1000;
    this.y += ((70 + 130 * progress) * deltaMs) / 1000;
    this.rotation += (this.spin * deltaMs) / 1000;
    this.setAlpha(1 - progress * 0.55);
    if (progress > 0.26) this.setTint(0xff8a65);
    return this.remainingMs <= 0;
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.clearTint();
  }

  isActive(): boolean {
    return this.active;
  }
}

export class EnemyDeathPool {
  private readonly pool: ObjectPool<FallingWreck>;

  constructor(scene: Phaser.Scene) {
    this.pool = new ObjectPool(() => new FallingWreck(scene), 16);
  }

  spawn(enemy: Enemy): void {
    this.pool.acquire().activate(enemy);
  }

  update(deltaMs: number, onExplosion: (x: number, y: number) => void): void {
    for (const wreck of this.pool.activeItems()) {
      if (wreck.advance(deltaMs)) {
        onExplosion(wreck.x, wreck.y);
        this.pool.release(wreck);
      }
    }
  }

  destroy(): void {
    for (const wreck of this.pool.allItems()) wreck.destroy();
  }
}
