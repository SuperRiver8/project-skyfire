import Phaser from 'phaser';

export interface PlayerInputState {
  moveX: number;
  moveY: number;
  pointerActive: boolean;
  pointerWorldX?: number;
  pointerWorldY?: number;
}

export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private readonly wasd:
    | {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
      }
    | undefined;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = {
        up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  getState(): PlayerInputState {
    const left = this.cursors?.left.isDown || this.wasd?.left.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown;
    const up = this.cursors?.up.isDown || this.wasd?.up.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.down.isDown;
    const pointer = this.scene.input.activePointer;

    return {
      moveX: Number(Boolean(right)) - Number(Boolean(left)),
      moveY: Number(Boolean(down)) - Number(Boolean(up)),
      pointerActive: pointer.isDown,
      pointerWorldX: pointer.isDown ? pointer.worldX : undefined,
      pointerWorldY: pointer.isDown ? pointer.worldY : undefined,
    };
  }
}
