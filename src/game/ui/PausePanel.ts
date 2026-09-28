import Phaser from 'phaser';
import { ensureEnemyArt, ensurePlayerArt } from '../aircraft/AircraftArt';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';

export class PausePanel {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  constructor(
    scene: Phaser.Scene,
    resume: () => void,
    restart: () => void,
    quit: () => void,
    levelId: number,
    playerLevel: number,
  ) {
    ensurePlayerArt(scene);
    ensureEnemyArt(scene);
    const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      this.objects.push(object);
      return object;
    };
    const backdrop = add(scene.add.graphics().setDepth(100));
    const top = Phaser.Display.Color.ValueToColor(0x050b1c);
    const bottom = Phaser.Display.Color.ValueToColor(0x102d49);
    for (let y = 0; y < GAME_HEIGHT; y += 16) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        top,
        bottom,
        GAME_HEIGHT,
        y,
      );
      backdrop.fillStyle(
        Phaser.Display.Color.GetColor(color.r, color.g, color.b),
        1,
      );
      backdrop.fillRect(0, y, GAME_WIDTH, 16);
    }
    backdrop.lineStyle(1, 0x65dfff, 0.1);
    for (let x = -120; x < GAME_WIDTH; x += 72)
      backdrop.lineBetween(x, 0, x + 160, GAME_HEIGHT);
    for (let i = 0; i < 56; i += 1) {
      const x = (i * 137 + 47) % GAME_WIDTH;
      const y = (i * 223 + 31) % 700;
      backdrop.fillStyle(0xb7edff, i % 7 === 0 ? 0.62 : 0.25);
      backdrop.fillCircle(x, y, i % 7 === 0 ? 1.5 : 0.8);
    }
    backdrop.fillStyle(0x27bfff, 0.06);
    backdrop.fillCircle(270, 395, 165);
    backdrop.lineStyle(2, 0x65dfff, 0.25);
    backdrop.strokeCircle(270, 395, 165);
    backdrop.lineStyle(1, 0x65dfff, 0.14);
    backdrop.strokeCircle(270, 395, 202);
    backdrop.fillStyle(0x0b2039, 0.92);
    backdrop.fillTriangle(0, 640, 0, GAME_HEIGHT, 270, 728);
    backdrop.fillTriangle(GAME_WIDTH, 640, GAME_WIDTH, GAME_HEIGHT, 270, 728);
    backdrop.lineStyle(2, 0x46d5ff, 0.26);
    backdrop.lineBetween(0, 640, 270, 728);
    backdrop.lineBetween(GAME_WIDTH, 640, 270, 728);

    add(
      scene.add
        .image(90, 326, 'enemy_zigzag')
        .setScale(0.85)
        .setAlpha(0.72)
        .setDepth(101),
    );
    add(
      scene.add
        .image(450, 326, 'enemy_scout')
        .setScale(0.85)
        .setAlpha(0.72)
        .setDepth(101),
    );
    add(
      scene.add
        .image(270, 297, 'enemy_tank')
        .setScale(0.95)
        .setAlpha(0.8)
        .setDepth(101),
    );
    add(scene.add.circle(270, 505, 93, 0x28b9ff, 0.11).setDepth(101));
    add(scene.add.image(270, 476, 'player_form_2').setScale(2.4).setDepth(102));
    add(
      scene.add
        .text(270, 101, 'PROJECT  SKYFIRE', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#83ddf8',
        })
        .setOrigin(0.5)
        .setDepth(102),
    );
    add(
      scene.add
        .text(270, 170, '游戏暂停', {
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
          fontSize: '54px',
          fontStyle: 'bold',
          color: '#f3fbff',
        })
        .setOrigin(0.5)
        .setStroke('#134b6c', 4)
        .setShadow(0, 5, '#32c9ff', 13, true, true)
        .setDepth(102),
    );
    add(
      scene.add
        .text(270, 226, `第 ${levelId} 关  ·  战机 LV ${playerLevel}`, {
          fontFamily: 'Microsoft YaHei, sans-serif',
          fontSize: '20px',
          color: '#ffd69a',
        })
        .setOrigin(0.5)
        .setDepth(102),
    );

    const button = (
      y: number,
      title: string,
      action: () => void,
      primary = false,
    ): void => {
      const fill = primary ? 0x177baa : 0x173a59;
      const background = add(
        scene.add
          .rectangle(270, y, 360, 64, fill)
          .setStrokeStyle(2, primary ? 0x89eaff : 0x4d90b1)
          .setDepth(103),
      );
      add(
        scene.add
          .text(270, y, title, {
            fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
            fontSize: '25px',
            fontStyle: primary ? 'bold' : 'normal',
            color: '#f6fbff',
          })
          .setOrigin(0.5)
          .setDepth(104),
      );
      background
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () =>
          background.setFillStyle(primary ? 0x2698c4 : 0x235476),
        )
        .on('pointerout', () => background.setFillStyle(fill))
        .on('pointerdown', action);
    };
    button(704, '继续游戏   ▶', resume, true);
    button(786, '重新开始', restart);
    button(868, '返回主菜单', quit);
    add(
      scene.add
        .text(270, 936, 'ESC 继续战斗', {
          fontFamily: 'Arial, Microsoft YaHei, sans-serif',
          fontSize: '16px',
          color: '#83b7cf',
        })
        .setOrigin(0.5)
        .setDepth(102),
    );
  }
  destroy(): void {
    for (const object of this.objects) object.destroy();
  }
}
