import Phaser from 'phaser';
import { playerBalance } from '../../config/balance/playerBalance';
import { expRequired, type PlayerProgress } from '../player/PlayerProgress';
import type { PlayerHealth } from '../player/PlayerHealth';

export class CombatHud {
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly expFill: Phaser.GameObjects.Rectangle;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly expText: Phaser.GameObjects.Text;
  private displayedHp?: number;
  private displayedLevel?: number;
  private displayedExp?: number;
  private requiredExp = 0;

  constructor(scene: Phaser.Scene) {
    const labelStyle = {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '15px',
      color: '#e8f7ff',
    };
    scene.add
      .rectangle(96, 60, 152, 14, 0x133b43, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(40);
    this.hpFill = scene.add
      .rectangle(96, 60, 152, 10, 0x58e5b4)
      .setOrigin(0, 0.5)
      .setDepth(41);
    scene.add.text(20, 49, '生命', labelStyle).setDepth(41);
    this.hpText = scene.add
      .text(255, 51, '100/100', { ...labelStyle, fontSize: '13px' })
      .setDepth(41);
    this.levelText = scene.add
      .text(20, 79, 'LV 1', {
        ...labelStyle,
        fontStyle: 'bold',
        color: '#ffe49a',
      })
      .setDepth(41);
    scene.add
      .rectangle(96, 91, 152, 10, 0x143447, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(40);
    this.expFill = scene.add
      .rectangle(96, 91, 0, 7, 0x53caff)
      .setOrigin(0, 0.5)
      .setDepth(41);
    this.expText = scene.add
      .text(255, 82, '0/40', {
        ...labelStyle,
        fontSize: '13px',
        color: '#94dfff',
      })
      .setDepth(41);
  }

  update(health: PlayerHealth, progress: PlayerProgress): void {
    // 文本纹理只在显示值变化时重建，避免战斗中每帧重复上传。
    if (health.hp !== this.displayedHp) {
      this.displayedHp = health.hp;
      this.hpText.setText(`${health.hp}/${playerBalance.maxHp}`);
      this.hpFill.width = 152 * Math.max(0, health.hp / playerBalance.maxHp);
    }
    const levelChanged = progress.level !== this.displayedLevel;
    if (levelChanged) {
      this.displayedLevel = progress.level;
      this.requiredExp = expRequired(progress.level);
      this.levelText.setText(`LV ${progress.level}`);
    }
    if (progress.exp !== this.displayedExp || levelChanged) {
      this.displayedExp = progress.exp;
      this.expFill.width =
        152 * Math.max(0, Math.min(1, progress.exp / this.requiredExp));
      this.expText.setText(`${progress.exp}/${this.requiredExp}`);
    }
  }
}
