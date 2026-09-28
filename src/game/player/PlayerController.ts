import type { InputController } from '../input/InputController';
import { movePlayer } from './PlayerMovement';
import type { PlayerAircraft } from './PlayerAircraft';

export class PlayerController {
  constructor(
    private readonly aircraft: PlayerAircraft,
    private readonly input: InputController,
  ) {}

  update(deltaMs: number): void {
    const position = movePlayer(this.aircraft, this.input.getState(), deltaMs);
    this.aircraft.setPosition(position.x, position.y);
  }
}
