import { describe, expect, it } from 'vitest';
import { playerBalance } from '../src/config/balance/playerBalance';
import { movePlayer } from '../src/game/player/PlayerMovement';

describe('player movement', () => {
  it('uses delta time and normalizes diagonal keyboard input', () => {
    const next = movePlayer(
      { x: 270, y: 800 },
      { moveX: 1, moveY: 1, pointerActive: false },
      20,
    );
    expect(Math.hypot(next.x - 270, next.y - 800)).toBeCloseTo(6);
  });

  it('moves twice as fast toward a held pointer without teleporting', () => {
    const next = movePlayer(
      { x: 270, y: 800 },
      {
        moveX: 0,
        moveY: 0,
        pointerActive: true,
        pointerWorldX: 500,
        pointerWorldY: 100,
      },
      16,
    );
    expect(Math.hypot(next.x - 270, next.y - 800)).toBeCloseTo(9.6);
  });

  it('keeps the full aircraft inside the logical viewport', () => {
    const next = movePlayer(
      { x: playerBalance.halfWidth, y: playerBalance.halfHeight },
      { moveX: -1, moveY: -1, pointerActive: false },
      50,
    );
    expect(next).toEqual({
      x: playerBalance.halfWidth,
      y: playerBalance.halfHeight,
    });
  });
});
