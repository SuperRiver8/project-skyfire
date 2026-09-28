import { describe, expect, it } from 'vitest';
import { SaveManager } from '../src/game/save/SaveManager';

describe('SaveManager', () => {
  it('migrates older partial data and preserves progress', () => {
    const manager = new SaveManager({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
    const save = manager.migrate({ highestUnlockedLevel: 3, totalCoins: 40 });
    expect(save.highestUnlockedLevel).toBe(3);
    expect(save.settings.damageNumbers).toBe(true);
    expect(save.totalCoins).toBe(40);
  });
});
