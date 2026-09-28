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

const enemyConfigs: Record<string, EnemyConfig> = {
  [scoutConfig.id]: scoutConfig,
  [zigzagFighterConfig.id]: zigzagFighterConfig,
  [shooterConfig.id]: shooterConfig,
  [chargerConfig.id]: chargerConfig,
  [kamikazeConfig.id]: kamikazeConfig,
  [heavyTankConfig.id]: heavyTankConfig,
};

export class EnemyFactory {
  constructor(private readonly scene: Phaser.Scene) {}

  create(): Enemy {
    return new Enemy(this.scene);
  }

  getConfig(id: string): EnemyConfig {
    const config = enemyConfigs[id];
    if (!config) throw new Error(`Unknown enemy: ${id}`);
    return config;
  }
}
