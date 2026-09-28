import { describe, expect, it } from 'vitest';
import { overlaps } from '../src/game/combat/CollisionSystem';

describe('collision overlap', () => {
  it('detects a bullet inside an enemy hitbox', () => {
    expect(overlaps(100, 100, 10, 28, 100, 110, 28, 28)).toBe(true);
    expect(overlaps(100, 100, 10, 28, 200, 110, 28, 28)).toBe(false);
  });
});
