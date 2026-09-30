import Phaser from 'phaser';
import { feedbackConfig as config } from '../../config/effects/feedback';
import { ObjectPool } from '../utils/ObjectPool';
import { VisualBudget } from './VisualBudget';
import { canvasArt } from '../visuals/pseudo3d';

class DamageText extends Phaser.GameObjects.Text {
  lifeMs = 0;
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    });
    this.setDepth(30).setActive(false).setVisible(false);
    scene.add.existing(this);
  }
  activate(
    x: number,
    y: number,
    damage: number,
    crit: boolean,
    enhanced: boolean,
  ): void {
    this.setPosition(x, y)
      .setStyle({
        color: enhanced ? '#ff875b' : crit ? '#ffe56a' : '#ffffff',
        fontSize: enhanced ? 34 : crit ? 29 : 20,
      })
      .setText(`${Math.round(damage)}`)
      .setScale(1);
    this.lifeMs = config.textLifeMs;
    this.setAlpha(1).setActive(true).setVisible(true);
  }
  deactivate(): void {
    this.setActive(false).setVisible(false);
  }
  isActive(): boolean {
    return this.active;
  }
  advance(deltaMs: number): boolean {
    this.lifeMs -= deltaMs;
    this.y -= deltaMs * 0.06;
    this.setAlpha(Math.max(0, this.lifeMs / config.textLifeMs));
    return this.lifeMs <= 0;
  }
}

class HitSpark extends Phaser.GameObjects.Image {
  lifeMs = 0;
  vx = 0;
  vy = 0;
  constructor(scene: Phaser.Scene) {
    // 火花共用小贴图，可与图片一起批量绘制，避免每个火花走几何管线。
    canvasArt(scene, 'hit_spark', 8, 8, (ctx) => {
      ctx.fillStyle = '#ffd492';
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    super(scene, 0, 0, 'hit_spark');
    this.setDepth(29).setActive(false).setVisible(false);
    scene.add.existing(this);
  }
  activate(x: number, y: number, angle: number): void {
    this.setPosition(x, y);
    this.vx = Math.cos(angle) * 120;
    this.vy = Math.sin(angle) * 120;
    this.lifeMs = config.sparkLifeMs;
    this.setAlpha(1).setActive(true).setVisible(true);
  }
  deactivate(): void {
    this.setActive(false).setVisible(false);
  }
  isActive(): boolean {
    return this.active;
  }
  advance(deltaMs: number): boolean {
    this.lifeMs -= deltaMs;
    this.x += (this.vx * deltaMs) / 1000;
    this.y += (this.vy * deltaMs) / 1000;
    this.setAlpha(Math.max(0, this.lifeMs / config.sparkLifeMs));
    return this.lifeMs <= 0;
  }
}

export class CombatEffects {
  private readonly texts: ObjectPool<DamageText>;
  private readonly sparks: ObjectPool<HitSpark>;
  private readonly budget = new VisualBudget();
  private textCooldownMs = 0;
  private shakeCooldownMs = 0;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly damageNumbers = true,
    private readonly screenShake = true,
  ) {
    this.texts = new ObjectPool(() => new DamageText(scene), this.budget.texts);
    this.sparks = new ObjectPool(() => new HitSpark(scene), this.budget.sparks);
  }
  hit(
    x: number,
    y: number,
    damage: number,
    crit: boolean,
    killed: boolean,
    enhanced = false,
  ): void {
    if (damage <= 0) return;
    if (
      this.damageNumbers &&
      this.textCooldownMs <= 0 &&
      this.texts.activeCount < this.budget.texts
    ) {
      this.texts.acquire().activate(x, y, damage, crit, enhanced);
      this.textCooldownMs = crit || enhanced ? 20 : 40;
    }
    const count = Math.min(
      enhanced ? 8 : crit ? 5 : killed ? 3 : 1,
      this.budget.sparks - this.sparks.activeCount,
    );
    for (let i = 0; i < count; i += 1)
      this.sparks.acquire().activate(x, y, (i * Math.PI * 2) / count);
    if (killed && this.screenShake && this.shakeCooldownMs <= 0) {
      this.shakeCooldownMs = 120;
      this.scene.cameras.main.shake(
        config.shakeDurationMs,
        config.shakeIntensity,
      );
    }
  }
  playerHit(x: number, y: number): void {
    for (
      let i = 0;
      i < 7 && this.sparks.activeCount < this.budget.sparks;
      i += 1
    )
      this.sparks.acquire().activate(x, y, (i * Math.PI * 2) / 7);
  }
  update(deltaMs: number): void {
    this.budget.update(deltaMs);
    this.textCooldownMs = Math.max(0, this.textCooldownMs - deltaMs);
    this.shakeCooldownMs = Math.max(0, this.shakeCooldownMs - deltaMs);
    for (const item of this.texts.activeItems())
      if (item.advance(deltaMs)) this.texts.release(item);
    for (const item of this.sparks.activeItems())
      if (item.advance(deltaMs)) this.sparks.release(item);
  }
  get particleCount(): number {
    return this.sparks.activeCount;
  }
  stressParticles(count: number): void {
    for (
      let i = 0;
      i < count && this.sparks.activeCount < this.budget.sparks;
      i += 1
    )
      this.sparks.acquire().activate(270, 400, (i * Math.PI * 2) / count);
  }
  destroy(): void {
    for (const item of this.texts.allItems()) item.destroy();
    for (const item of this.sparks.allItems()) item.destroy();
  }
}
