import Phaser from 'phaser';
import { itemVisuals } from '../../config/items/itemVisuals';
import { itemConfigs, type ItemId } from '../../config/items/items';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import { ensureItemArt } from './ItemPickup';

export class ItemEffects {
  private readonly freezeOverlay: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly aircraft: PlayerAircraft,
  ) {
    this.freezeOverlay = scene.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x82cfff,
        0,
      )
      .setDepth(36);
  }

  pickup(id: ItemId, x: number, y: number): void {
    const visual = itemVisuals[id];
    ensureItemArt(this.scene);
    const orb = this.scene.add
      .image(x, y, 'item_orb')
      .setTint(visual.color)
      .setDepth(38);
    const glyph = this.scene.add
      .text(x, y, visual.glyph, {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#102139',
      })
      .setOrigin(0.5)
      .setDepth(39);
    const label = this.scene.add
      .text(x, y - 32, itemConfigs[id].name, {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#f4fbff',
      })
      .setOrigin(0.5)
      .setDepth(39);
    this.scene.tweens.add({
      targets: label,
      y: y - 58,
      alpha: 0,
      duration: 850,
      onComplete: () => label.destroy(),
    });
    const flight = { progress: 0 };
    this.scene.tweens.add({
      targets: flight,
      progress: 1,
      duration: 230,
      ease: 'Cubic.easeIn',
      onUpdate: () => {
        const xNow = x + (this.aircraft.x - x) * flight.progress;
        const yNow = y + (this.aircraft.y - 7 - y) * flight.progress;
        orb.setPosition(xNow, yNow).setScale(1 - flight.progress * 0.55);
        glyph.setPosition(xNow, yNow).setScale(1 - flight.progress * 0.55);
      },
      onComplete: () => {
        orb.destroy();
        glyph.destroy();
        this.ring(this.aircraft.x, this.aircraft.y, visual.color, 72);
      },
    });
  }

  ring(x: number, y: number, color: number, radius: number): void {
    const circle = this.scene.add
      .circle(x, y, 16, color, 0)
      .setStrokeStyle(4, color, 0.9)
      .setDepth(37);
    this.scene.tweens.add({
      targets: circle,
      scale: radius / 16,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => circle.destroy(),
    });
  }

  screenPulse(color: number, alpha = 0.4): void {
    const flash = this.scene.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        color,
        alpha,
      )
      .setDepth(37);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 330,
      onComplete: () => flash.destroy(),
    });
    this.ring(GAME_WIDTH / 2, GAME_HEIGHT / 2, color, 670);
  }

  empGlitch(): void {
    for (let i = 0; i < 7; i += 1) {
      const strip = this.scene.add
        .rectangle(
          GAME_WIDTH / 2,
          95 + i * 120,
          GAME_WIDTH,
          3 + (i % 3) * 4,
          i % 2 ? 0xe7ffff : 0x4f9dff,
          0.5,
        )
        .setDepth(38);
      this.scene.tweens.add({
        targets: strip,
        x: GAME_WIDTH / 2 + (i % 2 ? -34 : 34),
        alpha: 0,
        duration: 190 + i * 28,
        onComplete: () => strip.destroy(),
      });
    }
  }

  update(frozen: boolean): void {
    const filter = frozen ? 'saturate(0.55)' : '';
    if (this.scene.game.canvas.style.filter !== filter)
      this.scene.game.canvas.style.filter = filter;
    this.freezeOverlay.setAlpha(frozen ? 0.09 : 0);
  }

  destroy(): void {
    this.scene.game.canvas.style.filter = '';
    this.freezeOverlay.destroy();
  }
}
