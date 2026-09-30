import Phaser from 'phaser';
import { getBossConfig, type BossConfig } from '../../config/bosses';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import { GAME_WIDTH } from '../viewport';
import { AircraftVisualController } from '../aircraft/AircraftVisualController';
import { AircraftMotionTrailPool } from '../aircraft/AircraftMotionTrailPool';
import {
  aircraftEffectVisuals,
  aircraftVisuals,
} from '../../config/aircraft/aircraftVisuals';
import {
  initialAttackElapsed,
  phaseForHp,
  type BossPhase,
} from './BossPhaseController';
import { ensureBossArt } from './BossArt';
import { ensureFlameArt, FLAME_KEY } from '../visuals/flameArt';
import {
  getLevelDifficulty,
  scaleBossConfig,
  type LevelDifficulty,
} from '../../config/balance/levelDifficulty';
import { bossSkills, type BossEffect, type SkillContext } from './BossSkills';

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
  private readonly config: BossConfig;
  private readonly turrets: Phaser.GameObjects.Rectangle[];
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
  private readonly skillTimers = new Map<string, number>();
  private readonly effects: BossEffect[] = [];
  private shieldMs = 0;
  private readonly shieldVisual: Phaser.GameObjects.Ellipse;
  private readonly hpBackground: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: PlayerAircraft,
    private readonly bullets: EnemyBulletPool,
    private readonly onDead: () => void,
    private readonly onLaserHit: (damage: number) => void,
    private readonly onPhase: (phase: BossPhase) => void,
    private readonly onExplosion: (x: number, y: number) => void,
    bossId = 'mechanical_eagle',
    hpMultiplier = 1,
    private readonly difficulty: LevelDifficulty = getLevelDifficulty(1),
  ) {
    this.config = scaleBossConfig(
      getBossConfig(bossId),
      hpMultiplier,
      difficulty,
    );
    this.hp = this.config.maxHp;
    ensureBossArt(scene);
    const key = `boss_${this.config.id}`;
    const vis = this.config.visual;
    this.shadow = scene.add
      .ellipse(GAME_WIDTH / 2, 82, 160, 39, 0x020914, 0.3)
      .setDepth(4);
    this.visual = scene.add.container(GAME_WIDTH / 2, 65).setDepth(5);
    ensureFlameArt(scene);
    this.engines = vis.engineOffsets.map((x) =>
      scene.add
        .image(x, vis.engineY, FLAME_KEY)
        .setFlipY(true)
        .setTint(0xff8d5f)
        .setAlpha(0.78),
    );
    this.engineCores = vis.engineOffsets.map((x) =>
      scene.add
        .image(x, vis.engineCoreY, FLAME_KEY)
        .setFlipY(true)
        .setTint(0xffdaa0)
        .setAlpha(0.85),
    );
    this.leftWing = scene.add.triangle(
      vis.wingX[0],
      vis.wingY,
      38,
      4,
      0,
      34,
      49,
      33,
      vis.wingColor,
      0.9,
    );
    this.rightWing = scene.add.triangle(
      vis.wingX[1],
      vis.wingY,
      0,
      4,
      49,
      34,
      11,
      33,
      vis.wingColor,
      0.9,
    );
    this.sprite = scene.add.image(0, 0, key).setFlipY(true);
    this.highlights = vis.highlightOffsets.map((x) =>
      scene.add.ellipse(x, vis.highlightY, 47, 8, vis.highlightColor, 0.18),
    );
    this.turrets = vis.turretOffsets.map((x) =>
      scene.add
        .rectangle(x, vis.turretY, 16, 29, 0x333247)
        .setStrokeStyle(2, vis.turretStrokeColor),
    );
    this.core = scene.add
      .circle(0, vis.coreY, vis.coreRadius, vis.coreColors[0], 0.75)
      .setStrokeStyle(2, 0xffe3af);
    this.shieldVisual = scene.add
      .ellipse(0, 34, 170, 96, 0x66ccff, 0)
      .setStrokeStyle(3, 0x8fdcff, 0.75)
      .setVisible(false);
    this.visual.add([
      ...this.engines,
      ...this.engineCores,
      this.leftWing,
      this.rightWing,
      this.sprite,
      ...this.highlights,
      ...this.turrets,
      this.core,
      this.shieldVisual,
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
      .text(GAME_WIDTH / 2, 145, this.config.name, {
        fontFamily: 'Arial',
        fontSize: '19px',
        color: '#ffd4d4',
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(21);
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
    for (const [id, elapsed] of this.skillTimers)
      this.skillTimers.set(id, elapsed - durationMs);
  }

  damage(amount: number): void {
    if (!this.isActive() || this.state === 'ENTER') return;
    // 护盾矩阵开启时大幅减伤
    if (this.shieldMs > 0) amount *= 0.25;
    this.hp = Math.max(0, this.hp - amount);
    this.hpFill.width = (430 * this.hp) / this.config.maxHp;
    this.hitFlashMs = 95;
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    if (this.hp === 0) {
      this.beginDeath();
      return;
    }
    const next = phaseForHp(this.hp, this.config.maxHp, this.config.id);
    if (next > this.phase) {
      this.phase = next;
      this.state = 'PHASE_TRANSITION';
      this.stateMs = 0;
      this.scene.cameras.main.shake(260, 0.004);
      this.title.setText(`第 ${next} 阶段 · ${this.config.name}`);
      this.sprite.setTint(
        next === 3 ? this.config.visual.phase3Tint : 0xfff1cf,
      );
      this.onPhase(next);
    }
  }

  update(deltaMs: number): void {
    this.stateMs += deltaMs;
    this.hitFlashMs = Math.max(0, this.hitFlashMs - deltaMs);
    if (this.state === 'ENTER') {
      this.visual.y =
        65 + Math.min(1, this.stateMs / this.config.enterMs) * 180;
      this.updateVisuals(deltaMs, 0);
      if (this.stateMs >= this.config.enterMs) {
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
      if (this.stateMs >= this.config.deathMs) {
        this.state = 'DEAD';
        this.onDead();
      }
      return;
    }
    if (this.state === 'DEAD') return;
    if (this.state === 'PHASE_TRANSITION') {
      this.updateVisuals(deltaMs, 0, 1 + 0.1 * Math.sin(this.stateMs / 50));
      if (this.stateMs >= this.config.transitionMs) {
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
    this.updateAttacks(deltaMs);
    this.updateEffects(deltaMs);
    if (this.shieldMs > 0) {
      this.shieldMs -= deltaMs;
      this.shieldVisual.setAlpha(0.28 + Math.sin(this.stateMs / 70) * 0.1);
      if (this.shieldMs <= 0) this.shieldVisual.setVisible(false);
    }
  }

  private updateVisuals(
    deltaMs: number,
    velocityX: number,
    scale = 1,
    boost = 0,
  ): void {
    const pose = this.visualController.update(deltaMs, velocityX, boost);
    this.visual
      .setRotation(pose.roll)
      .setScale(
        scale * pose.bodyScaleX * this.config.displayScale,
        scale * this.config.displayScale,
      );
    this.shadow
      .setPosition(this.x + pose.shadowX, this.y + 17)
      .setAlpha(pose.shadowAlpha)
      .setScale(scale);
    const vis = this.config.visual;
    const enginePulse = Math.sin(this.stateMs / 60) * 0.07;
    for (const [index, engine] of this.engines.entries()) {
      engine
        .setPosition(vis.engineOffsets[index] + pose.flameX, vis.engineY)
        .setScale(
          (1 + this.phase * 0.06) * 0.42 * (1 + enginePulse),
          pose.flameScaleY * (1 + this.phase * 0.1) * 0.7,
        )
        .setTint(this.phase === 3 ? 0xff645e : 0xffa16b)
        .setAlpha(0.7 + this.phase * 0.06 + enginePulse * 0.4);
    }
    for (const [index, core] of this.engineCores.entries())
      core
        .setPosition(vis.engineOffsets[index] + pose.flameX, vis.engineCoreY)
        .setScale(
          (0.9 + enginePulse) * 0.3,
          pose.flameScaleY * (1 + this.phase * 0.1) * 0.52,
        )
        .setTint(this.phase === 3 ? 0xffe4b7 : 0xffd69b)
        .setAlpha(0.85 + Math.sin(this.stateMs / 50) * 0.1);
    this.leftWing
      .setPosition(vis.wingX[0] - this.phase * 3, vis.wingY)
      .setScale(pose.leftWingScaleX * (1 + this.phase * 0.04), 1);
    this.rightWing
      .setPosition(vis.wingX[1] + this.phase * 3, vis.wingY)
      .setScale(pose.rightWingScaleX * (1 + this.phase * 0.04), 1);
    for (const [index, turret] of this.turrets.entries())
      turret
        .setPosition(
          vis.turretOffsets[index] +
            (index % 2 === 0 ? -1 : 1) * this.phase * 2,
          vis.turretY + this.phase * 2,
        )
        .setScale(1, 1 + this.phase * 0.12);
    this.core
      .setScale(1 + this.phase * 0.14 + Math.sin(this.stateMs / 95) * 0.07)
      .setFillStyle(vis.coreColors[this.phase === 3 ? 1 : 0], 0.72);
    for (const [index, highlight] of this.highlights.entries())
      highlight.setAlpha(
        index % 2 === 0 ? pose.leftHighlightAlpha : pose.rightHighlightAlpha,
      );
    this.sprite.setX(this.hitFlashMs > 0 ? Math.sin(this.stateMs / 10) * 2 : 0);
    if (this.hitFlashMs > 0)
      this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (this.phase === 3) this.sprite.setTint(vis.phase3Tint);
    else this.sprite.clearTint();
  }

  private updateAttacks(deltaMs: number): void {
    const ctx = this.skillContext();
    for (const attack of this.config.attacks) {
      if (this.phase < attack.unlockPhase) continue;
      const interval = attack.intervalMs[this.phase - 1];
      const elapsed =
        (this.skillTimers.get(attack.id) ??
          initialAttackElapsed(attack, this.phase)) + deltaMs;
      if (elapsed >= interval) {
        this.skillTimers.set(attack.id, elapsed - interval);
        const skill = bossSkills[attack.id];
        if (skill) {
          const effect = skill.cast(ctx);
          if (effect) this.effects.push(effect);
        }
      } else {
        this.skillTimers.set(attack.id, elapsed);
      }
    }
  }

  private updateEffects(deltaMs: number): void {
    const ctx = this.skillContext();
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const effect = this.effects[i];
      if (effect.update(deltaMs, ctx)) {
        effect.destroy();
        this.effects.splice(i, 1);
      }
    }
  }

  private skillContext(): SkillContext {
    return {
      scene: this.scene,
      player: this.player,
      bullets: this.bullets,
      config: this.config,
      phase: this.phase,
      x: this.x,
      y: this.y,
      onLaserHit: (damage) => this.hitPlayer(damage),
      startDash: (targetX, warningMs, color) =>
        this.startDashWarning(targetX, warningMs, color),
      setShield: (durationMs) => this.setShield(durationMs),
    };
  }

  private setShield(durationMs: number): void {
    this.shieldMs = durationMs;
    this.shieldVisual.setVisible(true).setAlpha(0.28);
  }

  private hitPlayer(damage: number): void {
    // 激光、领域和冲锋不经过敌弹池，需要单独应用一次伤害倍率。
    this.onLaserHit(damage * this.difficulty.damage);
  }

  private startDashWarning(
    targetX: number,
    warningMs: number,
    color = 0xff3a3a,
  ): void {
    const marker = this.scene.add
      .rectangle(targetX, 480, 75, 960, color, 0.18)
      .setDepth(3);
    this.scene.time.delayedCall(warningMs, () => {
      marker.destroy();
      if (!this.isActive()) return;
      this.dashVisualMs = aircraftEffectVisuals.bossDashVisualMs;
      this.dashTargetX = targetX;
      if (Math.abs(this.player.x - targetX) < 38) this.hitPlayer(25);
      this.scene.cameras.main.shake(130, 0.005);
    });
  }

  private beginDeath(): void {
    this.state = 'DYING';
    this.stateMs = 0;
    for (const effect of this.effects) effect.destroy();
    this.effects.length = 0;
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
    for (const effect of this.effects) effect.destroy();
    this.effects.length = 0;
    this.visual.destroy();
    this.shadow.destroy();
    this.hpBackground.destroy();
    this.hpFill.destroy();
    this.title.destroy();
  }
}
