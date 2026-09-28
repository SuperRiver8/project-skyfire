import Phaser from 'phaser';
import { canvasArt, fillLinear, fillPoly } from '../visuals/pseudo3d';

export type BulletStyle = 'machine' | 'spread';
const BULLET_WIDTH = 16;
const BULLET_HEIGHT = 36;
const STYLES: Record<BulletStyle, [number, number, number]> = {
  machine: [0x31caff, 0xf2ffff, 0x0e6da8],
  spread: [0xff68bd, 0xffe7f7, 0xa3286e],
};

export class Bullet extends Phaser.GameObjects.Image {
  damage = 0;
  pierce = 0;
  readonly hitTargets = new Set<object>();
  private velocityX = 0;
  private velocityY = 0;

  constructor(scene: Phaser.Scene) {
    for (const style of Object.keys(STYLES) as BulletStyle[]) {
      const key = `player_bullet_${style}`;
      const [glow, core, dark] = STYLES[style];
      canvasArt(scene, key, BULLET_WIDTH, BULLET_HEIGHT, (ctx) => {
        // 尾焰拖光（渐变消散）
        fillLinear(
          ctx,
          [
            [4.5, 4],
            [4.5, 34],
            [11.5, 34],
            [11.5, 4],
          ],
          [
            [0, glow, 0.7],
            [0.55, glow, 0.35],
            [1, glow, 0],
          ],
          8,
          4,
          8,
          34,
        );
        // 弹体（纵向渐变：亮头 → 深尾）
        fillLinear(
          ctx,
          [
            [4.5, 1],
            [4.5, 30],
            [11.5, 30],
            [11.5, 1],
          ],
          [
            [0, 0xffffff],
            [0.3, core],
            [0.75, glow],
            [1, dark],
          ],
          8,
          1,
          8,
          30,
        );
        // 弹头锥
        fillPoly(ctx, [[8, 0], [4.5, 8], [11.5, 8]], 0xffffff, 0.95);
        // 高光芯
        fillLinear(
          ctx,
          [
            [7, 2],
            [7, 26],
            [8.6, 26],
            [8.6, 2],
          ],
          [
            [0, 0xffffff, 0.95],
            [1, core, 0.5],
          ],
          7,
          2,
          8.6,
          26,
        );
      });
    }

    super(scene, 0, 0, 'player_bullet_machine');
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(
    x: number,
    y: number,
    velocityY: number,
    damage: number,
    velocityX = 0,
    pierce = 0,
    style: BulletStyle = 'machine',
  ): void {
    this.setPosition(x, y);
    this.setTexture(`player_bullet_${style}`);
    this.setRotation(Math.atan2(velocityX, -velocityY));
    this.velocityY = velocityY;
    this.velocityX = velocityX;
    this.damage = damage;
    this.pierce = pierce;
    this.hitTargets.clear();
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.damage = 0;
    this.pierce = 0;
    this.velocityY = 0;
    this.velocityX = 0;
    this.hitTargets.clear();
  }

  isActive(): boolean {
    return this.active;
  }

  advance(deltaMs: number): void {
    this.x += (this.velocityX * deltaMs) / 1000;
    this.y += (this.velocityY * deltaMs) / 1000;
  }

  isAboveScreen(): boolean {
    return this.y + this.displayHeight / 2 < 0 || this.x < -20 || this.x > 560;
  }

  registerHit(target: object): boolean {
    if (this.hitTargets.has(target)) return false;
    this.hitTargets.add(target);
    return true;
  }
}
