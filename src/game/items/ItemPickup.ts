import Phaser from 'phaser';
import { itemDropConfig, type ItemId } from '../../config/items/items';
import { itemVisuals } from '../../config/items/itemVisuals';
import { GAME_HEIGHT } from '../viewport';

export class ItemPickup extends Phaser.GameObjects.Container {
  itemId: ItemId = 'heal';
  private readonly halo: Phaser.GameObjects.Arc;
  private readonly core: Phaser.GameObjects.Arc;
  private readonly glyph: Phaser.GameObjects.Text;
  private lifeMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.halo = scene.add.circle(0, 0, 22, 0xffffff, 0.16);
    this.core = scene.add.circle(0, 0, 15, 0xffffff, 1);
    this.glyph = scene.add
      .text(0, 0, '', {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#122033',
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
    this.halo.setFillStyle(visual.color, 0.2);
    this.halo.setStrokeStyle(2, visual.color, 0.95);
    this.core.setFillStyle(visual.color);
    this.core.setStrokeStyle(2, 0xffffff, 0.9);
    this.glyph.setText(visual.glyph);
    this.lifeMs = 0;
    this.setScale(1);
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.setScale(1);
  }

  isActive(): boolean {
    return this.active;
  }

  advance(
    deltaMs: number,
    x: number,
    y: number,
  ): 'collect' | 'offscreen' | null {
    this.lifeMs += deltaMs;
    this.setScale(1 + Math.sin(this.lifeMs / 180) * 0.06);
    const dx = x - this.x,
      dy = y - this.y,
      distance = Math.hypot(dx, dy);
    if (distance < itemDropConfig.pickupRadius) return 'collect';
    if (distance < 100 && distance > 0) {
      this.x += (dx / distance) * deltaMs * 0.4;
      this.y += (dy / distance) * deltaMs * 0.4;
    } else this.y += (itemDropConfig.fallSpeed * deltaMs) / 1000;
    return this.y > GAME_HEIGHT + 20 ? 'offscreen' : null;
  }
}
