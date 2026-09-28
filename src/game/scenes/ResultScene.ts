import Phaser from 'phaser';
import { getLevelConfig } from '../level/LevelManager';
import { SaveManager } from '../save/SaveManager';
import { GAME_WIDTH } from '../viewport';

export interface ResultData {
  victory: boolean;
  levelId: number;
  elapsedTimeMs: number;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  score: number;
}

export class ResultScene extends Phaser.Scene {
  private result!: ResultData;
  constructor() {
    super('ResultScene');
  }
  init(data: ResultData): void {
    this.result = data;
  }
  create(): void {
    const data = this.result;
    const coins = data.victory ? getLevelConfig(data.levelId).rewards.coins : 0;
    const manager = new SaveManager();
    const save = manager.load();
    if (data.victory) {
      save.highestUnlockedLevel = Math.max(
        save.highestUnlockedLevel,
        Math.min(5, data.levelId + 1),
      );
      save.totalCoins += coins;
      if (data.levelId === 5) save.stats.bossesKilled += 1;
    }
    save.stats.totalKills += data.kills;
    save.stats.totalPlayTimeMs += data.elapsedTimeMs;
    manager.save(save);
    this.add
      .text(GAME_WIDTH / 2, 230, data.victory ? '关卡完成' : '任务失败', {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: data.victory ? '#a4ffd6' : '#ff7373',
      })
      .setOrigin(0.5);
    const lines = [
      `第 ${data.levelId} 关`,
      `用时 ${(data.elapsedTimeMs / 1000).toFixed(1)} 秒`,
      `击落 ${data.kills} 架`,
      `造成伤害 ${Math.round(data.damageDealt)}`,
      `受到伤害 ${Math.round(data.damageTaken)}`,
      `得分 ${data.score}`,
      `金币 +${coins}`,
    ];
    this.add
      .text(GAME_WIDTH / 2, 405, lines.join('\n'), {
        fontFamily: 'Arial',
        fontSize: '23px',
        color: '#e3eff5',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5);
    const button = (y: number, label: string, action: () => void): void => {
      this.add
        .text(GAME_WIDTH / 2, y, label, {
          fontFamily: 'Arial',
          fontSize: '25px',
          color: '#ffffff',
          backgroundColor: '#235377',
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', action);
    };
    if (data.victory && data.levelId < 5)
      button(670, '下一关', () =>
        this.scene.start('GameScene', { levelId: data.levelId + 1 }),
      );
    button(735, '重新挑战', () =>
      this.scene.start('GameScene', { levelId: data.levelId }),
    );
    button(800, '返回主菜单', () => this.scene.start('MainMenuScene'));
  }
}
