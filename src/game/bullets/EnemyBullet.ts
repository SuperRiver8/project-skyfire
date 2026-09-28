import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';

const ORB_KEY = 'enemy_bullet_orb';
const MISSILE_KEY = 'enemy_bullet_missile';

export class EnemyBullet extends Phaser.GameObjects.Image {
  damage = 0;
  private vx = 0;
  private vy = 0;
  private target: { x: number; y: number } | undefined;
  private homingMs = 0;

  constructor(scene: Phaser.Scene) {
    if (!scene.textures.exists(ORB_KEY)) {
      const g = scene.add.graphics();
      g.fillStyle(0xff3f5c, 0.28);
      g.fillCircle(9, 9, 9);
      g.fillStyle(0xff6255, 0.9);
      g.fillCircle(9, 9, 6);
      g.fillStyle(0xffe1a2);
      g.fillCircle(9, 9, 3);
      g.generateTexture(ORB_KEY, 18, 18);
      g.destroy();
    }
    if (!scene.textures.exists(MISSILE_KEY)) {
      const g = scene.add.graphics();
      g.fillStyle(0xffa24e, 0.3);
      g.fillTriangle(9, 26, 0, 5, 18, 5);
      g.fillStyle(0xff6d3e);
      g.fillTriangle(9, 25, 4, 4, 14, 4);
      g.fillStyle(0xfff0aa);
      g.fillTriangle(9, 24, 7, 10, 11, 10);
      g.generateTexture(MISSILE_KEY, 18, 28);
      g.destroy();
    }
    super(scene, 0, 0, ORB_KEY);
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    target?: { x: number; y: number },
  ): void {
    this.setPosition(x, y);
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.target = target;
    this.homingMs = target ? 1200 : 0;
    this.setTexture(target ? MISSILE_KEY : ORB_KEY);
    this.setRotation(target ? Math.atan2(vy, vx) - Math.PI / 2 : 0);
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.damage = 0;
    this.target = undefined;
    this.homingMs = 0;
  }

  isActive(): boolean {
    return this.active;
  }

  advance(deltaMs: number): void {
    if (this.target && this.homingMs > 0) {
      const speed = Math.hypot(this.vx, this.vy);
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const blend = Math.min(1, deltaMs / 330);
      this.vx = this.vx * (1 - blend) + Math.cos(angle) * speed * blend;
      this.vy = this.vy * (1 - blend) + Math.sin(angle) * speed * blend;
      this.setRotation(Math.atan2(this.vy, this.vx) - Math.PI / 2);
      this.homingMs -= deltaMs;
    }
    this.x += (this.vx * deltaMs) / 1000;
    this.y += (this.vy * deltaMs) / 1000;
  }

  isOffscreen(): boolean {
    return (
      this.x < -20 ||
      this.x > GAME_WIDTH + 20 ||
      this.y < -20 ||
      this.y > GAME_HEIGHT + 20
    );
  }
}
