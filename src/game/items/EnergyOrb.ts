import Phaser from 'phaser';
import { pickupBalance } from '../../config/balance/pickupBalance';

export class EnergyOrb extends Phaser.GameObjects.Arc {
  exp = 0;
  private lifeMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, pickupBalance.orbRadius, 0x5affb0, 0.95);
    this.setStrokeStyle(2, 0xb7ffe6);
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(x: number, y: number, exp: number): void {
    this.setPosition(x, y);
    this.exp = exp;
    this.lifeMs = 0;
    this.setScale(exp >= 20 ? 1.4 : 1);
    this.setFillStyle(exp >= 20 ? 0xffdc6d : 0x5affb0, 0.95);
    this.setStrokeStyle(2, exp >= 20 ? 0xffffff : 0xb7ffe6);
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.exp = 0;
    this.setScale(1);
  }

  isActive(): boolean {
    return this.active;
  }

  advance(
    deltaMs: number,
    playerX: number,
    playerY: number,
    pickupRadius: number,
    magnetSpeed: number = pickupBalance.magnetSpeed,
  ): boolean {
    this.lifeMs += deltaMs;
    this.setAlpha(0.8 + Math.sin(this.lifeMs / 150) * 0.2);
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < pickupBalance.collectRadius) return true;
    if (distance < pickupRadius && distance > 0) {
      const step = Math.min(distance, (magnetSpeed * deltaMs) / 1000);
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
    } else {
      this.y += (pickupBalance.fallSpeed * deltaMs) / 1000;
    }
    return false;
  }
}
