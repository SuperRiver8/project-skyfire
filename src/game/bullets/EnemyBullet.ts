import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import {
  canvasArt,
  fillLinear,
  fillPoly,
  radialBall,
  strokeLine,
} from '../visuals/pseudo3d';

const ORB_KEY = 'enemy_bullet_orb';
const MISSILE_KEY = 'enemy_bullet_missile';

export class EnemyBullet extends Phaser.GameObjects.Image {
  damage = 0;
  private vx = 0;
  private vy = 0;
  private target: { x: number; y: number } | undefined;
  private homingMs = 0;

  constructor(scene: Phaser.Scene) {
    canvasArt(scene, ORB_KEY, 18, 18, (ctx) => {
      // 外晕
      radialBall(ctx, 9, 9, 9, [
        [0, 0xff8d7a, 0.5],
        [0.6, 0xff5c55, 0.22],
        [1, 0xff5c55, 0],
      ]);
      // 球体（径向渐变 + 左上高光，营造球面感）
      radialBall(ctx, 9, 9, 6.5, [
        [0, 0xffffff],
        [0.28, 0xffb3a0],
        [0.65, 0xff4a52],
        [1, 0x8f1428],
      ]);
      radialBall(ctx, 7.4, 7.2, 1.6, [
        [0, 0xffffff, 0.95],
        [1, 0xffffff, 0],
      ]);
    });
    canvasArt(scene, MISSILE_KEY, 18, 28, (ctx) => {
      // 尾焰（外焰渐变 + 亮焰心）
      fillLinear(
        ctx,
        [
          [4, 12],
          [4, 28],
          [14, 28],
          [14, 12],
        ],
        [
          [0, 0xffb070, 0.55],
          [0.5, 0xff8c4a, 0.3],
          [1, 0xff8c4a, 0],
        ],
        9,
        12,
        9,
        28,
      );
      fillLinear(
        ctx,
        [
          [6.5, 13],
          [6.5, 26],
          [11.5, 26],
          [11.5, 13],
        ],
        [
          [0, 0xfff0c0, 0.95],
          [0.6, 0xffd080, 0.55],
          [1, 0xffc070, 0],
        ],
        9,
        13,
        9,
        26,
      );
      // 尾翼
      fillPoly(ctx, [[3, 11], [1, 17], [4.5, 16]], 0xc05020, 0.95);
      fillPoly(ctx, [[15, 11], [17, 17], [13.5, 16]], 0xc05020, 0.95);
      // 弹体（横向渐变圆柱感）
      fillLinear(
        ctx,
        [
          [3, 3],
          [3, 15],
          [15, 15],
          [15, 3],
        ],
        [
          [0, 0x8a3018],
          [0.3, 0xffb870],
          [0.55, 0xfff0d0],
          [1, 0xa83a18],
        ],
        3,
        3,
        15,
        3,
      );
      // 弹头（径向发光红）
      radialBall(ctx, 9, 4, 4, [
        [0, 0xfff2dd],
        [0.4, 0xff8a5c],
        [1, 0xd23a1f],
      ]);
      // 高光
      strokeLine(ctx, 7.2, 6, 7.2, 13, 0xffffff, 1.2, 0.7);
    });
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

  get isHoming(): boolean {
    return this.target !== undefined;
  }

  /** 尾迹末端（沿速度反方向延伸），供外部绘制拖尾光 */
  get trailTail(): { x: number; y: number } {
    const speed = Math.hypot(this.vx, this.vy) || 1;
    const len = 15;
    return {
      x: this.x - (this.vx / speed) * len,
      y: this.y - (this.vy / speed) * len,
    };
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
