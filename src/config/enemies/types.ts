export interface EnemyConfig {
  id: string;
  maxHp: number;
  speed: number;
  collisionDamage: number;
  score: number;
  exp: number;
  aiType: 'STRAIGHT' | 'ZIGZAG' | 'SHOOTER' | 'CHARGER' | 'KAMIKAZE' | 'TANK';
  tint?: number;
  zigzagAmplitude?: number;
  zigzagFrequency?: number;
  fireIntervalMs?: number;
  chargeDelayMs?: number;
  chargeSpeed?: number;
  explosionRadius?: number;
  scale?: number;
  spriteKey: string;
  hitbox: { width: number; height: number };
  dropTableId?: string;
}
