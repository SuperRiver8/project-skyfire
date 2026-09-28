import { describe, expect, it } from 'vitest';
import { selectArcTargets } from '../src/game/items/ArcTargeting';

describe('electric arc targeting', () => {
  it('keeps the closest light enemies in stable distance order', () => {
    const enemies = [
      { id: 'first', aiType: 'STRAIGHT', x: 3, y: 4 },
      { id: 'tank', aiType: 'TANK', x: 0, y: 0 },
      { id: 'near', aiType: 'ZIGZAG', x: 1, y: 0 },
      { id: 'second', aiType: 'STRAIGHT', x: -3, y: -4 },
      { id: 'outside', aiType: 'ZIGZAG', x: 11, y: 0 },
    ];
    expect(selectArcTargets(enemies, 0, 0, 10, 3).map(({ id }) => id)).toEqual([
      'near',
      'first',
      'second',
    ]);
    expect(selectArcTargets(enemies, 0, 0, 10, 1)[0].id).toBe('near');
  });
});
