// Boss 预警包含在关卡时长内，不额外推迟出场；旧波次按参考时长等比例调整。
export const levelProgressConfig = {
  bossWarningMs: 1_100,
  levels: {
    1: { bossAtMs: 60_000, waveTimelineMs: 75_000 },
    2: { bossAtMs: 60_000, waveTimelineMs: 90_000 },
    3: { bossAtMs: 60_000, waveTimelineMs: 95_000 },
    4: { bossAtMs: 60_000, waveTimelineMs: 110_000 },
    5: { bossAtMs: 60_000, waveTimelineMs: 28_000 },
  },
} as const;
