import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { selectArcTargets } from '../src/game/items/ArcTargeting';
import { ElectricArc } from '../src/game/items/ElectricArc';
import type { EnemyController } from '../src/game/enemies/EnemyController';

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

  it('damages a boss in range even when no light enemies are present', () => {
    const lineBetween = vi.fn();
    const graphics = {
      setDepth: () => graphics,
      clear: () => graphics,
      lineStyle: () => graphics,
      lineBetween,
      destroy: () => {},
    };
    const scene = {
      add: { graphics: () => graphics },
    } as unknown as Phaser.Scene;
    const damageBoss = vi.fn();
    const enemies = {
      boss: { x: 270, y: 245, isDamageable: () => true },
      enemies: { activeEnemies: () => [] },
      damageBoss,
    } as unknown as EnemyController;
    const arc = new ElectricArc(scene, enemies);
    arc.addStack();
    arc.update(220, 270, 800, 1);
    expect(lineBetween).not.toHaveBeenCalled();
    for (let i = 0; i < 5; i += 1) arc.addStack();
    arc.update(220, 270, 800, 1);
    expect(damageBoss).toHaveBeenCalledTimes(1);
    arc.destroy();
  });
});
