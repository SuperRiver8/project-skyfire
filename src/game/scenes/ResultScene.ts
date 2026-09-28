import Phaser from 'phaser';
import { getLevelConfig } from '../level/LevelManager';
import { SaveManager } from '../save/SaveManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import { canvasArt, radialBall } from '../visuals/pseudo3d';
import { ensureExplosionArt } from '../effects/Explosion';

export interface ResultData {
  victory: boolean;
  levelId: number;
  elapsedTimeMs: number;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  score: number;
}

const DOT_KEY = 'firework_dot';

function ensureFireworkArt(scene: Phaser.Scene): void {
  canvasArt(scene, DOT_KEY, 16, 16, (ctx) => {
    radialBall(ctx, 8, 8, 8, [
      [0, 0xffffff],
      [0.4, 0xffffff, 0.9],
      [0.75, 0xffffff, 0.35],
      [1, 0xffffff, 0],
    ]);
  });
}

/** 庆典烟花：烟花弹上升 → 爆裂成彩色余烬 */
class Fireworks {
  private nextAt = 0;
  private readonly colors = [
    0xffd76a,
    0xff6a8a,
    0x6affc9,
    0x6ab8ff,
    0xc9a0ff,
    0xff9a5c,
    0xffffff,
  ];

  constructor(private readonly scene: Phaser.Scene) {
    ensureFireworkArt(scene);
  }

  update(time: number): void {
    if (time < this.nextAt) return;
    this.nextAt = time + 560 + Math.random() * 480;
    const x = 90 + Math.random() * 360;
    const y = 180 + Math.random() * 270;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.rise(x, y, color);
  }

  private rise(x: number, y: number, color: number): void {
    const rocket = this.scene.add
      .image(x, GAME_HEIGHT - 50, DOT_KEY)
      .setTint(color)
      .setScale(0.5)
      .setAlpha(0.9)
      .setDepth(9);
    this.scene.tweens.add({
      targets: rocket,
      y,
      duration: 600 + Math.random() * 200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        rocket.destroy();
        this.burst(x, y, color);
      },
    });
  }

  private burst(x: number, y: number, color: number): void {
    const emitter = this.scene.add
      .particles(0, 0, DOT_KEY, {
        speed: { min: 70, max: 250 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 600, max: 1250 },
        gravityY: 160,
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [color, 0xffffff, color],
        blendMode: 'ADD',
        emitting: false,
      })
      .setDepth(9);
    emitter.explode(30 + Math.floor(Math.random() * 22), x, y);
    // 爆心闪光
    const flash = this.scene.add
      .circle(x, y, 8, 0xffffff, 0.95)
      .setDepth(10);
    this.scene.tweens.add({
      targets: flash,
      scale: 5,
      alpha: 0,
      duration: 240,
      onComplete: () => flash.destroy(),
    });
    this.scene.time.delayedCall(1500, () => emitter.destroy());
  }
}

export class ResultScene extends Phaser.Scene {
  private result!: ResultData;
  private fireworks: Fireworks | undefined;

  constructor() {
    super('ResultScene');
  }

  init(data: ResultData): void {
    this.result = data;
  }

  create(): void {
    const data = this.result;
    ensureExplosionArt(this);
    const coins = data.victory ? getLevelConfig(data.levelId).rewards.coins : 0;
    const manager = new SaveManager();
    const save = manager.load();
    if (data.victory) {
      save.highestUnlockedLevel = Math.max(
        save.highestUnlockedLevel,
        Math.min(6, data.levelId + 1),
      );
      save.totalCoins += coins;
      if (data.levelId === 5) save.stats.bossesKilled += 1;
    }
    save.stats.totalKills += data.kills;
    save.stats.totalPlayTimeMs += data.elapsedTimeMs;
    manager.save(save);

    this.cameras.main.setBackgroundColor(0x07111f);
    // 氛围底色
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        data.victory ? 0x0c2033 : 0x220b10,
        0.5,
      )
      .setDepth(0);

    if (data.victory) this.createVictory(data);
    else this.createDefeat();

    this.createPanel(data, coins);
    this.createButtons(data);
  }

  override update(time: number): void {
    this.fireworks?.update(time);
  }

  // -------------------------------------------------------------------------
  // 胜利界面：金色大 Logo + 庆典烟花
  // -------------------------------------------------------------------------
  private createVictory(data: ResultData): void {
    // 金色背景光晕
    const halo = this.add
      .image(GAME_WIDTH / 2, 220, 'explosion_core_bright')
      .setTint(0xffd76a)
      .setAlpha(0.6)
      .setScale(7.5)
      .setDepth(1);
    this.tweens.add({
      targets: halo,
      alpha: 0.4,
      scale: 6.8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // 胜利大 Logo（弹出动画 + 发光描边）
    const title = this.add
      .text(GAME_WIDTH / 2, 215, '胜 利', {
        fontFamily: 'Arial',
        fontSize: '88px',
        fontStyle: 'bold',
        color: '#ffd76a',
      })
      .setOrigin(0.5)
      .setStroke('#7a3c10', 12)
      .setShadow(0, 8, '#5c2c08', 14, true, true)
      .setDepth(6)
      .setScale(2.6)
      .setAlpha(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });
    // 副标题
    const subtitle =
      data.levelId === 5 ? '恭喜通关全部关卡！' : `关卡完成 · 第 ${data.levelId} 关`;
    const sub = this.add
      .text(GAME_WIDTH / 2, 296, subtitle, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#e8f7ff',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, delay: 350, duration: 400 });
    // 金色装饰线
    const lines = this.add.graphics().setDepth(5).setAlpha(0);
    lines.lineStyle(3, 0xffd76a, 0.85);
    lines.lineBetween(110, 270, 195, 270);
    lines.lineBetween(345, 270, 430, 270);
    lines.lineStyle(3, 0xffd76a, 0.4);
    lines.lineBetween(70, 270, 110, 270);
    lines.lineBetween(430, 270, 470, 270);
    this.tweens.add({ targets: lines, alpha: 1, delay: 200, duration: 450 });
    // 胜利闪白 + 震屏
    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.5)
      .setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 420,
      onComplete: () => flash.destroy(),
    });
    this.cameras.main.shake(350, 0.006);
    // 庆典烟花
    this.fireworks = new Fireworks(this);
    this.fireworks.update(0);
  }

  // -------------------------------------------------------------------------
  // 失败界面：暗红警示 + 碎片坠落
  // -------------------------------------------------------------------------
  private createDefeat(): void {
    // 暗红光晕
    const halo = this.add
      .image(GAME_WIDTH / 2, 210, 'explosion_core')
      .setTint(0xff4a3a)
      .setAlpha(0.42)
      .setScale(7)
      .setDepth(1);
    this.tweens.add({
      targets: halo,
      alpha: 0.26,
      scale: 6.4,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // 失败标题
    const title = this.add
      .text(GAME_WIDTH / 2, 208, '任务失败', {
        fontFamily: 'Arial',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ff6a5c',
      })
      .setOrigin(0.5)
      .setStroke('#4a1410', 10)
      .setShadow(0, 6, '#2c0a08', 12, true, true)
      .setDepth(6)
      .setScale(2.4)
      .setAlpha(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
    // 警示横线
    const warn = this.add.graphics().setDepth(5).setAlpha(0);
    warn.fillStyle(0xff6a5c, 0.75);
    warn.fillRect(0, 34, GAME_WIDTH, 4);
    warn.fillRect(0, 296, GAME_WIDTH, 4);
    this.tweens.add({
      targets: warn,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // 机身碎片坠落
    for (let i = 0; i < 14; i += 1) {
      const size = 5 + Math.random() * 9;
      const shard = this.add
        .triangle(
          Math.random() * GAME_WIDTH,
          -30 - Math.random() * 160,
          0,
          size,
          size * 0.9,
          0,
          size * 1.8,
          size * 0.8,
          0x4a5a6a,
          0.5,
        )
        .setDepth(3);
      this.tweens.add({
        targets: shard,
        y: GAME_HEIGHT + 60,
        x: shard.x + (Math.random() - 0.5) * 140,
        rotation: (Math.random() - 0.5) * 6,
        duration: 1800 + Math.random() * 1600,
        delay: Math.random() * 900,
        ease: 'Linear',
        repeat: -1,
        onRepeat: () => {
          shard.setX(Math.random() * GAME_WIDTH).setY(-30 - Math.random() * 160);
        },
      });
    }
    this.cameras.main.shake(260, 0.006);
  }

  // -------------------------------------------------------------------------
  // 战报面板与按钮（两个界面共用）
  // -------------------------------------------------------------------------
  private createPanel(data: ResultData, coins: number): void {
    const accent = data.victory ? 0xffd76a : 0xff6a5c;
    const panel = this.add.graphics().setDepth(4);
    panel.fillStyle(0x0a1626, 0.78);
    panel.fillRoundedRect(90, 338, 360, 306, 18);
    panel.lineStyle(2, accent, 0.55);
    panel.strokeRoundedRect(90, 338, 360, 306, 18);
    // 面板标题
    this.add
      .text(GAME_WIDTH / 2, 368, data.victory ? '战 报' : '战 报', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#cfe6f2',
      })
      .setOrigin(0.5)
      .setDepth(5);
    const lines = [
      `第 ${data.levelId} 关`,
      `用时 ${(data.elapsedTimeMs / 1000).toFixed(1)} 秒`,
      `击落 ${data.kills} 架`,
      `造成伤害 ${Math.round(data.damageDealt)}`,
      `受到伤害 ${Math.round(data.damageTaken)}`,
      `得分 ${data.score}`,
    ];
    this.add
      .text(GAME_WIDTH / 2, 474, lines.join('\n'), {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#e3eff5',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(5);
    // 分隔线
    const divider = this.add.graphics().setDepth(5);
    divider.lineStyle(1, accent, 0.35);
    divider.lineBetween(130, 586, 410, 586);
    // 金币行
    this.add
      .text(GAME_WIDTH / 2, 612, `金币 +${coins}`, {
        fontFamily: 'Arial',
        fontSize: '26px',
        fontStyle: 'bold',
        color: data.victory ? '#ffd76a' : '#8a93a0',
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private createButtons(data: ResultData): void {
    this.button(
      702,
      '重新挑战',
      data.victory ? 0x2f6d9e : 0x7a3038,
      () => this.scene.start('GameScene', { levelId: data.levelId }),
    );
    this.button(774, '返回主菜单', 0x33445c, () =>
      this.scene.start('MainMenuScene'),
    );
  }

  private button(
    y: number,
    label: string,
    fill: number,
    action: () => void,
  ): void {
    const g = this.add.graphics().setDepth(6);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(165, y - 27, 210, 54, 16);
    g.fillStyle(0xffffff, 0.14);
    g.fillRoundedRect(165, y - 27, 210, 27, { tl: 16, tr: 16, bl: 0, br: 0 });
    const text = this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(7);
    this.add
      .zone(GAME_WIDTH / 2, y, 210, 54)
      .setInteractive({ useHandCursor: true })
      .setDepth(8)
      .on('pointerover', () => {
        g.setAlpha(0.86);
        text.setScale(1.06);
      })
      .on('pointerout', () => {
        g.setAlpha(1);
        text.setScale(1);
      })
      .on('pointerdown', action);
  }
}
