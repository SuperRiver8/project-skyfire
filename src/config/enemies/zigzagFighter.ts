import type { EnemyConfig } from './types';

export const zigzagFighterConfig: EnemyConfig = {
  id: 'zigzag_fighter',
  maxHp: 40,
  speed: 105,
  collisionDamage: 12,
  score: 140,
  exp: 8,
  aiType: 'ZIGZAG',
  spriteKey: 'enemy_zigzag',
  zigzagAmplitude: 48,
  zigzagFrequency: 0.004,
  hitbox: { width: 28, height: 28 },
};
