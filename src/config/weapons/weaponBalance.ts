export const weaponBalance = {
  maxSlots: 3,
  spread: { intervalMs: 650, damage: 7, speed: 700, maxLevel: 5 },
  laser: {
    intervalMs: 900,
    damage: 24,
    durationMs: 110,
    width: 15,
    maxLevel: 5,
  },
  missile: {
    intervalMs: 1400,
    damage: 32,
    speed: 340,
    radius: 52,
    maxLevel: 5,
  },
  lightning: {
    intervalMs: 1100,
    damage: 22,
    chainRadius: 155,
    durationMs: 130,
    maxLevel: 5,
  },
} as const;
