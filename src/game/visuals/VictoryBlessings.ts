import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';

export const VICTORY_BLESSING_KEYS = [
  'blessing_tangtang',
  'blessing_xiangxiang',
] as const;

const blessings = [
  { key: VICTORY_BLESSING_KEYS[0], name: '糖糖', accent: 0xffd76a },
  { key: VICTORY_BLESSING_KEYS[1], name: '锶锶', accent: 0x78ddf5 },
] as const;

const HOLD_MS = 2000;
const FADE_MS = 850;

// 过关后先展示两份祝福，再进入下一关或最终结算。
export function playVictoryBlessings(
  scene: Phaser.Scene,
  levelId: number,
  onFinished: () => void,
): void {
  const veil = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x061325,
    0.94,
  );
  const glow = scene.add.graphics();
  const frame = scene.add.graphics();
  const heading = scene.add
    .text(GAME_WIDTH / 2, 94, `第 ${levelId} 关 · 胜利祝福`, {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffe5a1',
    })
    .setOrigin(0.5)
    .setShadow(0, 0, '#d68742', 15, true, true);
  const subtitle = scene.add
    .text(GAME_WIDTH / 2, 146, '', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '22px',
      color: '#d9f6ff',
    })
    .setOrigin(0.5);
  const picture = scene.add
    .image(GAME_WIDTH / 2, 480, blessings[0].key)
    .setDisplaySize(520, 520);
  const counter = scene.add
    .text(GAME_WIDTH / 2, 800, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#a9d6e6',
    })
    .setOrigin(0.5);
  const panel = scene.add
    .container(0, 0, [veil, glow, frame, heading, subtitle, picture, counter])
    .setDepth(200);

  const show = (index: number): void => {
    const blessing = blessings[index];
    glow.clear();
    glow.fillStyle(blessing.accent, 0.09);
    glow.fillCircle(GAME_WIDTH / 2, 465, 285);
    glow.fillStyle(0xff78b6, 0.06);
    glow.fillCircle(GAME_WIDTH / 2, 465, 215);

    frame.clear();
    frame.fillStyle(0x0b2139, 0.5);
    frame.fillRoundedRect(23, 173, 494, 575, 22);
    frame.lineStyle(2, blessing.accent, 0.63);
    frame.strokeRoundedRect(23, 173, 494, 575, 22);
    frame.lineStyle(2, 0x6ce6ff, 0.38);
    frame.lineBetween(100, 125, 178, 125);
    frame.lineBetween(362, 125, 440, 125);
    for (const [x, y] of [
      [57, 212],
      [480, 275],
      [65, 648],
      [473, 695],
    ]) {
      frame.lineStyle(2, blessing.accent, 0.8);
      frame.lineBetween(x - 9, y, x + 9, y);
      frame.lineBetween(x, y - 9, x, y + 9);
    }

    subtitle.setText(`来自${blessing.name}的祝福`);
    counter.setText(`${index + 1} / ${blessings.length}`);
    picture.setTexture(blessing.key).setDisplaySize(520, 520).setAlpha(1);
    scene.tweens.add({
      targets: picture,
      alpha: 0,
      delay: HOLD_MS,
      duration: FADE_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (index + 1 < blessings.length) {
          show(index + 1);
          return;
        }
        scene.tweens.add({
          targets: panel,
          alpha: 0,
          duration: 250,
          onComplete: () => {
            panel.destroy(true);
            onFinished();
          },
        });
      },
    });
  };

  show(0);
}
