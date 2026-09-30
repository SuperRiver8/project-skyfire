import type Phaser from 'phaser';
import { enemyBalance } from '../../config/balance/enemyBalance';
import { ObjectPool } from '../utils/ObjectPool';
import { Enemy } from './Enemy';
import { EnemyFactory } from './EnemyFactory';
import {
  getLevelDifficulty,
  type LevelDifficulty,
} from '../../config/balance/levelDifficulty';

export class EnemyPool {
  private readonly pool: ObjectPool<Enemy>;
  private readonly factory: EnemyFactory;

  constructor(
    scene: Phaser.Scene,
    difficulty: LevelDifficulty = getLevelDifficulty(1),
  ) {
    this.factory = new EnemyFactory(scene, difficulty);
    this.pool = new ObjectPool(
      () => this.factory.create(),
      enemyBalance.initialPoolSize,
    );
  }

  spawn(id: string, x: number, y: number): Enemy {
    const config = this.factory.getConfig(id);
    const enemy = this.pool.acquire();
    enemy.activate(x, y, config);
    // 普通敌机首次出现时整机可见；入场演出不以裁掉机身为代价。
    enemy.y = Math.max(enemy.displayHeight / 2, enemy.y);
    enemy.alignVisuals();
    return enemy;
  }

  release(enemy: Enemy): void {
    this.pool.release(enemy);
  }

  update(
    deltaMs: number,
    playerX = 0,
    playerY = 0,
    onAction?: (enemy: Enemy, action: 'shoot' | 'explode') => void,
  ): void {
    for (const enemy of this.pool.activeItems()) {
      const action = enemy.advance(deltaMs, playerX, playerY);
      if (action) onAction?.(enemy, action);
      if (enemy.isBelowScreen()) this.pool.release(enemy);
    }
  }

  activeEnemies(): Iterable<Enemy> {
    return this.pool.activeItems();
  }

  clear(): void {
    for (const enemy of this.pool.activeItems()) this.pool.release(enemy);
  }

  get activeCount(): number {
    return this.pool.activeCount;
  }

  get createdCount(): number {
    return this.pool.createdCount;
  }

  destroy(): void {
    for (const enemy of this.pool.allItems()) enemy.destroy();
  }
}
