import { DEFAULT_SAVE, type SaveData } from './SaveTypes';
import { SCORE_RULES_VERSION, type RunRecord } from '../combat/RunScore';
import { integer } from '../utils/Integer';

const KEY = 'project_skyfire_save';

export class SaveManager {
  constructor(
    private readonly storage: Pick<
      Storage,
      'getItem' | 'setItem' | 'removeItem'
    > = localStorage,
  ) {}

  load(): SaveData {
    try {
      const raw = this.storage.getItem(KEY);
      return raw
        ? this.migrate(JSON.parse(raw) as unknown)
        : structuredClone(DEFAULT_SAVE);
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  save(data: SaveData): void {
    try {
      this.storage.setItem(KEY, JSON.stringify(this.migrate(data)));
    } catch {
      /* Storage can be disabled in private browsing. */
    }
  }

  reset(): void {
    try {
      this.storage.removeItem(KEY);
    } catch {
      /* Ignore unavailable storage. */
    }
  }

  migrate(value: unknown): SaveData {
    if (!value || typeof value !== 'object')
      return structuredClone(DEFAULT_SAVE);
    const source = value as Partial<SaveData>;
    return {
      version: 1,
      highestUnlockedLevel: Math.max(
        1,
        Math.min(6, integer(Number(source.highestUnlockedLevel))),
      ),
      totalCoins: integer(Number(source.totalCoins)),
      settings: { ...DEFAULT_SAVE.settings, ...source.settings },
      stats: {
        totalKills: integer(Number(source.stats?.totalKills)),
        totalPlayTimeMs: integer(Number(source.stats?.totalPlayTimeMs)),
        bossesKilled: integer(Number(source.stats?.bossesKilled)),
      },
      lastRun: this.migrateRun(source.lastRun),
      bestRun: this.migrateRun(source.bestRun),
    };
  }

  private migrateRun(value: unknown): RunRecord | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Partial<RunRecord>;
    if (
      record.rulesVersion !== SCORE_RULES_VERSION ||
      !Array.isArray(record.completedLevels)
    )
      return undefined;
    const startLevel = Math.max(
      1,
      Math.min(5, integer(Number(record.startLevel))),
    );
    const enemyPoints = integer(Number(record.enemyPoints));
    const bossPoints = integer(Number(record.bossPoints));
    const clearPoints = integer(Number(record.clearPoints));
    return {
      rulesVersion: SCORE_RULES_VERSION,
      startLevel,
      ranked: record.ranked === true && startLevel === 1,
      enemyPoints,
      bossPoints,
      clearPoints,
      completedLevels: [
        ...new Set(
          record.completedLevels.filter(
            (level) => Number.isInteger(level) && level >= 1 && level <= 5,
          ),
        ),
      ],
      score: integer(enemyPoints + bossPoints + clearPoints),
      victory: record.victory === true,
      levelReached: Math.max(
        startLevel,
        Math.min(5, integer(Number(record.levelReached))),
      ),
      elapsedTimeMs: integer(Number(record.elapsedTimeMs)),
      kills: integer(Number(record.kills)),
      damageDealt: integer(Number(record.damageDealt)),
      damageTaken: integer(Number(record.damageTaken)),
    };
  }
}
