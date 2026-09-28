import Phaser from 'phaser';
import tangtangUrl from '../../assets/blessing-tangtang.png';
import xiangxiangUrl from '../../assets/blessing-xiangxiang.png';
import victoryUrl from '../../assets/result-victory-xiaoyin.png';
import encouragementUrl from '../../assets/result-encouragement-xiaoyin.png';
import { VICTORY_BLESSING_KEYS } from '../visuals/VictoryBlessings';
import { RESULT_ART_KEYS } from '../visuals/ResultArtwork';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.image(VICTORY_BLESSING_KEYS[0], tangtangUrl);
    this.load.image(VICTORY_BLESSING_KEYS[1], xiangxiangUrl);
    this.load.image(RESULT_ART_KEYS.victory, victoryUrl);
    this.load.image(RESULT_ART_KEYS.defeat, encouragementUrl);
  }

  create(): void {
    this.scene.start('MainMenuScene');
  }
}
