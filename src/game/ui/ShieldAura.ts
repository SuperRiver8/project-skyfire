import Phaser from 'phaser';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import type { PlayerHealth } from '../player/PlayerHealth';

const COLORS = [0x59a9ff, 0x55e1e0, 0xa577ef, 0xffa74f, 0xffdd59];

export class ShieldAura {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private elapsedMs = 0;
  private hasDrawing = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(11);
  }

  burst(x: number, y: number, layers: number): void {
    const color = COLORS[Math.max(0, Math.min(4, layers - 1))];
    for (let i = 0; i < 10; i += 1) {
      const angle = (i * Math.PI * 2) / 10;
      const shard = this.scene.add
        .rectangle(x, y, 5, 13, color, 0.9)
        .setRotation(angle)
        .setDepth(32);
      this.scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 63,
        y: y + Math.sin(angle) * 63,
        alpha: 0,
        duration: 340,
        onComplete: () => shard.destroy(),
      });
    }
  }

  update(
    deltaMs: number,
    aircraft: PlayerAircraft,
    health: PlayerHealth,
  ): void {
    if (health.shields === 0) {
      if (this.hasDrawing) this.graphics.clear();
      this.hasDrawing = false;
      return;
    }
    this.graphics.clear();
    this.hasDrawing = true;
    this.elapsedMs += deltaMs;
    const color = COLORS[Math.min(health.shields, 5) - 1];
    const breath = (Math.sin(this.elapsedMs / 350) + 1) / 2;
    this.graphics.lineStyle(9, color, 0.08 + breath * 0.12);
    this.graphics.strokeCircle(aircraft.x, aircraft.y, 38 + breath * 3);
    this.graphics.lineStyle(2.5, color, 0.55 + breath * 0.35);
    this.graphics.strokeCircle(aircraft.x, aircraft.y, 37 + breath * 3);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
