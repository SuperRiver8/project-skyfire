import type { InputController } from '../input/InputController';
import { movePlayer } from './PlayerMovement';
import type { PlayerAircraft } from './PlayerAircraft';
import type { PlayerStats } from './PlayerStats';

export class PlayerController {
  constructor(
    private readonly aircraft: PlayerAircraft,
    private readonly input: InputController,
    private readonly stats: PlayerStats,
  ) {}

  update(deltaMs: number): void {
    const position = movePlayer(
      this.aircraft,
      this.input.getState(),
      deltaMs,
      this.stats.movementMultiplier,
    );
    const displacementX = position.x - this.aircraft.x;
    const displacementY = position.y - this.aircraft.y;
    this.aircraft.setPosition(position.x, position.y);
    this.aircraft.updateFlight(deltaMs, displacementX, displacementY);
  }
}
