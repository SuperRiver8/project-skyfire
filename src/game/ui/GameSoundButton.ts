import Phaser from 'phaser';

// 战斗界面的声音入口保持紧凑，暂停时由封面覆盖。
export class GameSoundButton {
  private readonly background: Phaser.GameObjects.Arc;
  private readonly icon: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enabled: boolean,
    toggle: () => boolean,
  ) {
    this.background = scene.add
      .circle(x, y, 24, 0x103c59, 0.92)
      .setStrokeStyle(2, 0x72dfff)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });
    this.icon = scene.add.graphics().setPosition(x, y).setDepth(51);
    this.setEnabled(enabled);
    this.background.on('pointerdown', () => this.setEnabled(toggle()));
    this.background.on('pointerover', () =>
      this.background.setFillStyle(0x176486),
    );
    this.background.on('pointerout', () =>
      this.background.setFillStyle(0x103c59, 0.92),
    );
  }

  setEnabled(enabled: boolean): void {
    const g = this.icon;
    g.clear();
    g.fillStyle(enabled ? 0xe7fbff : 0x9ebac9);
    g.fillRect(-12, -5, 7, 10);
    g.fillTriangle(-5, -5, 4, -12, 4, 12);
    g.lineStyle(2, enabled ? 0x7deaff : 0xff9c9c);
    if (enabled) {
      g.lineBetween(9, -7, 13, -3);
      g.lineBetween(13, -3, 13, 3);
      g.lineBetween(13, 3, 9, 7);
      g.lineBetween(13, -12, 18, -6);
      g.lineBetween(18, -6, 18, 6);
      g.lineBetween(18, 6, 13, 12);
    } else {
      g.lineBetween(8, -7, 18, 7);
      g.lineBetween(18, -7, 8, 7);
    }
  }
}
