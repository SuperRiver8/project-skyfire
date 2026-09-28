import Phaser from 'phaser';

export type BulletStyle = 'machine' | 'spread';
const BULLET_WIDTH = 16;
const BULLET_HEIGHT = 36;
const STYLES: Record<BulletStyle, [number, number]> = {
  machine: [0x31caff, 0xf2ffff],
  spread: [0xff68bd, 0xffe7f7],
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
      if (scene.textures.exists(key)) continue;
      const [glow, core] = STYLES[style];
      const graphics = scene.add.graphics();
      graphics.fillStyle(glow, 0.22);
      graphics.fillRoundedRect(0, 4, BULLET_WIDTH, 32, 8);
      graphics.fillStyle(glow, 0.85);
      graphics.fillRoundedRect(3, 8, 10, 23, 5);
      graphics.fillStyle(core);
      graphics.fillRoundedRect(6, 4, 4, 24, 2);
      graphics.fillTriangle(8, 0, 4, 10, 12, 10);
      graphics.generateTexture(key, BULLET_WIDTH, BULLET_HEIGHT);
      graphics.destroy();
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
