import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateUpgrades } from '../src/game/upgrades/UpgradeGenerator';
import { Random } from '../src/game/utils/Random';

afterEach(() => vi.restoreAllMocks());

describe('upgrade choices', () => {
  it('offers three distinct choices on the first level up', () => {
    const choices = generateUpgrades(
      { machine_gun: 1, spread_gun: 0, laser: 0, missile: 0, lightning: 0 },
      true,
    );
    expect(choices.map((choice) => choice.id)).toEqual([
      'machine_gun',
      'spread_gun',
      'attack',
    ]);
  });

  it('does not offer maxed weapons or new slots when full', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const choices = generateUpgrades(
      { machine_gun: 5, spread_gun: 5, laser: 1, missile: 0, lightning: 0 },
      false,
    );
    expect(choices).toHaveLength(3);
    expect(choices.map((choice) => choice.id)).not.toContain('missile');
    expect(choices.map((choice) => choice.id)).not.toContain('machine_gun');
    expect(new Set(choices.map((choice) => choice.id)).size).toBe(3);
  });
});

describe('weighted random', () => {
  it('ignores zero weight choices', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(
      Random.weighted([
        { value: 'disabled', weight: 0 },
        { value: 'enabled', weight: 1 },
      ]),
    ).toBe('enabled');
  });
});
