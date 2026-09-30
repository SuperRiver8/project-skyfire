import type Phaser from 'phaser';
import { canvasArt } from './pseudo3d';

/** 固定椭圆共用纹理，避免每架敌机每帧重复提交椭圆网格。 */
export function ellipseImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha: number,
): Phaser.GameObjects.Image {
  const key = `ellipse_${width}_${height}`;
  canvasArt(scene, key, width, height, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(
      width / 2,
      height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });
  return scene.add.image(x, y, key).setTint(color).setAlpha(alpha);
}
