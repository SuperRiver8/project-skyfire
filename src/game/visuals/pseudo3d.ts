import Phaser from 'phaser';

export type Ctx2D = CanvasRenderingContext2D;
export type Point = readonly [number, number];
/** 渐变停靠点：[位置 0~1, 颜色, 透明度?] */
export type Stop = [number, number, number?];

/**
 * 生成（或复用）canvas 纹理并执行绘制，最后刷新到 GPU。
 * 用 Canvas 2D 渐变能力绘制带光照感的伪 3D 贴图。
 */
export function canvasArt(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: Ctx2D) => void,
): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, width, height);
  if (!tex) return;
  draw(tex.getContext());
  tex.refresh();
}

/** 将 0xRRGGBB 数值颜色转换为 CSS rgba 字符串 */
export function rgba(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 描出多边形路径 */
export function tracePoly(ctx: Ctx2D, points: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1)
    ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

/** 以线性渐变填充多边形，模拟曲面受光 */
export function fillLinear(
  ctx: Ctx2D,
  points: Point[],
  stops: Stop[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, color, alpha = 1] of stops)
    grad.addColorStop(offset, rgba(color, alpha));
  tracePoly(ctx, points);
  ctx.fillStyle = grad;
  ctx.fill();
}

/** 实色填充多边形 */
export function fillPoly(
  ctx: Ctx2D,
  points: Point[],
  color: number,
  alpha = 1,
): void {
  tracePoly(ctx, points);
  ctx.fillStyle = rgba(color, alpha);
  ctx.fill();
}

/** 带外发光地填充多边形（shadowBlur 光晕 + 本体），用于轮廓泛光 */
export function glowPoly(
  ctx: Ctx2D,
  points: Point[],
  color: number,
  blur: number,
  alpha = 1,
): void {
  ctx.save();
  ctx.shadowColor = rgba(color, alpha);
  ctx.shadowBlur = blur;
  ctx.fillStyle = rgba(color, alpha);
  tracePoly(ctx, points);
  ctx.fill();
  ctx.fill();
  ctx.restore();
}

/** 径向渐变球体：高光点偏移左上，营造球面立体感 */
export function radialBall(
  ctx: Ctx2D,
  x: number,
  y: number,
  radius: number,
  stops: Stop[],
): void {
  const grad = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.4,
    radius * 0.08,
    x,
    y,
    radius,
  );
  for (const [offset, color, alpha = 1] of stops)
    grad.addColorStop(offset, rgba(color, alpha));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** 带外发光的径向球体（发光核心、指示灯） */
export function glowBall(
  ctx: Ctx2D,
  x: number,
  y: number,
  radius: number,
  stops: Stop[],
  blur: number,
): void {
  ctx.save();
  ctx.shadowColor = rgba(stops[0][1], stops[0][2] ?? 1);
  ctx.shadowBlur = blur;
  radialBall(ctx, x, y, radius, stops);
  radialBall(ctx, x, y, radius, stops);
  ctx.restore();
}

/** 细亮线（机翼前沿、高光条） */
export function strokeLine(
  ctx: Ctx2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  width: number,
  alpha = 1,
): void {
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
