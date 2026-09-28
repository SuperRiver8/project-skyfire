import { playerBalance } from '../../config/balance/playerBalance';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import type { PlayerInputState } from '../input/InputController';

export interface PlayerPosition {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function movePlayer(
  position: PlayerPosition,
  input: PlayerInputState,
  deltaMs: number,
  speedMultiplier = 1,
): PlayerPosition {
  const deltaSeconds = clamp(deltaMs, 0, playerBalance.maxDeltaMs) / 1000;
  const minX = playerBalance.halfWidth;
  const maxX = GAME_WIDTH - playerBalance.halfWidth;
  const minY = playerBalance.halfHeight;
  const maxY = GAME_HEIGHT - playerBalance.halfHeight;

  let x = position.x;
  let y = position.y;

  if (
    input.pointerActive &&
    Number.isFinite(input.pointerWorldX) &&
    Number.isFinite(input.pointerWorldY)
  ) {
    const targetX = clamp(input.pointerWorldX!, minX, maxX);
    const targetY = clamp(input.pointerWorldY!, minY, maxY);
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
      // 指针跟随有缓动，同时限制最大位移，避免触摸位置远离飞机时瞬移。
      const easedDistance =
        distance *
        (1 - Math.exp(-playerBalance.pointerFollowRate * deltaSeconds));
      const step = Math.min(
        easedDistance,
        playerBalance.moveSpeed *
          playerBalance.pointerMoveSpeedMultiplier *
          speedMultiplier *
          deltaSeconds,
      );
      x += (dx / distance) * step;
      y += (dy / distance) * step;
    }
  } else {
    const length = Math.hypot(input.moveX, input.moveY);
    if (length > 0) {
      const step =
        (playerBalance.moveSpeed * speedMultiplier * deltaSeconds) /
        Math.max(1, length);
      x += input.moveX * step;
      y += input.moveY * step;
    }
  }

  return { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
}
