import { describe, expect, it } from 'vitest';
import { phaseForHp } from '../src/game/bosses/BossPhaseController';

describe('Mechanical Eagle phases', () => {
  it('switches at 70% and 35% HP', () => {
    expect(phaseForHp(7100, 10000)).toBe(1);
    expect(phaseForHp(7000, 10000)).toBe(2);
    expect(phaseForHp(3500, 10000)).toBe(3);
  });
});
