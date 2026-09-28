import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import { SoundToggle } from './SoundToggle';

export class PausePanel {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  constructor(
    scene: Phaser.Scene,
    resume: () => void,
    restart: () => void,
    quit: () => void,
    soundEnabled: boolean,
    toggleSound: () => boolean,
  ) {
    this.objects.push(
      scene.add
        .rectangle(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2,
          GAME_WIDTH,
          GAME_HEIGHT,
          0x071326,
          0.9,
        )
        .setDepth(100),
    );
    this.objects.push(
      scene.add
        .text(GAME_WIDTH / 2, 290, '游戏暂停', {
          fontFamily: 'Arial',
          fontSize: '48px',
          color: '#e8f7ff',
        })
        .setOrigin(0.5)
        .setDepth(101),
    );
    const button = (y: number, title: string, action: () => void): void => {
      this.objects.push(
        scene.add
          .text(GAME_WIDTH / 2, y, title, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#235377',
            padding: { x: 22, y: 10 },
          })
          .setOrigin(0.5)
          .setInteractive()
          .setDepth(101)
          .on('pointerdown', action),
      );
    };
    button(420, '继续游戏', resume);
    button(500, '重新开始', restart);
    this.objects.push(
      new SoundToggle(
        scene,
        GAME_WIDTH / 2,
        580,
        soundEnabled,
        toggleSound,
        27,
      ).setDepth(101),
    );
    button(660, '返回主菜单', quit);
  }
  destroy(): void {
    for (const object of this.objects) object.destroy();
  }
}
