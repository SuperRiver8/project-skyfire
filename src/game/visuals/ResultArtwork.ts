import type Phaser from 'phaser';
import { GAME_WIDTH } from '../viewport';

export const RESULT_ART_KEYS = {
  victory: 'result_victory_xiaoyin',
  defeat: 'result_encouragement_xiaoyin',
} as const;

// 保留原图配色，用游戏的深蓝底、金色与青色线条衔接战报界面。
export function createResultArtwork(
  scene: Phaser.Scene,
  victory: boolean,
  levelId: number,
): void {
  const accent = victory ? 0xffd76a : 0xff967d;
  const card = scene.add.graphics().setDepth(4);
  card.fillStyle(0x081a2c, 0.91);
  card.fillRoundedRect(15, 65, 510, 505, 22);
  card.lineStyle(2, accent, 0.74);
  card.strokeRoundedRect(15, 65, 510, 505, 22);
  card.lineStyle(2, 0x72dff5, 0.42);
  card.lineBetween(44, 86, 127, 86);
  card.lineBetween(413, 86, 496, 86);
  card.lineBetween(44, 550, 127, 550);
  card.lineBetween(413, 550, 496, 550);
  for (const [x, y] of [
    [40, 145],
    [500, 218],
    [40, 447],
    [500, 515],
  ]) {
    card.lineStyle(2, accent, 0.82);
    card.lineBetween(x - 7, y, x + 7, y);
    card.lineBetween(x, y - 7, x, y + 7);
  }

  scene.add
    .text(
      GAME_WIDTH / 2,
      37,
      victory ? '五关通关 · 凯旋' : `第 ${levelId} 关 · 挑战结束`,
      {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        color: victory ? '#ffe4a0' : '#ffc3ac',
      },
    )
    .setOrigin(0.5)
    .setDepth(12);

  const picture = scene.add
    .image(
      GAME_WIDTH / 2,
      330,
      victory ? RESULT_ART_KEYS.victory : RESULT_ART_KEYS.defeat,
    )
    .setDisplaySize(490, 490)
    .setAlpha(0)
    .setDepth(12);
  scene.tweens.add({
    targets: picture,
    alpha: 1,
    y: 315,
    duration: 540,
    ease: 'Back.easeOut',
  });
}
