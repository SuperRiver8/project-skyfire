import type Phaser from 'phaser';
import { scoutConfig } from '../../config/enemies/scout';
import { zigzagFighterConfig } from '../../config/enemies/zigzagFighter';
import {
  shooterConfig,
  chargerConfig,
  kamikazeConfig,
  heavyTankConfig,
} from '../../config/enemies/advanced';
import type { EnemyConfig } from '../../config/enemies/types';
import { Enemy } from './Enemy';
import {
  getLevelDifficulty,
  scaleEnemyConfig,
  type LevelDifficulty,
} from '../../config/balance/levelDifficulty';

const enemyConfigs: Record<string, EnemyConfig> = {
  [scoutConfig.id]: scoutConfig,
  [zigzagFighterConfig.id]: zigzagFighterConfig,
  [shooterConfig.id]: shooterConfig,
  [chargerConfig.id]: chargerConfig,
  [kamikazeConfig.id]: kamikazeConfig,
  [heavyTankConfig.id]: heavyTankConfig,
};

export class EnemyFactory {
  private readonly spawnCounts = new Map<string, number>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly difficulty: LevelDifficulty = getLevelDifficulty(1),
  ) {}

  create(): Enemy {
    return new Enemy(this.scene);
  }

  getConfig(id: string): EnemyConfig {
    const config = enemyConfigs[id];
    if (!config) throw new Error(`Unknown enemy: ${id}`);
    const scaled = scaleEnemyConfig(config, this.difficulty);
    const spawned = this.spawnCounts.get(id) ?? 0;
    this.spawnCounts.set(id, spawned + 1);
    // 分摊整数经验，补机也遵守同一规则；不修改共享配置或累计放大倍率。
    return {
      ...scaled,
      exp:
        Math.round((spawned + 1) * scaled.exp) -
        Math.round(spawned * scaled.exp),
    };
  }
}
