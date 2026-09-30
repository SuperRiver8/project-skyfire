/** 统计值统一四舍五入；运动坐标、倍率和内部计时仍保留精度。 */
export function integer(value: number): number {
  return Number.isFinite(value)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(value)))
    : 0;
}
