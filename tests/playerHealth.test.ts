import { describe, expect, it } from 'vitest';
import { PlayerHealth } from '../src/game/player/PlayerHealth';

describe('PlayerHealth', () => {
  it('settles fractional damage, old health and repair overflow as integers', () => {
    const health = new PlayerHealth();
    health.hp = 80.8;
    expect(health.hp).toBe(81);
    health.hit(15.95);
    expect(health.hp).toBe(65);
    expect(health.heal(40.4)).toBe(5);
    expect(health.hp).toBe(100);
    health.update(700);
    expect(health.hit(NaN)).toBe(false);
    expect(health.hit(-2)).toBe(false);
  });
  it('blocks repeated hits during the invulnerability window', () => {
    const health = new PlayerHealth();
    expect(health.hit(10)).toBe(true);
    expect(health.hit(10)).toBe(false);
    expect(health.hp).toBe(90);
    health.update(700);
    expect(health.hit(10)).toBe(true);
  });

  it('caps shields at the configured maximum and consumes one before health', () => {
    const health = new PlayerHealth();
    for (let i = 0; i < 7; i += 1) health.addShield();
    expect(health.shields).toBe(4);
    expect(health.hit(30)).toBe(true);
    expect(health.shields).toBe(3);
    expect(health.hp).toBe(100);
  });
});
