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

  it('caps shields at five and consumes one before health', () => {
    const health = new PlayerHealth();
    for (let i = 0; i < 7; i += 1) health.addShield();
    expect(health.shields).toBe(5);
    expect(health.hit(30)).toBe(true);
    expect(health.shields).toBe(4);
    expect(health.hp).toBe(100);
  });
});
