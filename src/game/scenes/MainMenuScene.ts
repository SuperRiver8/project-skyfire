import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../save/SaveManager';
import { createMenuCoverArt } from '../ui/MenuCoverArt';
import { SoundToggle } from '../ui/SoundToggle';
import { GAME_WIDTH } from '../viewport';

export class MainMenuScene extends Phaser.Scene {
  private readonly onEnter = (): void => {
    AudioManager.unlock();
    this.scene.start('GameScene', { levelId: 1 });
  };

  constructor() {
    super('MainMenuScene');
  }
  create(): void {
    const manager = new SaveManager();
    const save = manager.load();
    createMenuCoverArt(this);

    const headingAccent = this.add.graphics();
    headingAccent.lineStyle(2, 0x44c9f3, 0.8);
    headingAccent.lineBetween(74, 110, 178, 110);
    headingAccent.lineBetween(362, 110, 466, 110);

    this.add
      .text(GAME_WIDTH / 2, 110, 'PROJECT  SKYFIRE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#83ddf8',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 185, '天火计划', {
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        fontSize: '62px',
        fontStyle: 'bold',
        color: '#f4fbff',
      })
      .setOrigin(0.5)
      .setStroke('#134b6c', 4)
      .setShadow(0, 5, '#32c9ff', 15, true, true);
    this.add
      .text(GAME_WIDTH / 2, 258, '穿越弹幕  ·  守护天空', {
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        fontSize: '21px',
        color: '#ffd69a',
      })
      .setOrigin(0.5);

    const playButton = this.add
      .rectangle(GAME_WIDTH / 2, 767, 386, 78, 0x177baa)
      .setStrokeStyle(3, 0x89eaff)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playButton.setFillStyle(0x2698c4))
      .on('pointerout', () => playButton.setFillStyle(0x177baa))
      .on('pointerdown', this.onEnter);
    this.add
      .text(GAME_WIDTH / 2, 767, '开始游戏   ▶', {
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 826, '从第一关开始  ·  自动射击', {
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        fontSize: '17px',
        color: '#a8d9e8',
      })
      .setOrigin(0.5);
    new SoundToggle(
      this,
      GAME_WIDTH / 2,
      875,
      save.settings.sfxVolume > 0,
      () => {
        save.settings.sfxVolume = save.settings.sfxVolume > 0 ? 0 : 0.7;
        manager.save(save);
        if (save.settings.sfxVolume > 0) {
          AudioManager.unlock();
          const preview = new AudioManager();
          preview.setSfxVolume(save.settings.sfxVolume);
          preview.playSfx('pickup');
        }
        return save.settings.sfxVolume > 0;
      },
      20,
    );
    this.add
      .text(GAME_WIDTH / 2, 932, 'WASD / 方向键移动  ·  拖动操控', {
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        fontSize: '15px',
        color: '#79a9c0',
      })
      .setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', this.onEnter);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.off('keydown-ENTER', this.onEnter),
    );
  }
}
