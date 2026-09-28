import Phaser from 'phaser';
import { canvasArt, fillLinear } from './pseudo3d';

export const FLAME_KEY = 'engine_flame';

/**
 * 引擎喷射火焰贴图：三层锥形渐变（外焰 → 内焰 → 焰心），
 * 白色底 + setTint 着色即可得到任意颜色，焰尖朝下。
 * 需要反方向喷射（敌机、Boss）时用 setFlipY(true)。
 */
export function ensureFlameArt(scene: Phaser.Scene): void {
  canvasArt(scene, FLAME_KEY, 36, 48, (ctx) => {
    // 外焰
    fillLinear(
      ctx,
      [
        [18, 2],
        [2, 46],
        [34, 46],
      ],
      [
        [0, 0xffffff, 0.5],
        [0.35, 0xffffff, 0.26],
        [1, 0xffffff, 0],
      ],
      18,
      2,
      18,
      46,
    );
    // 内焰
    fillLinear(
      ctx,
      [
        [18, 4],
        [8, 40],
        [28, 40],
      ],
      [
        [0, 0xffffff, 0.9],
        [0.55, 0xffffff, 0.62],
        [1, 0xffffff, 0],
      ],
      18,
      4,
      18,
      40,
    );
    // 焰心
    fillLinear(
      ctx,
      [
        [18, 6],
        [12, 32],
        [24, 32],
      ],
      [
        [0, 0xffffff],
        [0.6, 0xffffff, 0.8],
        [1, 0xffffff, 0],
      ],
      18,
      6,
      18,
      32,
    );
  });
}
