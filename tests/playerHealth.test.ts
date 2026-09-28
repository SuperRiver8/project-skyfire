import { describe, expect, it } from 'vitest';
import { PlayerHealth } from '../src/game/player/PlayerHealth';

describe('PlayerHealth', () => {
  it('blocks repeated hits during the invulnerability window', () => {
    const health = new PlayerHealth();
    expect(health.hit(10)).toBe(true);
    expect(health.hit(10)).toBe(false);
    expect(health.hp).toBe(90);
    health.update(700);
    expect(health.hit(10)).toBe(true);
  });
});
