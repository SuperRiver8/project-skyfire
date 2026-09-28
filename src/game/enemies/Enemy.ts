import Phaser from 'phaser';
import { enemyBalance } from '../../config/balance/enemyBalance';
import type { EnemyConfig } from '../../config/enemies/types';
import { ensureEnemyArt } from '../aircraft/AircraftArt';
import { AircraftMotionTrailPool } from '../aircraft/AircraftMotionTrailPool';
import {
  AircraftVisualController,
  type AircraftVisualPose,
} from '../aircraft/AircraftVisualController';
import { aircraftVisuals } from '../../config/aircraft/aircraftVisuals';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import { ensureFlameArt, FLAME_KEY } from '../visuals/flameArt';

const alternateArt: Record<string, string> = {
  enemy_scout: 'enemy_scout_ace',
  enemy_zigzag: 'enemy_zigzag_manta',
  enemy_shooter: 'enemy_shooter_fortress',
};

export class Enemy extends Phaser.GameObjects.Image {
  private static spawnSerial = 0;
  private config: EnemyConfig | undefined;
  private hp = 0;
  private hitFlashMs = 0;
  private spawnX = 0;
  private livedMs = 0;
  private actionCooldownMs = 0;
  private chargeX = 0;
  private chargeY = 0;
  private charging = false;
  private warningMs = 0;
  private visualController = new AircraftVisualController(
    aircraftVisuals.light,
  );
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly flame: Phaser.GameObjects.Image;
  private readonly flameCore: Phaser.GameObjects.Image;
  private readonly leftWing: Phaser.GameObjects.Ellipse;
  private readonly rightWing: Phaser.GameObjects.Ellipse;
  private readonly canopy: Phaser.GameObjects.Ellipse;
  private trailMs = 0;
  private baseScale = 1;
  spawnToken = 0;

  constructor(scene: Phaser.Scene) {
    ensureEnemyArt(scene);
    ensureFlameArt(scene);
    super(scene, 0, 0, 'enemy_scout');
    this.setDepth(6).setActive(false).setVisible(false);
    scene.add.existing(this);
    this.shadow = scene.add
      .ellipse(0, 0, 50, 19, 0x020915, 0.2)
      .setDepth(4)
      .setVisible(false);
    this.flame = scene.add
      .image(0, 0, FLAME_KEY)
      .setFlipY(true)
      .setDepth(5)
      .setVisible(false);
    this.flameCore = scene.add
      .image(0, 0, FLAME_KEY)
      .setFlipY(true)
      .setDepth(5)
      .setVisible(false);
    this.leftWing = scene.add
      .ellipse(0, 0, 19, 5, 0xffe4d2, 0.2)
      .setDepth(7)
      .setVisible(false);
    this.rightWing = scene.add
      .ellipse(0, 0, 19, 5, 0xffe4d2, 0.2)
      .setDepth(7)
      .setVisible(false);
    this.canopy = scene.add
      .ellipse(0, 0, 10, 14, 0xffffff, 0.12)
      .setDepth(7)
      .setVisible(false);
  }

  activate(x: number, y: number, config: EnemyConfig): void {
    this.spawnToken += 1;
    this.config = config;
    this.hp = config.maxHp;
    this.hitFlashMs = 0;
    this.setPosition(x, y);
    this.spawnX = x;
    this.livedMs = 0;
    this.actionCooldownMs = config.fireIntervalMs ?? 0;
    this.charging = false;
    this.warningMs = 0;
    this.trailMs = 0;
    const variant = alternateArt[config.spriteKey];
    this.setTexture(
      variant && Enemy.spawnSerial++ % 2 === 1 ? variant : config.spriteKey,
    );
    this.baseScale = config.scale ?? 1;
    this.visualController = new AircraftVisualController(
      config.aiType === 'TANK'
        ? aircraftVisuals.heavy
        : config.aiType === 'SHOOTER'
          ? aircraftVisuals.medium
          : aircraftVisuals.light,
    );
    this.setRotation(0);
    this.setScale(this.baseScale);
    this.setOrigin(0.5);
    this.setAlpha(1);
    this.restoreTint();
    this.setActive(true).setVisible(true);
    for (const part of [
      this.shadow,
      this.flame,
      this.flameCore,
      this.leftWing,
      this.rightWing,
      this.canopy,
    ])
      part.setVisible(true);
    this.syncVisuals(this.visualController.update(0, 0));
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.clearTint();
    this.config = undefined;
    this.hp = 0;
    this.hitFlashMs = 0;
    this.trailMs = 0;
    this.visualController.reset();
    this.setRotation(0);
    this.setScale(1);
    this.setAlpha(1);
    this.setOrigin(0.5);
    for (const part of [
      this.shadow,
      this.flame,
      this.flameCore,
      this.leftWing,
      this.rightWing,
      this.canopy,
    ])
      part.setVisible(false);
  }

  isActive(): boolean {
    return this.active;
  }

  alignVisuals(): void {
    this.syncVisuals(this.visualController.update(0, 0));
  }

  advance(
    deltaMs: number,
    playerX = 0,
    playerY = 0,
  ): 'shoot' | 'explode' | null {
    if (!this.config) return null;
    this.livedMs += deltaMs;
    const previousX = this.x;
    if (this.config.aiType === 'CHARGER') {
      if (!this.charging && this.y >= 140) {
        this.warningMs += deltaMs;
        this.setAlpha(Math.floor(this.warningMs / 90) % 2 === 0 ? 0.5 : 1);
        if (this.warningMs >= (this.config.chargeDelayMs ?? 650)) {
          const dx = playerX - this.x,
            dy = playerY - this.y,
            length = Math.max(1, Math.hypot(dx, dy));
          this.chargeX = dx / length;
          this.chargeY = dy / length;
          this.charging = true;
          this.setAlpha(1);
        }
      }
      if (this.charging) {
        this.x +=
          (this.chargeX * (this.config.chargeSpeed ?? 480) * deltaMs) / 1000;
        this.y +=
          (this.chargeY * (this.config.chargeSpeed ?? 480) * deltaMs) / 1000;
      } else if (this.y < 140) this.y += (this.config.speed * deltaMs) / 1000;
    } else if (this.config.aiType === 'KAMIKAZE') {
      const dx = playerX - this.x,
        dy = playerY - this.y,
        distance = Math.max(1, Math.hypot(dx, dy));
      this.x += ((dx / distance) * this.config.speed * deltaMs) / 1000;
      this.y += ((dy / distance) * this.config.speed * deltaMs) / 1000;
      if (distance < (this.config.explosionRadius ?? 85)) {
        this.warningMs += deltaMs;
        this.setAlpha(Math.floor(this.warningMs / 70) % 2 === 0 ? 0.5 : 1);
        if (this.warningMs >= 350) return 'explode';
      }
    } else {
      this.y += (this.config.speed * deltaMs) / 1000;
    }
    if (this.config.aiType === 'ZIGZAG') {
      this.x =
        this.spawnX +
        Math.sin(this.livedMs * (this.config.zigzagFrequency ?? 0)) *
          (this.config.zigzagAmplitude ?? 0);
    }
    if (
      this.config.aiType === 'STRAIGHT' ||
      this.config.aiType === 'SHOOTER' ||
      this.config.aiType === 'TANK'
    ) {
      const phase = this.spawnX / 55;
      const period = this.config.aiType === 'TANK' ? 1250 : 410;
      const amplitude =
        this.config.aiType === 'TANK'
          ? 24
          : this.config.aiType === 'SHOOTER'
            ? 4
            : 6;
      this.x =
        this.spawnX +
        (Math.sin(this.livedMs / period + phase) - Math.sin(phase)) * amplitude;
    }
    // 先限制真实坐标，再用实际位移计算侧倾；贴边时不会继续假装转向。
    this.x = Math.max(
      this.displayWidth / 2,
      Math.min(GAME_WIDTH - this.displayWidth / 2, this.x),
    );
    const lateralSpeed =
      deltaMs > 0 ? ((this.x - previousX) / deltaMs) * 1000 : 0;
    const boost =
      this.config.aiType === 'CHARGER' && this.charging
        ? 0.65
        : this.config.aiType === 'KAMIKAZE' && this.warningMs > 0
          ? 0.5
          : 0;
    const pose = this.visualController.update(deltaMs, lateralSpeed, boost);
    this.syncVisuals(pose);
    if (
      (this.config.aiType === 'CHARGER' && this.charging) ||
      (this.config.aiType === 'KAMIKAZE' && this.warningMs > 0)
    ) {
      this.trailMs += deltaMs;
      if (this.trailMs >= this.visualController.config.trailIntervalMs) {
        this.trailMs = 0;
        AircraftMotionTrailPool.forScene(this.scene).emit(
          this.texture.key,
          this.x,
          this.y,
          this.rotation,
          this.scaleX,
          this.scaleY,
          false,
          5,
          this.config.aiType === 'KAMIKAZE' ? 0xff7b8f : 0xffc88f,
        );
      }
    } else this.trailMs = 0;
    if (this.hitFlashMs > 0) {
      this.hitFlashMs -= deltaMs;
      if (this.hitFlashMs <= 0) this.restoreTint();
    }
    if (this.config.fireIntervalMs && this.y > 60 && this.y < 650) {
      this.actionCooldownMs -= deltaMs;
      if (this.actionCooldownMs <= 0) {
        this.actionCooldownMs += this.config.fireIntervalMs;
        return 'shoot';
      }
    }
    return null;
  }

  takeDamage(damage: number): boolean {
    if (!this.config || this.hp <= 0) return false;
    this.hp = Math.max(0, this.hp - Math.max(0, damage));
    this.hitFlashMs = enemyBalance.hitFlashMs;
    this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    return this.hp === 0;
  }

  private syncVisuals(pose: AircraftVisualPose): void {
    const scale = this.baseScale;
    const charging = this.config?.aiType === 'CHARGER' && this.charging;
    const warning = this.config?.aiType === 'KAMIKAZE' && this.warningMs > 0;
    const jitter =
      (charging || warning ? 1.5 : 0) * Math.sin(this.livedMs / 17);
    const hitJitter =
      this.hitFlashMs > 0 ? Math.sin(this.livedMs / 9) * 1.6 : 0;
    this.setRotation(pose.roll);
    this.setScale(scale * pose.bodyScaleX, scale * (charging ? 1.06 : 1));
    // 改显示原点产生抖动与抬头感，世界坐标和固定命中框保持不变。
    this.setOrigin(
      0.5 + (jitter + hitJitter) / 80,
      0.5 + (charging ? 0.012 : 0),
    );
    this.shadow
      .setPosition(this.x + pose.shadowX, this.y + 15 * scale)
      .setScale(scale * 1.1, scale)
      .setAlpha(pose.shadowAlpha);
    const flamePulse = 0.62 + Math.sin(this.livedMs / 70) * 0.16;
    this.flame
      .setPosition(this.x + pose.flameX, this.y - 41 * scale + pose.bobY)
      .setScale(
        scale * 0.28,
        scale * 0.48 * pose.flameScaleY * (charging ? 1.3 : 1),
      )
      .setTint(warning ? 0xff5353 : charging ? 0xffd483 : 0xffad72)
      .setAlpha(flamePulse * (charging ? 1.25 : 1));
    this.flameCore
      .setPosition(this.x + pose.flameX, this.y - 42 * scale + pose.bobY)
      .setScale(
        scale * 0.22,
        scale * 0.38 * pose.flameScaleY * (charging ? 1.25 : 1),
      )
      .setTint(warning ? 0xffd5aa : 0xffe1b1)
      .setAlpha(0.7 + Math.sin(this.livedMs / 55) * 0.14);
    this.leftWing
      .setPosition(this.x - 24 * scale, this.y - 12 * scale + pose.bobY)
      .setRotation(pose.roll)
      .setScale(scale * pose.leftWingScaleX, scale)
      .setAlpha(pose.leftHighlightAlpha);
    this.rightWing
      .setPosition(this.x + 24 * scale, this.y - 12 * scale + pose.bobY)
      .setRotation(pose.roll)
      .setScale(scale * pose.rightWingScaleX, scale)
      .setAlpha(pose.rightHighlightAlpha);
    this.canopy
      .setPosition(this.x, this.y + 7 * scale + pose.bobY)
      .setScale(scale)
      .setAlpha(0.12 + Math.abs(pose.bank) * 0.06);
  }

  isBelowScreen(): boolean {
    return this.y - this.displayHeight / 2 > GAME_HEIGHT;
  }

  get hitboxWidth(): number {
    return this.config?.hitbox.width ?? 0;
  }

  get hitboxHeight(): number {
    return this.config?.hitbox.height ?? 0;
  }

  get scoreValue(): number {
    return this.config?.score ?? 0;
  }

  get expValue(): number {
    return this.config?.exp ?? 0;
  }

  get collisionDamage(): number {
    return this.config?.collisionDamage ?? 0;
  }

  get currentHp(): number {
    return this.hp;
  }
  get maxHp(): number {
    return this.config?.maxHp ?? 0;
  }
  get isElite(): boolean {
    return this.config?.aiType === 'TANK';
  }
  knockback(fromX: number, fromY: number, distance: number): void {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const length = Math.max(1, Math.hypot(dx, dy));
    this.x = Phaser.Math.Clamp(
      this.x + (dx / length) * distance,
      this.displayWidth / 2,
      GAME_WIDTH - this.displayWidth / 2,
    );
    this.y += (dy / length) * distance;
    this.spawnX = this.x;
  }

  get aiType(): EnemyConfig['aiType'] | undefined {
    return this.config?.aiType;
  }
  get explosionRadius(): number {
    return this.config?.explosionRadius ?? 0;
  }

  private restoreTint(): void {
    this.clearTint();
    if (this.config?.tint) this.setTint(this.config.tint);
  }

  override destroy(fromScene?: boolean): void {
    this.shadow.destroy();
    this.flame.destroy();
    this.flameCore.destroy();
    this.leftWing.destroy();
    this.rightWing.destroy();
    this.canopy.destroy();
    super.destroy(fromScene);
  }
}
