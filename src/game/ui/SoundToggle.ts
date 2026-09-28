import Phaser from 'phaser';

export class SoundToggle extends Phaser.GameObjects.Text {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enabled: boolean,
    toggle: () => boolean,
    fontSize = 24,
  ) {
    super(scene, x, y, '', {
      fontFamily: 'Segoe UI Emoji, Microsoft YaHei, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#e6f7ff',
      backgroundColor: '#173955',
      padding: { x: 20, y: 10 },
    });
    scene.add.existing(this);
    this.setOrigin(0.5).setInteractive();
    this.setEnabled(enabled);
    this.on('pointerdown', () => this.setEnabled(toggle()));
  }

  setEnabled(enabled: boolean): void {
    this.setText(enabled ? '🔊 声音开启' : '🔇 已静音');
  }
}
