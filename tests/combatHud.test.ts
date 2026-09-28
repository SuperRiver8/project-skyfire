import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { CombatHud } from '../src/game/ui/CombatHud';
import type { PlayerHealth } from '../src/game/player/PlayerHealth';
import type { PlayerProgress } from '../src/game/player/PlayerProgress';

describe('combat HUD', () => {
  it('redraws only values that changed, including experience when leveling up', () => {
    const texts: { setText: ReturnType<typeof vi.fn> }[] = [];
    const makeText = () => {
      const text = {
        setDepth: () => text,
        setText: vi.fn(() => text),
      };
      texts.push(text);
      return text;
    };
    const makeRectangle = () => {
      const rectangle = {
        width: 0,
        setOrigin: () => rectangle,
        setDepth: () => rectangle,
      };
      return rectangle;
    };
    const scene = {
      add: { rectangle: makeRectangle, text: makeText },
    } as unknown as Phaser.Scene;
    const hud = new CombatHud(scene);
    const health = { hp: 100 } as PlayerHealth;
    const progress = { level: 1, exp: 0 } as PlayerProgress;

    hud.update(health, progress);
    for (let i = 0; i < 20; i += 1) hud.update(health, progress);
    expect(texts[1].setText).toHaveBeenCalledTimes(1);
    expect(texts[2].setText).toHaveBeenCalledTimes(1);
    expect(texts[3].setText).toHaveBeenCalledTimes(1);

    health.hp = 72;
    progress.exp = 12;
    hud.update(health, progress);
    expect(texts[1].setText).toHaveBeenLastCalledWith('72/100');
    expect(texts[2].setText).toHaveBeenCalledTimes(1);
    expect(texts[3].setText).toHaveBeenLastCalledWith('12/40');

    progress.level = 2;
    progress.exp = 0;
    hud.update(health, progress);
    expect(texts[2].setText).toHaveBeenLastCalledWith('LV 2');
    expect(texts[3].setText).toHaveBeenLastCalledWith('0/101');
  });
});
