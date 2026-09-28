import { mechanicalEagleConfig } from './mechanicalEagle';
import { steelDragonConfig } from './steelDragon';
import { twinSerpentConfig } from './twinSerpent';
import { ironBastionConfig } from './ironBastion';
import { skyTyrantConfig } from './skyTyrant';
import type { BossConfig } from './types';

export const bossConfigs: Record<string, BossConfig> = {
  [mechanicalEagleConfig.id]: mechanicalEagleConfig,
  [steelDragonConfig.id]: steelDragonConfig,
  [twinSerpentConfig.id]: twinSerpentConfig,
  [ironBastionConfig.id]: ironBastionConfig,
  [skyTyrantConfig.id]: skyTyrantConfig,
};

export function getBossConfig(id: string): BossConfig {
  const config = bossConfigs[id];
  if (!config) throw new Error(`Unknown boss: ${id}`);
  return config;
}

export type { BossConfig, BossVisualConfig } from './types';
