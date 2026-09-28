import Phaser from 'phaser';
import tangtangUrl from '../../assets/blessing-tangtang.png';
import xiangxiangUrl from '../../assets/blessing-xiangxiang.png';
import type { RunState } from './GameScene';
import type { ResultData } from './ResultScene';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import {
  playVictoryBlessings,
  VICTORY_BLESSING_KEYS,
} from '../visuals/VictoryBlessings';

interface BlessingTransition {
  levelId: number;
  nextLevelId?: number;
  runState?: RunState;
  result?: ResultData;
}

export class VictoryBlessingScene extends Phaser.Scene {
  private transition!: BlessingTransition;
  private loadingDisplay?: Phaser.GameObjects.Container;

  constructor() {
    super('VictoryBlessingScene');
  }

  init(data: BlessingTransition): void {
    this.transition = data;
  }

  preload(): void {
    const missing = [
      [VICTORY_BLESSING_KEYS[0], tangtangUrl],
      [VICTORY_BLESSING_KEYS[1], xiangxiangUrl],
    ] as const;
    if (missing.every(([key]) => this.textures.exists(key))) return;

    // 首次过关时才下载祝福图片，启动菜单不再等待这两张大图。
    this.cameras.main.setBackgroundColor(0x071326);
    this.loadingDisplay = this.add.container(0, 0, [
      this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x071326,
      ),
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '正在准备过关祝福…', {
          fontFamily: 'Microsoft YaHei, sans-serif',
          fontSize: '25px',
          color: '#ffe4a0',
        })
        .setOrigin(0.5),
    ]);
    for (const [key, url] of missing)
      if (!this.textures.exists(key)) this.load.image(key, url);
  }

  create(): void {
    this.loadingDisplay?.destroy(true);
    this.loadingDisplay = undefined;
    const { levelId, nextLevelId, runState, result } = this.transition;
    playVictoryBlessings(this, levelId, () => {
      if (nextLevelId && runState)
        this.scene.start('GameScene', { levelId: nextLevelId, runState });
      else if (result) this.scene.start('ResultScene', result);
    });
  }
}
