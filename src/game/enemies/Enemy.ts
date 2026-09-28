import Phaser from 'phaser';
import { enemyBalance } from '../../config/balance/enemyBalance';
import type { EnemyConfig } from '../../config/enemies/types';
import { ensureEnemyArt } from '../aircraft/AircraftArt';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';

export class Enemy extends Phaser.GameObjects.Image {
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

  constructor(scene: Phaser.Scene) {
    ensureEnemyArt(scene);
    super(scene, 0, 0, 'enemy_scout');
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(x: number, y: number, config: EnemyConfig): void {
    this.config = config;
    this.hp = config.maxHp;
    this.hitFlashMs = 0;
    this.setPosition(x, y);
    this.spawnX = x;
    this.livedMs = 0;
    this.actionCooldownMs = config.fireIntervalMs ?? 0;
    this.charging = false;
    this.warningMs = 0;
    this.setTexture(config.spriteKey);
    this.setScale(config.scale ?? 1);
    this.setAlpha(1);
    this.restoreTint();
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.clearTint();
    this.config = undefined;
    this.hp = 0;
    this.hitFlashMs = 0;
    this.setScale(1);
    this.setAlpha(1);
  }

  isActive(): boolean {
    return this.active;
  }

  advance(
    deltaMs: number,
    playerX = 0,
    playerY = 0,
  ): 'shoot' | 'explode' | null {
    if (!this.config) return null;
    this.livedMs += deltaMs;
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
    // 追踪与折返运动也不能把机翼带出画面左右边界。
    this.x = Math.max(
      this.displayWidth / 2,
      Math.min(GAME_WIDTH - this.displayWidth / 2, this.x),
    );
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
}
