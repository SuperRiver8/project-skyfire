export interface AircraftVisualConfig {
  maxRollDegrees: number;
  rollResponseMs: number;
  rollReturnMs: number;
  referenceSpeed: number;
  wingPerspective: number;
  bodyCompression: number;
  shadowOffsetPx: number;
  shadowAlpha: number;
  flameBaseScale: number;
  flameSpeedInfluence: number;
  flameBankOffsetPx: number;
  bobPx: number;
  bobPeriodMs: number;
  highlightStrength: number;
  trailSpeedRatio: number;
  trailIntervalMs: number;
}

export const aircraftVisuals = {
  player: {
    maxRollDegrees: 12,
    rollResponseMs: 85,
    rollReturnMs: 165,
    referenceSpeed: 300,
    wingPerspective: 0.06,
    bodyCompression: 0.025,
    shadowOffsetPx: 4,
    shadowAlpha: 0.23,
    flameBaseScale: 1,
    flameSpeedInfluence: 0.12,
    flameBankOffsetPx: 5,
    bobPx: 1.5,
    bobPeriodMs: 1200,
    highlightStrength: 0.24,
    trailSpeedRatio: 0.72,
    trailIntervalMs: 46,
  },
  light: {
    maxRollDegrees: 14,
    rollResponseMs: 80,
    rollReturnMs: 145,
    referenceSpeed: 210,
    wingPerspective: 0.06,
    bodyCompression: 0.028,
    shadowOffsetPx: 3,
    shadowAlpha: 0.2,
    flameBaseScale: 0.8,
    flameSpeedInfluence: 0.15,
    flameBankOffsetPx: 4,
    bobPx: 1.1,
    bobPeriodMs: 950,
    highlightStrength: 0.2,
    trailSpeedRatio: 0.8,
    trailIntervalMs: 48,
  },
  medium: {
    maxRollDegrees: 10,
    rollResponseMs: 120,
    rollReturnMs: 180,
    referenceSpeed: 210,
    wingPerspective: 0.05,
    bodyCompression: 0.02,
    shadowOffsetPx: 3,
    shadowAlpha: 0.22,
    flameBaseScale: 0.9,
    flameSpeedInfluence: 0.12,
    flameBankOffsetPx: 3,
    bobPx: 0.8,
    bobPeriodMs: 1300,
    highlightStrength: 0.18,
    trailSpeedRatio: 0.85,
    trailIntervalMs: 55,
  },
  heavy: {
    maxRollDegrees: 5,
    rollResponseMs: 260,
    rollReturnMs: 330,
    referenceSpeed: 95,
    wingPerspective: 0.035,
    bodyCompression: 0.012,
    shadowOffsetPx: 2,
    shadowAlpha: 0.28,
    flameBaseScale: 1.15,
    flameSpeedInfluence: 0.06,
    flameBankOffsetPx: 2,
    bobPx: 0.45,
    bobPeriodMs: 1600,
    highlightStrength: 0.14,
    trailSpeedRatio: 0.9,
    trailIntervalMs: 65,
  },
  boss: {
    maxRollDegrees: 3,
    rollResponseMs: 300,
    rollReturnMs: 360,
    referenceSpeed: 210,
    wingPerspective: 0.035,
    bodyCompression: 0.012,
    shadowOffsetPx: 3,
    shadowAlpha: 0.3,
    flameBaseScale: 1.2,
    flameSpeedInfluence: 0.08,
    flameBankOffsetPx: 3,
    bobPx: 0.7,
    bobPeriodMs: 1700,
    highlightStrength: 0.16,
    trailSpeedRatio: 0.9,
    trailIntervalMs: 55,
  },
} as const satisfies Record<string, AircraftVisualConfig>;

export const aircraftEffectVisuals = {
  trailLifeMs: 155,
  trailPoolSize: 32,
  trailMaxActive: 72,
  enemyDeathMs: 145,
  playerHitMs: 170,
  bossDashVisualMs: 220,
} as const;
