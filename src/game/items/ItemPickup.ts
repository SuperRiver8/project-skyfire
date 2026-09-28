import Phaser from 'phaser';
import { itemDropConfig, type ItemId } from '../../config/items/items';
import { itemVisuals } from '../../config/items/itemVisuals';
import { GAME_HEIGHT } from '../viewport';
import { canvasArt, radialBall } from '../visuals/pseudo3d';

const ORB_KEY = 'item_orb';
const RING_KEY = 'item_ring';

export function ensureItemArt(scene: Phaser.Scene): void {
  // 灰白渐变球体：激活时用 setTint 着上各自颜色
  canvasArt(scene, ORB_KEY, 32, 32, (ctx) => {
    radialBall(ctx, 16, 16, 16, [
      [0, 0xffffff, 0.45],
      [0.55, 0xffffff, 0.12],
      [1, 0xffffff, 0],
    ]);
    radialBall(ctx, 16, 16, 11.5, [
      [0, 0xffffff],
      [0.32, 0xe9eef6],
      [0.68, 0x98a4b8],
      [1, 0x3f475c],
    ]);
    radialBall(ctx, 19, 20, 4, [
      [0, 0xffffff, 0.28],
      [1, 0xffffff, 0],
    ]);
  });
  // 双环缺口光环：持续旋转
  canvasArt(scene, RING_KEY, 56, 56, (ctx) => {
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(28, 28, 23, -Math.PI * 1.25, Math.PI * 0.25);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(28, 28, 15.5, -Math.PI * 1.1, Math.PI * 0.1);
    ctx.stroke();
  });
}

export class ItemPickup extends Phaser.GameObjects.Container {
  itemId: ItemId = 'heal';
  private readonly halo: Phaser.GameObjects.Image;
  private readonly core: Phaser.GameObjects.Image;
  private readonly glyph: Phaser.GameObjects.Text;
  private lifeMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    ensureItemArt(scene);
    this.halo = scene.add.image(0, 0, RING_KEY);
    this.core = scene.add.image(0, 0, ORB_KEY);
    this.glyph = scene.add
      .text(0, 0, '', {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#10213a',
      })
      .setOrigin(0.5);
    this.add([this.halo, this.core, this.glyph]);
    this.setDepth(12).setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(x: number, y: number, itemId: ItemId): void {
    this.setPosition(x, y);
    this.itemId = itemId;
    const visual = itemVisuals[itemId];
    this.halo.setTint(visual.color).setRotation(0).setAlpha(0.95).setScale(1);
    this.core.setTint(visual.color).setAlpha(1).setScale(1);
    this.glyph.setText(visual.glyph);
    this.lifeMs = 0;
    this.setScale(1);
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.setScale(1);
    this.core.clearTint();
    this.halo.clearTint();
  }

  isActive(): boolean {
    return this.active;
  }

  advance(
    deltaMs: number,
    x: number,
    y: number,
    attractRadius = 100,
    collectRadius: number = itemDropConfig.pickupRadius,
  ): 'collect' | 'offscreen' | null {
    this.lifeMs += deltaMs;
    // 球体脉动 + 光环旋转，更有立体生机
    this.core.setScale(1 + Math.sin(this.lifeMs / 240) * 0.08);
    this.halo.rotation += deltaMs * 0.0035;
    this.halo.setScale(1 + Math.sin(this.lifeMs / 300 + 1.4) * 0.06);
    const dx = x - this.x,
      dy = y - this.y,
      distance = Math.hypot(dx, dy);
    if (distance < collectRadius) return 'collect';
    if (distance < attractRadius && distance > 0) {
      this.x += (dx / distance) * deltaMs * 0.4;
      this.y += (dy / distance) * deltaMs * 0.4;
    } else this.y += (itemDropConfig.fallSpeed * deltaMs) / 1000;
    return this.y > GAME_HEIGHT + 20 ? 'offscreen' : null;
  }
}
