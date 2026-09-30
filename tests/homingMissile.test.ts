import { describe, expect, it } from 'vitest';
import { chooseMissileTarget } from '../src/game/items/HomingTargeting';
import { PlayerStats } from '../src/game/player/PlayerStats';
import { itemWeights } from '../src/game/items/ItemDrop';

describe('homing missile targeting', () => {
  it('prioritizes bosses and elites, then spreads locks away from a saturated target', () => {
    const candidates = [
      { target: 'near', priority: 2, distance: 10, hp: 20, assigned: 1 },
      { target: 'far', priority: 2, distance: 50, hp: 40, assigned: 0 },
      { target: 'elite', priority: 1, distance: 80, hp: 20, assigned: 0 },
      { target: 'boss', priority: 0, distance: 200, hp: 500, assigned: 0 },
    ];
    expect(chooseMissileTarget(candidates, 24)).toBe('boss');
    expect(chooseMissileTarget(candidates.slice(0, 3), 24)).toBe('elite');
    expect(chooseMissileTarget(candidates.slice(0, 2), 24)).toBe('far');
    expect(chooseMissileTarget([{ ...candidates[0] }], 24)).toBe('near');
  });

  it('keeps missile cadence separate from rapid-fire and caps duplicate upgrades', () => {
    const stats = new PlayerStats();
    stats.attackCores = 5;
    stats.rapidCores = 5;
    expect(stats.missileFlightMultiplier).toBeCloseTo(1.2);
    expect(stats.missileDamageMultiplier).toBeCloseTo(1.48 * 1.05);
    stats.activateBerserk();
    expect(stats.missileFlightMultiplier).toBeCloseTo(1.2 * 1.25);
    expect(stats.missileDamageMultiplier).toBeCloseTo(1.48 * 1.05 * 1.3);
    const base = {
      attackCores: 0,
      rapidCores: 0,
      critCores: 0,
      spreadLevel: 0,
      electricStacks: 0,
      shields: 0,
      hpRatio: 1,
      phoenixReady: false,
      recent: [],
      missileLevel: 4,
      missileOverdrive: 2,
    };
    const missileWeight = (overdrive: number) =>
      itemWeights({ ...base, missileOverdrive: overdrive }).find(
        ({ value }) => value === 'homing_missile',
      )?.weight;
    expect(missileWeight(2)).toBeGreaterThan(0);
    expect(missileWeight(3)).toBe(0);
  });
});
