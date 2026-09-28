import Phaser from 'phaser';
import { feedbackConfig as config } from '../../config/effects/feedback';
import { ObjectPool } from '../utils/ObjectPool';

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
      .setText(`${Math.round(damage)}`)
      .setColor(enhanced ? '#ff875b' : crit ? '#ffe56a' : '#ffffff')
      .setFontSize(enhanced ? 34 : crit ? 29 : 20)
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

class HitSpark extends Phaser.GameObjects.Arc {
  lifeMs = 0;
  vx = 0;
  vy = 0;
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 3, 0xffd492, 1);
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
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly damageNumbers = true,
    private readonly screenShake = true,
  ) {
    this.texts = new ObjectPool(
      () => new DamageText(scene),
      config.damageTextPool,
    );
    this.sparks = new ObjectPool(() => new HitSpark(scene), config.sparkPool);
  }
  hit(
    x: number,
    y: number,
    damage: number,
    crit: boolean,
    killed: boolean,
    enhanced = false,
  ): void {
    if (this.damageNumbers)
      this.texts.acquire().activate(x, y, damage, crit, enhanced);
    const count = enhanced ? 12 : crit ? 8 : killed ? 5 : 2;
    for (let i = 0; i < count; i += 1)
      this.sparks.acquire().activate(x, y, (i * Math.PI * 2) / count);
    if (killed && this.screenShake)
      this.scene.cameras.main.shake(
        config.shakeDurationMs,
        config.shakeIntensity,
      );
  }
  playerHit(x: number, y: number): void {
    for (let i = 0; i < 7; i += 1)
      this.sparks.acquire().activate(x, y, (i * Math.PI * 2) / 7);
  }
  update(deltaMs: number): void {
    for (const item of this.texts.activeItems())
      if (item.advance(deltaMs)) this.texts.release(item);
    for (const item of this.sparks.activeItems())
      if (item.advance(deltaMs)) this.sparks.release(item);
  }
  get particleCount(): number {
    return this.sparks.activeCount;
  }
  stressParticles(count: number): void {
    for (let i = 0; i < count; i += 1)
      this.sparks.acquire().activate(270, 400, (i * Math.PI * 2) / count);
  }
  destroy(): void {
    for (const item of this.texts.allItems()) item.destroy();
    for (const item of this.sparks.allItems()) item.destroy();
  }
}
