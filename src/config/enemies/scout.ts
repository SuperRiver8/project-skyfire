import type { EnemyConfig } from './types';

export const scoutConfig: EnemyConfig = {
  id: 'scout',
  maxHp: 30,
  speed: 120,
  collisionDamage: 10,
  score: 100,
  exp: 5,
  aiType: 'STRAIGHT',
  fireIntervalMs: 3800,
  spriteKey: 'enemy_scout',
  scale: 0.82,
  hitbox: { width: 28, height: 28 },
};
