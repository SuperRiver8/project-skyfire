import Phaser from 'phaser';
import { playerBalance } from '../../config/balance/playerBalance';
import { ensurePlayerArt } from '../aircraft/AircraftArt';
import { AircraftVisualController } from '../aircraft/AircraftVisualController';
import { AircraftMotionTrailPool } from '../aircraft/AircraftMotionTrailPool';
import {
  aircraftEffectVisuals,
  aircraftVisuals,
} from '../../config/aircraft/aircraftVisuals';
import { GAME_WIDTH } from '../viewport';
import type { PlayerStats } from './PlayerStats';
import { ensureFlameArt, FLAME_KEY } from '../visuals/flameArt';

export class PlayerAircraft extends Phaser.GameObjects.Container {
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly engineGlow: Phaser.GameObjects.Image;
  private readonly engineFlames: Phaser.GameObjects.Image[];
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly shadowSoft: Phaser.GameObjects.Ellipse;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly wingHighlights: Phaser.GameObjects.Ellipse[];
  private readonly engineParticles: Phaser.GameObjects.Arc[];
  private readonly visualController = new AircraftVisualController(
    aircraftVisuals.player,
  );
  private readonly critGlows: Phaser.GameObjects.Arc[];
  private readonly phoenixHalo: Phaser.GameObjects.Arc;
  private readonly missilePods: Phaser.GameObjects.Graphics;
  private readonly electricAura: Phaser.GameObjects.Graphics;
  private electricDrawAt = -Infinity;
  private electricDrawn = false;
  private form = 0;
  private flightMs = 0;
  private hitFlashMs = 0;
  private trailMs = 0;
  private rapidLevel = 0;
  private critLevel = 0;
  private berserkMs = 0;
  private missileLevel = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, playerBalance.startY);
    ensurePlayerArt(scene);
    this.shadowSoft = scene.add.ellipse(0, 16, 62, 25, 0x020a17, 0.1);
    this.shadow = scene.add.ellipse(0, 15, 46, 17, 0x020a17, 0.2);
    this.visual = scene.add.container(0, 0);
    ensureFlameArt(scene);
    this.engineGlow = scene.add
      .image(0, 35, FLAME_KEY)
      .setTint(0x42cfff)
      .setAlpha(0.5);
    this.engineFlames = [-10, 10].map((x) =>
      scene.add.image(x, 46, FLAME_KEY).setTint(0x75eaff).setAlpha(0.85),
    );
    this.engineParticles = [-11, -5, 5, 11].map((x) =>
      scene.add.circle(x, 63, 2, 0xa8f6ff, 0.7),
    );
    this.sprite = scene.add.image(0, 0, 'player_form_1');
    this.wingHighlights = [-25, 25].map((x) =>
      scene.add.ellipse(x, 13, 21, 5, 0xe4ffff, 0.16),
    );
    this.missilePods = scene.add.graphics();
    this.electricAura = scene.add.graphics();
    this.phoenixHalo = scene.add
      .circle(0, 0, 32, 0xffb45b, 0)
      .setStrokeStyle(2, 0xffb45b, 0.8)
      .setVisible(false);
    this.critGlows = [-24, 24].map((x) =>
      scene.add.circle(x, 6, 3, 0xd9a2ff, 0.7).setVisible(false),
    );
    this.visual.add([
      this.engineGlow,
      ...this.engineFlames,
      ...this.engineParticles,
      this.phoenixHalo,
      this.sprite,
      ...this.wingHighlights,
      this.missilePods,
      this.electricAura,
      ...this.critGlows,
    ]);
    this.add([this.shadowSoft, this.shadow, this.visual]);
    scene.add.existing(this);
    this.setDepth(10);
    this.setForm(1);
  }

  setForm(form: 1 | 2 | 3): void {
    if (this.form === form) return;
    this.form = form;
    this.sprite.setTexture(`player_form_${form}`);
    this.engineGlow.setTint(form === 3 ? 0xff9b57 : 0x42cfff);
  }

  updateFlight(
    deltaMs: number,
    displacementX: number,
    displacementY = 0,
  ): void {
    this.flightMs += deltaMs;
    this.hitFlashMs = Math.max(0, this.hitFlashMs - deltaMs);
    const speed = deltaMs > 0 ? (displacementX / deltaMs) * 1000 : 0;
    const verticalSpeed = deltaMs > 0 ? (displacementY / deltaMs) * 1000 : 0;
    const pose = this.visualController.update(
      deltaMs,
      speed,
      (this.berserkMs > 0 ? 0.3 : 0) +
        Math.min(0.08, Math.abs(verticalSpeed) / 3000),
    );
    const shake = this.hitFlashMs > 0 ? Math.sin(this.flightMs / 11) * 1.8 : 0;
    this.visual.setPosition(shake, pose.bobY).setRotation(pose.roll);
    this.sprite.setScale(pose.bodyScaleX, 1);
    this.wingHighlights[0].setScale(pose.leftWingScaleX, 1);
    this.wingHighlights[1].setScale(pose.rightWingScaleX, 1);
    this.wingHighlights[0].setAlpha(pose.leftHighlightAlpha);
    this.wingHighlights[1].setAlpha(pose.rightHighlightAlpha);
    this.shadow.setPosition(pose.shadowX, 15).setAlpha(pose.shadowAlpha);
    this.shadowSoft.setPosition(pose.shadowX * 1.3, 17);
    this.engineGlow.setX(pose.flameX);
    const pulse = Math.sin(this.flightMs / 120);
    this.engineGlow.setAlpha(0.42 + this.rapidLevel * 0.05 + pulse * 0.09);
    this.engineGlow.setScale(
      (1 + this.rapidLevel * 0.08 + pulse * 0.05) * 0.72,
      pose.flameScaleY * (1 + this.rapidLevel * 0.12) * 0.9,
    );
    for (const [index, flame] of this.engineFlames.entries()) {
      flame.setX((index === 0 ? -10 : 10) + pose.flameX);
      flame.setScale(
        (1 + this.rapidLevel * 0.07) * 0.2 * (1 + pulse * 0.05),
        pose.flameScaleY *
          (1 + this.rapidLevel * 0.1) *
          0.5 *
          (1 + Math.sin(this.flightMs / 85 + index) * 0.1),
      );
      flame.setAlpha(0.8 + Math.sin(this.flightMs / 80 + index * 2.1) * 0.14);
    }
    for (const [index, particle] of this.engineParticles.entries()) {
      const cycle = (this.flightMs * (0.09 + index * 0.01) + index * 19) % 36;
      particle.setPosition((index - 1.5) * 7 + pose.flameX, 58 + cycle);
      particle.setAlpha(0.65 * (1 - cycle / 36));
    }
    for (const glow of this.critGlows)
      glow.setScale(1 + this.critLevel * 0.3 + pulse * 0.08);
    this.phoenixHalo.setScale(1 + pulse * 0.08);
    if (this.missileLevel > 0)
      this.missilePods.setAlpha(
        0.88 + pulse * (this.missileLevel >= 5 ? 0.12 : 0.05),
      );
    if (this.berserkMs > 0 && Math.hypot(speed, verticalSpeed) > 195) {
      this.trailMs += deltaMs;
      if (this.trailMs >= aircraftVisuals.player.trailIntervalMs) {
        this.trailMs = 0;
        AircraftMotionTrailPool.forScene(this.scene).emit(
          this.sprite.texture.key,
          this.x,
          this.y + pose.bobY,
          pose.roll,
          this.sprite.scaleX,
          1,
          false,
          9,
          0xffad80,
        );
      }
    } else this.trailMs = 0;
  }

  hitFeedback(): void {
    this.hitFlashMs = aircraftEffectVisuals.playerHitMs;
    this.visual.setPosition(0, -2);
  }

  setMissileLevel(level: number): void {
    if (level === this.missileLevel) return;
    this.missileLevel = level;
    const graphics = this.missilePods;
    graphics.clear();
    if (level === 0) return;
    // 每级都在机翼上增加可见结构，Lv5 扩展为完整导弹舱。
    for (const side of [-1, 1]) {
      const x = side * (level >= 5 ? 32 : 26);
      const width = level >= 5 ? 15 : 9;
      const height = level >= 5 ? 31 : 20;
      graphics.fillStyle(level >= 5 ? 0xf2b55d : 0x7ca8c3, 0.95);
      graphics.fillRoundedRect(x - width / 2, -12, width, height, 3);
      graphics.fillStyle(0x21364e, 1);
      graphics.fillRect(x - width / 2 + 2, -9, width - 4, height - 7);
      graphics.fillStyle(level >= 5 ? 0xffdd8d : 0xffaa61, 1);
      graphics.fillTriangle(x, -17, x - 4, -7, x + 4, -7);
      if (level >= 2) {
        graphics.fillStyle(0xff8c3f, 0.85);
        graphics.fillTriangle(
          x,
          height + 4,
          x - 3,
          height - 1,
          x + 3,
          height - 1,
        );
      }
      if (level >= 3) {
        const outer = side * 42;
        graphics.fillStyle(0xa8c9d9, 0.95);
        graphics.fillRoundedRect(outer - 4, -5, 8, 17, 2);
        graphics.fillStyle(0xffc977, 1);
        graphics.fillTriangle(outer, -10, outer - 3, -3, outer + 3, -3);
      }
      if (level >= 4) {
        graphics.lineStyle(2, 0xffc678, 0.95);
        graphics.lineBetween(x - 4, 1, x + 4, 1);
        graphics.lineBetween(side * 42 - 3, 4, side * 42 + 3, 4);
      }
      if (level >= 5) {
        graphics.lineStyle(2, 0xffe2a3, 0.9);
        graphics.strokeRoundedRect(
          x - width / 2 - 2,
          -14,
          width + 4,
          height + 4,
          4,
        );
      }
    }
  }

  setBuildVisuals(
    stats: PlayerStats,
    electricActive: boolean,
    phoenixReady: boolean,
  ): void {
    this.rapidLevel = stats.rapidCores;
    this.critLevel = stats.critCores;
    this.berserkMs = stats.berserkMs;
    const berserkFlash =
      stats.berserkMs > 0 &&
      (stats.berserkMs > 2_000 || Math.floor(this.flightMs / 100) % 2 === 0);
    if (this.hitFlashMs > 0)
      this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (berserkFlash) this.sprite.setTint(0xff8b59);
    else this.sprite.clearTint();
    this.engineGlow.setTint(
      stats.berserkMs > 0 ? 0xff6e35 : this.form === 3 ? 0xff9b57 : 0x42cfff,
    );
    const flameColor = stats.berserkMs > 0 ? 0xffa157 : 0x75eaff;
    for (const flame of this.engineFlames) flame.setTint(flameColor);
    for (const particle of this.engineParticles)
      particle.setFillStyle(stats.berserkMs > 0 ? 0xffcd80 : 0xa8f6ff);
    for (const glow of this.critGlows) glow.setVisible(this.critLevel > 0);
    this.phoenixHalo.setVisible(phoenixReady);
    this.drawElectricAura(electricActive);
  }

  private drawElectricAura(active: boolean): void {
    const graphics = this.electricAura;
    if (!active) {
      if (this.electricDrawn) graphics.clear();
      this.electricDrawn = false;
      return;
    }
    if (this.electricDrawn && this.flightMs - this.electricDrawAt < 1000 / 30)
      return;
    this.electricDrawAt = this.flightMs;
    this.electricDrawn = true;
    graphics.clear();
    // 电弧沿机身椭圆轨道持续旋转，取代机头前方的横向电击板。
    const time = this.flightMs / 260;
    for (let arc = 0; arc < 3; arc += 1) {
      let angle = time + (arc * Math.PI * 2) / 3;
      let x = Math.cos(angle) * 37;
      let y = Math.sin(angle) * 26 - 5;
      for (let segment = 0; segment < 7; segment += 1) {
        angle += 0.24;
        const jitter = Math.sin(time * 3 + arc * 4 + segment * 2) * 3;
        const nextX = Math.cos(angle) * (37 + jitter);
        const nextY = Math.sin(angle) * (26 + jitter * 0.5) - 5;
        graphics.lineStyle(7, 0x39cfff, 0.22);
        graphics.lineBetween(x, y, nextX, nextY);
        graphics.lineStyle(2, 0xe7fbff, 0.92);
        graphics.lineBetween(x, y, nextX, nextY);
        x = nextX;
        y = nextY;
      }
      graphics.fillStyle(0xb9f5ff, 0.9);
      graphics.fillCircle(x, y, 3);
    }
  }
}
