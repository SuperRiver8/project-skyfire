import { describe, expect, it } from 'vitest';
import { itemConfigs } from '../src/config/items/items';
import { itemWeights, type DropState } from '../src/game/items/ItemDrop';
import { PlayerHealth } from '../src/game/player/PlayerHealth';
import { PlayerStats } from '../src/game/player/PlayerStats';

const baseDrop: DropState = {
  attackCores: 0,
  rapidCores: 0,
  critCores: 0,
  electricStacks: 0,
  missileLevel: 0,
  missileOverdrive: 0,
  shields: 0,
  hpRatio: 1,
  phoenixReady: false,
  recent: [],
};

describe('item drop rules', () => {
  it('starts with the requested rarity split', () => {
    const totals = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 };
    for (const { value, weight } of itemWeights(baseDrop))
      totals[itemConfigs[value].rarity] += weight;
    expect(totals).toEqual({ Common: 58, Rare: 27, Epic: 12, Legendary: 3 });
  });

  it('softly biases needs and removes capped cores', () => {
    const weights = Object.fromEntries(
      itemWeights({
        ...baseDrop,
        attackCores: 5,
        hpRatio: 0.2,
        shields: 4,
        phoenixReady: true,
        recent: ['heal'],
      }).map(({ value, weight }) => [value, weight]),
    );
    expect(weights.attack_core).toBe(0);
    expect(weights.heal).toBeCloseTo(19 * 2.2 * 0.35);
    expect(weights.shield).toBeCloseTo(9 * 0.35);
    expect(weights.phoenix_core).toBeGreaterThan(0);
    expect(weights.phoenix_core).toBeLessThan(1);
  });
});

describe('permanent and timed items', () => {
  it('applies core synergy, capped rapid fire, and the crit chain', () => {
    const stats = new PlayerStats();
    stats.attackCores = 3;
    stats.rapidCores = 3;
    expect(stats.attackMultiplier).toBeCloseTo(1.36 * 1.05);
    expect(stats.fireRateMultiplier).toBeCloseTo(1.3 * 1.05);
    stats.attackCores = 5;
    stats.rapidCores = 5;
    stats.critCores = 5;
    stats.activateBerserk();
    expect(stats.fireRateMultiplier).toBeLessThanOrEqual(3);
    for (let i = 0; i < 3; i += 1) expect(stats.rollCrit(0).crit).toBe(true);
    expect(stats.rollCrit(1)).toEqual({ crit: true, enhanced: true });
    stats.activateBerserk();
    expect(stats.berserkMs).toBe(13_000);
  });

  it('returns overflow healing and grants two seconds of phoenix protection', () => {
    const health = new PlayerHealth();
    health.hp = 80;
    expect(health.heal(30)).toBe(10);
    expect(health.hp).toBe(100);
    health.revive();
    expect(health.hp).toBe(50);
    expect(health.invulnerableMs).toBe(2_000);
  });
});
