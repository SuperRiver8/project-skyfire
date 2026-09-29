import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { getBossConfig } from '../src/config/bosses';
import {
  initialAttackElapsed,
  phaseForHp,
} from '../src/game/bosses/BossPhaseController';
import { bossSkills, type SkillContext } from '../src/game/bosses/BossSkills';
import { getLevelConfig } from '../src/game/level/LevelManager';
import type { EnemyBulletPool } from '../src/game/bullets/EnemyBulletPool';
import type { PlayerAircraft } from '../src/game/player/PlayerAircraft';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value)),
    },
  },
}));

describe('Mechanical Eagle phases', () => {
  it('switches at 70% and 35% HP', () => {
    expect(phaseForHp(7100, 10000)).toBe(1);
    expect(phaseForHp(7000, 10000)).toBe(2);
    expect(phaseForHp(3500, 10000)).toBe(3);
  });
});

describe('late bosses', () => {
  const additions = [
    { level: 3, hp: 14_175, skill: 'serpent_crossfire' },
    { level: 4, hp: 19_500, skill: 'bastion_lockdown' },
    { level: 5, hp: 26_400, skill: 'solar_pursuit' },
  ] as const;

  it('has higher effective health and early phase-two skills', () => {
    for (const { level, hp, skill } of additions) {
      const config = getLevelConfig(level);
      const boss = getBossConfig(config.bossId!);
      const attack = boss.attacks.find(({ id }) => id === skill)!;
      expect(Math.round(boss.maxHp * config.bossHpMultiplier!)).toBe(hp);
      expect(phaseForHp(hp * (boss.phase3Threshold - 0.01), hp, boss.id)).toBe(
        3,
      );
      expect(attack.unlockPhase).toBe(2);
      expect(initialAttackElapsed(attack, 2)).toBe(
        attack.intervalMs[1] - attack.firstCastDelayMs!,
      );
      expect(bossSkills[skill]).toBeDefined();
    }
  });

  it('makes each new skill emit projectiles after its warning', () => {
    const marker = {
      setDepth: () => marker,
      setAlpha: () => marker,
      setVisible: () => marker,
      destroy: () => {},
    };
    const glow = {
      setDepth: () => glow,
      clear: () => glow,
      lineStyle: () => glow,
      strokeCircle: () => glow,
      destroy: () => {},
    };
    const scene = {
      add: { rectangle: () => marker, graphics: () => glow },
    } as unknown as Phaser.Scene;
    const fire = vi.fn();
    for (const { level, skill } of additions) {
      fire.mockClear();
      const ctx = {
        scene,
        player: { x: 270, y: 800 } as PlayerAircraft,
        bullets: { fire } as unknown as EnemyBulletPool,
        config: getBossConfig(getLevelConfig(level).bossId!),
        phase: 2,
        x: 270,
        y: 245,
        onLaserHit: () => {},
        startDash: () => {},
        setShield: () => {},
      } satisfies SkillContext;
      const effect = bossSkills[skill].cast(ctx);
      expect(effect).not.toBeNull();
      effect!.update(650, ctx);
      expect(fire).toHaveBeenCalled();
      effect!.destroy();
    }
  });
});
