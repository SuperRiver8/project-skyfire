import type { RunRecord } from '../combat/RunScore';

export interface SaveData {
  version: number;
  highestUnlockedLevel: number;
  totalCoins: number;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    screenShake: boolean;
    damageNumbers: boolean;
  };
  stats: { totalKills: number; totalPlayTimeMs: number; bossesKilled: number };
  lastRun?: RunRecord;
  bestRun?: RunRecord;
}

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  highestUnlockedLevel: 1,
  totalCoins: 0,
  settings: {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    screenShake: true,
    damageNumbers: true,
  },
  stats: { totalKills: 0, totalPlayTimeMs: 0, bossesKilled: 0 },
};
