import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../save/SaveManager';
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
    this.add
      .text(GAME_WIDTH / 2, 260, '天火计划', {
        fontFamily: 'Arial',
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#e8f7ff',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 325, '准备起飞', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#91cbdc',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 450, '开始游戏', {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#235e87',
        padding: { x: 44, y: 18 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', this.onEnter);
    this.add
      .text(GAME_WIDTH / 2, 570, 'WASD / 方向键移动 · 拖动操控 · 自动射击', {
        fontFamily: 'Arial',
        fontSize: '17px',
        color: '#91cbdc',
      })
      .setOrigin(0.5);
    new SoundToggle(
      this,
      GAME_WIDTH / 2,
      660,
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
    );
    this.input.keyboard?.once('keydown-ENTER', this.onEnter);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.off('keydown-ENTER', this.onEnter),
    );
  }
}
