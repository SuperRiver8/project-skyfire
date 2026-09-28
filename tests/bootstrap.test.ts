import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from '../src/game/viewport';

describe('game viewport', () => {
  it('uses the specified 540 × 960 portrait coordinates', () => {
    expect([GAME_WIDTH, GAME_HEIGHT]).toEqual([540, 960]);
  });
});
