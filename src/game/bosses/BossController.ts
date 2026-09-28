import Phaser from 'phaser';
import { mechanicalEagleConfig as config } from '../../config/bosses/mechanicalEagle';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import { GAME_WIDTH } from '../viewport';
import { AircraftVisualController } from '../aircraft/AircraftVisualController';
import { AircraftMotionTrailPool } from '../aircraft/AircraftMotionTrailPool';
import {
  aircraftEffectVisuals,
  aircraftVisuals,
} from '../../config/aircraft/aircraftVisuals';
import { phaseForHp, type BossPhase } from './BossPhaseController';
import {
  canvasArt,
  fillLinear,
  fillPoly,
  glowBall,
  glowPoly,
  strokeLine,
} from '../visuals/pseudo3d';
import { ensureFlameArt, FLAME_KEY } from '../visuals/flameArt';

export type BossState =
  | 'ENTER'
  | 'PHASE_1'
  | 'PHASE_TRANSITION'
  | 'PHASE_2'
  | 'PHASE_3'
  | 'DYING'
  | 'DEAD';

export class BossController {
  readonly sprite: Phaser.GameObjects.Image;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly leftWing: Phaser.GameObjects.Triangle;
  private readonly rightWing: Phaser.GameObjects.Triangle;
  private readonly leftTurret: Phaser.GameObjects.Rectangle;
  private readonly rightTurret: Phaser.GameObjects.Rectangle;
  private readonly core: Phaser.GameObjects.Arc;
  private readonly engines: Phaser.GameObjects.Image[];
  private readonly engineCores: Phaser.GameObjects.Image[];
  private readonly highlights: Phaser.GameObjects.Ellipse[];
  private readonly visualController = new AircraftVisualController(
    aircraftVisuals.boss,
  );
  private hitFlashMs = 0;
  private dashVisualMs = 0;
  private dashTargetX = 0;
  private trailMs = 0;
  hp: number;
  state: BossState = 'ENTER';
  phase: BossPhase = 1;
  private stateMs = 0;
  private attackMs = 0;
  private circleMs = -500;
  private missileMs = -1000;
  private laserMs = 0;
  private dashMs = 0;
  private readonly hpBackground: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly warning: Phaser.GameObjects.Rectangle;
  private laserX = 0;
  private laserActiveMs = 0;
  private readonly beam: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: PlayerAircraft,
    private readonly bullets: EnemyBulletPool,
    private readonly onDead: () => void,
    private readonly onLaserHit: (damage: number) => void,
    private readonly onPhase: (phase: BossPhase) => void,
    private readonly onExplosion: (x: number, y: number) => void,
    private readonly hpMultiplier = 1,
  ) {
    this.hp = Math.round(config.maxHp * hpMultiplier);
    const key = 'mechanical_eagle';
    canvasArt(scene, key, 200, 130, (ctx) => {
      // 1. 外发光轮廓
      glowPoly(
        ctx,
        [
          [100, 8],
          [158, 68],
          [182, 104],
          [122, 106],
          [100, 96],
          [78, 106],
          [18, 104],
          [42, 68],
        ],
        0xe04c53,
        16,
        0.3,
      );
      // 2. 机翼下表面
      fillPoly(ctx, [[100, 58], [12, 102], [62, 96], [100, 84]], 0x12152a, 1);
      fillPoly(ctx, [[100, 58], [188, 102], [138, 96], [100, 84]], 0x12152a, 1);
      // 3. 机翼上表面（金属渐变）
      fillLinear(
        ctx,
        [
          [100, 55],
          [20, 95],
          [62, 88],
          [100, 76],
        ],
        [
          [0, 0x8b93a8],
          [1, 0x2c3244],
        ],
        100,
        55,
        100,
        95,
      );
      fillLinear(
        ctx,
        [
          [100, 55],
          [180, 95],
          [138, 88],
          [100, 76],
        ],
        [
          [0, 0x8b93a8],
          [1, 0x2c3244],
        ],
        100,
        55,
        100,
        95,
      );
      // 4. 机身（鹰形轮廓，横向渐变圆柱感）
      fillLinear(
        ctx,
        [
          [100, 6],
          [84, 26],
          [74, 58],
          [88, 98],
          [112, 98],
          [126, 58],
          [116, 26],
        ],
        [
          [0, 0x5d6478],
          [0.42, 0x9aa4bb],
          [1, 0x2a2f42],
        ],
        72,
        0,
        128,
        0,
      );
      // 5. 鹰头
      fillLinear(
        ctx,
        [
          [100, 6],
          [88, 24],
          [112, 24],
        ],
        [
          [0, 0xdfe6f2],
          [1, 0x6e7790],
        ],
        100,
        6,
        100,
        24,
      );
      // 6. 红色过载核心（发光球体）
      glowBall(
        ctx,
        100,
        46,
        14,
        [
          [0, 0xffe0b0],
          [0.45, 0xff6a4f],
          [1, 0x912a3a],
        ],
        16,
      );
      glowBall(ctx, 100, 46, 5, [[0, 0xffffff], [1, 0xffc9a0]], 10);
      // 7. 金色高光线
      strokeLine(ctx, 100, 10, 100, 34, 0xffd1a2, 2, 0.85);
      strokeLine(ctx, 30, 90, 74, 66, 0xffd1a2, 1.5, 0.6);
      strokeLine(ctx, 170, 90, 126, 66, 0xffd1a2, 1.5, 0.6);
      // 8. 引擎喷口（尾部两侧，发光）
      for (const side of [1, -1]) {
        const x = 100 + side * 52;
        fillLinear(
          ctx,
          [
            [x - 12, 86],
            [x - 12, 104],
            [x + 12, 104],
            [x + 12, 86],
          ],
          [
            [0, 0x5a6178],
            [1, 0x232838],
          ],
          x - 12,
          86,
          x - 12,
          104,
        );
        glowBall(ctx, x, 98, 6, [[0, 0xffd9a8], [1, 0xff704f, 0]], 12);
      }
      // 9. 装甲板线
      strokeLine(ctx, 82, 64, 118, 64, 0x1b1b32, 1.5, 0.8);
    });
    this.shadow = scene.add
      .ellipse(GAME_WIDTH / 2, 82, 160, 39, 0x020914, 0.3)
      .setDepth(4);
    this.visual = scene.add.container(GAME_WIDTH / 2, 65).setDepth(5);
    ensureFlameArt(scene);
    this.engines = [-43, 43].map((x) =>
      scene.add
        .image(x, -51, FLAME_KEY)
        .setFlipY(true)
        .setTint(0xff8d5f)
        .setAlpha(0.78),
    );
    this.engineCores = [-43, 43].map((x) =>
      scene.add
        .image(x, -52, FLAME_KEY)
        .setFlipY(true)
        .setTint(0xffdaa0)
        .setAlpha(0.85),
    );
    this.leftWing = scene.add.triangle(
      -69,
      5,
      38,
      4,
      0,
      34,
      49,
      33,
      0x81354b,
      0.9,
    );
    this.rightWing = scene.add.triangle(
      69,
      5,
      0,
      4,
      49,
      34,
      11,
      33,
      0x81354b,
      0.9,
    );
    this.sprite = scene.add.image(0, 0, key).setFlipY(true);
    this.highlights = [-64, 64].map((x) =>
      scene.add.ellipse(x, 12, 47, 8, 0xffd0ad, 0.18),
    );
    this.leftTurret = scene.add
      .rectangle(-76, 28, 16, 29, 0x333247)
      .setStrokeStyle(2, 0xffaa73);
    this.rightTurret = scene.add
      .rectangle(76, 28, 16, 29, 0x333247)
      .setStrokeStyle(2, 0xffaa73);
    this.core = scene.add
      .circle(0, 19, 13, 0xffad69, 0.75)
      .setStrokeStyle(2, 0xffe3af);
    this.visual.add([
      ...this.engines,
      ...this.engineCores,
      this.leftWing,
      this.rightWing,
      this.sprite,
      ...this.highlights,
      this.leftTurret,
      this.rightTurret,
      this.core,
    ]);
    this.hpBackground = scene.add
      .rectangle(GAME_WIDTH / 2, 120, 430, 14, 0x3a1720)
      .setVisible(false)
      .setDepth(20);
    this.hpFill = scene.add
      .rectangle(55, 120, 430, 12, 0xf34f57)
      .setOrigin(0, 0.5)
      .setVisible(false)
      .setDepth(21);
    this.title = scene.add
      .text(GAME_WIDTH / 2, 145, config.name, {
        fontFamily: 'Arial',
        fontSize: '19px',
        color: '#ffd4d4',
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(21);
    this.warning = scene.add
      .rectangle(0, 480, 65, 960, 0xff4444, 0.25)
      .setVisible(false)
      .setDepth(3);
    this.beam = scene.add
      .rectangle(0, 480, 55, 960, 0xff6161, 0.75)
      .setVisible(false)
      .setDepth(4);
  }

  get x(): number {
    return this.visual.x;
  }
  get y(): number {
    return this.visual.y;
  }
  isActive(): boolean {
    return this.state !== 'DYING' && this.state !== 'DEAD';
  }
  isDamageable(): boolean {
    return this.isActive() && this.state !== 'ENTER';
  }

  interruptNormalAttack(durationMs: number): void {
    if (!this.isActive() || this.state === 'PHASE_TRANSITION') return;
    this.attackMs -= durationMs;
    this.circleMs -= durationMs;
    this.missileMs -= durationMs;
    // 激光和冲刺属于阶段技能，EMP 不改它们的计时。
  }

  damage(amount: number): void {
    if (!this.isActive() || this.state === 'ENTER') return;
    this.hp = Math.max(0, this.hp - amount);
    this.hpFill.width = (430 * this.hp) / (config.maxHp * this.hpMultiplier);
    this.hitFlashMs = 95;
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    if (this.hp === 0) {
      this.beginDeath();
      return;
    }
    const next = phaseForHp(this.hp, config.maxHp * this.hpMultiplier);
    if (next > this.phase) {
      this.phase = next;
      this.state = 'PHASE_TRANSITION';
      this.stateMs = 0;
      this.scene.cameras.main.shake(260, 0.004);
      this.title.setText(`第 ${next} 阶段 · ${config.name}`);
      this.sprite.setTint(next === 3 ? 0xff4949 : 0xfff1cf);
      this.onPhase(next);
    }
  }

  update(deltaMs: number): void {
    this.stateMs += deltaMs;
    this.hitFlashMs = Math.max(0, this.hitFlashMs - deltaMs);
    if (this.state === 'ENTER') {
      this.visual.y = 65 + Math.min(1, this.stateMs / config.enterMs) * 180;
      this.updateVisuals(deltaMs, 0);
      if (this.stateMs >= config.enterMs) {
        this.state = 'PHASE_1';
        this.stateMs = 0;
        this.hpBackground.setVisible(true);
        this.hpFill.setVisible(true);
        this.title.setVisible(true);
      }
      return;
    }
    if (this.state === 'DYING') {
      this.updateVisuals(deltaMs, 0);
      this.visual.rotation += Math.sin(this.stateMs / 90) * 0.025;
      if (this.stateMs >= 800)
        this.visual.setAlpha(Math.max(0, 1 - (this.stateMs - 800) / 200));
      if (this.stateMs >= config.deathMs) {
        this.state = 'DEAD';
        this.onDead();
      }
      return;
    }
    if (this.state === 'DEAD') return;
    if (this.state === 'PHASE_TRANSITION') {
      this.updateVisuals(deltaMs, 0, 1 + 0.1 * Math.sin(this.stateMs / 50));
      if (this.stateMs >= config.transitionMs) {
        this.state = this.phase === 2 ? 'PHASE_2' : 'PHASE_3';
        this.stateMs = 0;
      }
      return;
    }
    const previousX = this.visual.x;
    const baseX = GAME_WIDTH / 2 + Math.sin(this.stateMs / 700) * 145;
    if (this.dashVisualMs > 0) {
      this.dashVisualMs = Math.max(0, this.dashVisualMs - deltaMs);
      const progress =
        1 - this.dashVisualMs / aircraftEffectVisuals.bossDashVisualMs;
      this.visual.x =
        baseX +
        Phaser.Math.Clamp(this.dashTargetX - baseX, -125, 125) *
          Math.sin(progress * Math.PI) *
          0.7;
    } else this.visual.x = baseX;
    this.updateVisuals(
      deltaMs,
      deltaMs > 0 ? ((this.visual.x - previousX) * 1000) / deltaMs : 0,
      1,
      this.dashVisualMs > 0 ? 0.55 : 0,
    );
    if (this.dashVisualMs > 0) {
      this.trailMs += deltaMs;
      if (this.trailMs >= aircraftVisuals.boss.trailIntervalMs) {
        this.trailMs = 0;
        AircraftMotionTrailPool.forScene(this.scene).emit(
          this.sprite.texture.key,
          this.x,
          this.y,
          this.visual.rotation,
          this.visual.scaleX,
          this.visual.scaleY,
          true,
          4,
          0xff9489,
        );
      }
    } else this.trailMs = 0;
    this.attackMs += deltaMs;
    this.circleMs += deltaMs;
    this.missileMs += deltaMs;
    this.laserMs += deltaMs;
    this.dashMs += deltaMs;
    if (this.attackMs >= config.fanIntervalMs[this.phase - 1]) {
      this.attackMs = 0;
      this.fanShot();
    }
    if (this.phase >= 2 && this.circleMs >= config.circleIntervalMs) {
      this.circleMs = 0;
      this.circleShot();
    }
    if (this.missileMs >= config.missileIntervalMs[this.phase - 1]) {
      this.missileMs = 0;
      this.missileShot();
    }
    if (
      this.phase >= 2 &&
      this.laserMs >= config.laserIntervalMs &&
      !this.warning.visible &&
      !this.beam.visible
    ) {
      this.laserMs = 0;
      this.startLaserWarning();
    }
    if (this.phase === 3 && this.dashMs >= config.dashIntervalMs) {
      this.dashMs = 0;
      this.startDashWarning();
    }
    if (this.warning.visible && this.stateMs >= this.laserActiveMs) {
      this.warning.setVisible(false);
      this.beam.setPosition(this.laserX, 480).setVisible(true);
      this.laserActiveMs = this.stateMs + config.laserActiveMs;
    }
    if (this.beam.visible) {
      const sweep = Math.min(
        1,
        1 - (this.laserActiveMs - this.stateMs) / config.laserActiveMs,
      );
      this.beam.x = this.laserX - 70 + sweep * 140;
      if (Math.abs(this.player.x - this.beam.x) < 37) this.onLaserHit(15);
      if (this.stateMs >= this.laserActiveMs) this.beam.setVisible(false);
    }
  }

  private updateVisuals(
    deltaMs: number,
    velocityX: number,
    scale = 1,
    boost = 0,
  ): void {
    const pose = this.visualController.update(deltaMs, velocityX, boost);
    this.visual.setRotation(pose.roll).setScale(scale * pose.bodyScaleX, scale);
    this.shadow
      .setPosition(this.x + pose.shadowX, this.y + 17)
      .setAlpha(pose.shadowAlpha)
      .setScale(scale);
    const enginePulse = Math.sin(this.stateMs / 60) * 0.07;
    for (const [index, engine] of this.engines.entries()) {
      engine
        .setPosition((index === 0 ? -43 : 43) + pose.flameX, -51)
        .setScale(
          (1 + this.phase * 0.06) * 0.42 * (1 + enginePulse),
          pose.flameScaleY * (1 + this.phase * 0.1) * 0.7,
        )
        .setTint(this.phase === 3 ? 0xff645e : 0xffa16b)
        .setAlpha(0.7 + this.phase * 0.06 + enginePulse * 0.4);
    }
    for (const [index, core] of this.engineCores.entries())
      core
        .setPosition((index === 0 ? -43 : 43) + pose.flameX, -52)
        .setScale(
          (0.9 + enginePulse) * 0.3,
          pose.flameScaleY * (1 + this.phase * 0.1) * 0.52,
        )
        .setTint(this.phase === 3 ? 0xffe4b7 : 0xffd69b)
        .setAlpha(0.85 + Math.sin(this.stateMs / 50) * 0.1);
    this.leftWing
      .setPosition(-69 - this.phase * 3, 5)
      .setScale(pose.leftWingScaleX * (1 + this.phase * 0.04), 1);
    this.rightWing
      .setPosition(69 + this.phase * 3, 5)
      .setScale(pose.rightWingScaleX * (1 + this.phase * 0.04), 1);
    this.leftTurret
      .setPosition(-76 - this.phase * 2, 26 + this.phase * 2)
      .setScale(1, 1 + this.phase * 0.12);
    this.rightTurret
      .setPosition(76 + this.phase * 2, 26 + this.phase * 2)
      .setScale(1, 1 + this.phase * 0.12);
    this.core
      .setScale(1 + this.phase * 0.14 + Math.sin(this.stateMs / 95) * 0.07)
      .setFillStyle(this.phase === 3 ? 0xff5353 : 0xffad69, 0.72);
    this.highlights[0].setAlpha(pose.leftHighlightAlpha);
    this.highlights[1].setAlpha(pose.rightHighlightAlpha);
    this.sprite.setX(this.hitFlashMs > 0 ? Math.sin(this.stateMs / 10) * 2 : 0);
    if (this.hitFlashMs > 0)
      this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (this.phase === 3) this.sprite.setTint(0xffa5a5);
    else this.sprite.clearTint();
  }

  private fanShot(): void {
    const count = config.fanCount[this.phase - 1],
      speed = config.bulletSpeed[this.phase - 1];
    const base = Math.atan2(this.player.y - this.y, this.player.x - this.x);
    for (let i = 0; i < count; i += 1) {
      const angle = base + (i - (count - 1) / 2) * 0.15;
      this.bullets.fire(
        this.x,
        this.y + 50,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        12,
      );
    }
  }
  private circleShot(): void {
    for (let i = 0; i < 12; i += 1) {
      const angle = (i * Math.PI) / 6;
      this.bullets.fire(
        this.x,
        this.y + 20,
        Math.cos(angle) * 150,
        Math.sin(angle) * 150,
        10,
      );
    }
  }
  private missileShot(): void {
    const speed = this.phase === 3 ? 230 : 185;
    this.bullets.fire(
      this.x - 55,
      this.y + 35,
      -speed * 0.4,
      speed,
      14,
      this.player,
    );
    this.bullets.fire(
      this.x + 55,
      this.y + 35,
      speed * 0.4,
      speed,
      14,
      this.player,
    );
  }
  private startLaserWarning(): void {
    this.laserX = this.player.x;
    this.warning.setPosition(this.laserX, 480).setVisible(true);
    this.laserActiveMs = this.stateMs + config.laserWarningMs;
  }
  private startDashWarning(): void {
    const targetX = this.player.x;
    const marker = this.scene.add
      .rectangle(targetX, 480, 75, 960, 0xff3a3a, 0.18)
      .setDepth(3);
    this.scene.time.delayedCall(config.dashWarningMs, () => {
      marker.destroy();
      if (!this.isActive()) return;
      this.dashVisualMs = aircraftEffectVisuals.bossDashVisualMs;
      this.dashTargetX = targetX;
      if (Math.abs(this.player.x - targetX) < 38) this.onLaserHit(25);
      this.scene.cameras.main.shake(130, 0.005);
    });
  }
  private beginDeath(): void {
    this.state = 'DYING';
    this.stateMs = 0;
    this.warning.setVisible(false);
    this.beam.setVisible(false);
    this.bullets.clear();
    this.scene.cameras.main.shake(550, 0.009);
    // 分段爆炸让玩家能看清 Boss 被击破的过程。
    for (const [delay, offsetX, offsetY] of [
      [100, -45, -20],
      [250, 50, 5],
      [400, -15, 28],
      [650, 0, 0],
    ]) {
      this.scene.time.delayedCall(delay, () => {
        this.onExplosion(this.x + offsetX, this.y + offsetY);
        if (delay === 650) {
          this.scene.cameras.main.shake(350, 0.012);
          const flash = this.scene.add
            .rectangle(270, 480, 540, 960, 0xffffff, 0.6)
            .setDepth(100);
          this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 220,
            onComplete: () => flash.destroy(),
          });
        }
      });
    }
  }
  destroy(): void {
    this.visual.destroy();
    this.shadow.destroy();
    this.hpBackground.destroy();
    this.hpFill.destroy();
    this.title.destroy();
    this.warning.destroy();
    this.beam.destroy();
  }
}
