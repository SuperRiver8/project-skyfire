import Phaser from 'phaser';
import { pickupBalance } from '../../config/balance/pickupBalance';

const ORB_KEY = 'energy_orb';
const GOLD_ORB_KEY = 'energy_orb_gold';
/** 经验值达到该值时使用金色大球样式 */
const GOLD_EXP = 20;

function ensureOrbArt(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ORB_KEY)) {
    const g = scene.add.graphics();
    // 柔光外晕
    g.fillStyle(0x5affb0, 0.14);
    g.fillCircle(13, 13, 13);
    g.fillStyle(0x3fe39b, 0.3);
    g.fillCircle(13, 13, 10);
    // 菱形主体
    g.fillStyle(0x66ffbc, 0.95);
    g.fillTriangle(13, 1.5, 21, 13, 5, 13);
    g.fillTriangle(5, 13, 21, 13, 13, 24.5);
    // 亮色内芯
    g.fillStyle(0xd9fff0, 0.95);
    g.fillTriangle(13, 7, 17, 13, 9, 13);
    g.fillTriangle(9, 13, 17, 13, 13, 19);
    // 高光点
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(10.5, 9.5, 2);
    g.generateTexture(ORB_KEY, 26, 26);
    g.destroy();
  }
  if (!scene.textures.exists(GOLD_ORB_KEY)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffdc6d, 0.16);
    g.fillCircle(13, 13, 13);
    g.fillStyle(0xffc94d, 0.32);
    g.fillCircle(13, 13, 10);
    g.fillStyle(0xffe08a, 0.95);
    g.fillTriangle(13, 1.5, 21, 13, 5, 13);
    g.fillTriangle(5, 13, 21, 13, 13, 24.5);
    g.fillStyle(0xfff7d6, 0.95);
    g.fillTriangle(13, 7, 17, 13, 9, 13);
    g.fillTriangle(9, 13, 17, 13, 13, 19);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(10.5, 9.5, 2);
    g.generateTexture(GOLD_ORB_KEY, 26, 26);
    g.destroy();
  }
}

export class EnergyOrb extends Phaser.GameObjects.Image {
  exp = 0;
  private lifeMs = 0;

  constructor(scene: Phaser.Scene) {
    ensureOrbArt(scene);
    super(scene, 0, 0, ORB_KEY);
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(x: number, y: number, exp: number): void {
    this.setPosition(x, y);
    this.exp = exp;
    this.lifeMs = 0;
    this.setTexture(exp >= GOLD_EXP ? GOLD_ORB_KEY : ORB_KEY);
    this.setRotation(0).setAlpha(1);
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.exp = 0;
    this.setRotation(0).setAlpha(1).setScale(1);
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
    // 呼吸脉动 + 缓慢旋转，让经验球更有生命力
    const pulse = 1 + Math.sin(this.lifeMs / 170) * 0.14;
    this.setScale((this.exp >= GOLD_EXP ? 1 : 0.85) * pulse);
    this.rotation += deltaMs * 0.0022;
    this.setAlpha(0.78 + Math.sin(this.lifeMs / 150) * 0.2);
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
