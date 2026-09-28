import type { AircraftVisualConfig } from '../../config/aircraft/aircraftVisuals';

export interface AircraftVisualPose {
  roll: number;
  bank: number;
  bodyScaleX: number;
  leftWingScaleX: number;
  rightWingScaleX: number;
  shadowX: number;
  shadowAlpha: number;
  flameX: number;
  flameScaleY: number;
  leftHighlightAlpha: number;
  rightHighlightAlpha: number;
  bobY: number;
  movingFast: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// 只计算姿态，不改世界坐标和命中框；键盘、触摸和 AI 共用实际横向速度。
export class AircraftVisualController {
  private roll = 0;
  private elapsedMs = 0;

  constructor(readonly config: AircraftVisualConfig) {}

  reset(): void {
    this.roll = 0;
    this.elapsedMs = 0;
  }

  update(deltaMs: number, velocityX: number, boost = 0): AircraftVisualPose {
    const elapsed = Math.max(0, deltaMs);
    this.elapsedMs += elapsed;
    const speed = clamp(velocityX / this.config.referenceSpeed, -1, 1);
    const maxRoll = (this.config.maxRollDegrees * Math.PI) / 180;
    const target = speed * maxRoll;
    const response =
      Math.abs(speed) > 0.025
        ? this.config.rollResponseMs
        : this.config.rollReturnMs;
    this.roll += (target - this.roll) * (1 - Math.exp(-elapsed / response));
    const bank = maxRoll > 0 ? clamp(this.roll / maxRoll, -1, 1) : 0;
    const pulse = 1 + 0.09 * Math.sin(this.elapsedMs / 78);
    const bobY =
      Math.sin((this.elapsedMs * Math.PI * 2) / this.config.bobPeriodMs) *
      this.config.bobPx;
    const highlightBase = 0.12;
    return {
      roll: this.roll,
      bank,
      bodyScaleX: 1 - Math.abs(bank) * this.config.bodyCompression,
      leftWingScaleX: 1 + bank * this.config.wingPerspective,
      rightWingScaleX: 1 - bank * this.config.wingPerspective,
      shadowX: -bank * this.config.shadowOffsetPx,
      shadowAlpha: this.config.shadowAlpha * (1 - Math.abs(bank) * 0.12),
      flameX: -bank * this.config.flameBankOffsetPx,
      flameScaleY:
        this.config.flameBaseScale *
        (1 + Math.abs(speed) * this.config.flameSpeedInfluence + boost) *
        pulse,
      leftHighlightAlpha:
        highlightBase + Math.max(0, bank) * this.config.highlightStrength,
      rightHighlightAlpha:
        highlightBase + Math.max(0, -bank) * this.config.highlightStrength,
      bobY,
      movingFast: Math.abs(speed) >= this.config.trailSpeedRatio,
    };
  }
}
