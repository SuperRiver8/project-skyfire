import Phaser from 'phaser';
import { playerBalance } from '../../config/balance/playerBalance';
import { ensurePlayerArt } from '../aircraft/AircraftArt';
import { GAME_WIDTH } from '../viewport';

export class PlayerAircraft extends Phaser.GameObjects.Container {
  private readonly sprite: Phaser.GameObjects.Image;
  private form = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, playerBalance.startY);
    ensurePlayerArt(scene);
    this.sprite = scene.add.image(0, 0, 'player_form_1');
    this.add(this.sprite);
    scene.add.existing(this);
    this.setForm(1);
  }

  setForm(form: 1 | 2 | 3): void {
    if (this.form === form) return;
    this.form = form;
    this.sprite.setTexture(`player_form_${form}`);
  }
}
