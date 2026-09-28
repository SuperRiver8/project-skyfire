import { DEFAULT_SAVE, type SaveData } from './SaveTypes';

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
        Math.min(6, Number(source.highestUnlockedLevel) || 1),
      ),
      totalCoins: Math.max(0, Number(source.totalCoins) || 0),
      settings: { ...DEFAULT_SAVE.settings, ...source.settings },
      stats: { ...DEFAULT_SAVE.stats, ...source.stats },
    };
  }
}
