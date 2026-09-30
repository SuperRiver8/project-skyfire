import { describe, expect, it } from 'vitest';
import { SpatialIndex } from '../src/game/combat/SpatialIndex';
import { overlaps } from '../src/game/combat/CollisionSystem';

describe('collision spatial index', () => {
  const enemies = Array.from({ length: 100 }, (_, i) => ({
    x: 15 + (i % 10) * 53,
    y: -80 + Math.floor(i / 10) * 115,
    hitboxWidth: i % 3 === 0 ? 55 : 28,
    hitboxHeight: i % 3 === 0 ? 55 : 28,
  }));
  const bullets = Array.from({ length: 250 }, (_, i) => ({
    x: (i * 73) % 540,
    y: -95 + ((i * 97) % 1190),
  }));
  it('matches full collision scans including cell boundaries and preserves hit order', () => {
    const spatial = new SpatialIndex<(typeof enemies)[number]>();
    spatial.rebuild(enemies);
    let checks = 0;
    for (const bullet of bullets) {
      const hits = (enemy: (typeof enemies)[number]) =>
        overlaps(
          bullet.x,
          bullet.y,
          16,
          36,
          enemy.x,
          enemy.y,
          enemy.hitboxWidth,
          enemy.hitboxHeight,
        );
      const candidates = spatial.query(bullet.x, bullet.y, 16, 36);
      checks += candidates.length;
      expect(candidates.filter(hits)).toEqual(enemies.filter(hits));
    }
    expect(checks).toBeLessThan(bullets.length * enemies.length * 0.1);
    spatial.rebuild([]);
    expect(spatial.query(20, 20, 16, 36)).toEqual([]);
  });
});
