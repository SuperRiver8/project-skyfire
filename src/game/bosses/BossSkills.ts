import Phaser from 'phaser';
import type { BossConfig } from '../../config/bosses';
import type { BossPhase } from './BossPhaseController';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import { GAME_WIDTH } from '../viewport';

/** 技能执行上下文：由 BossController 每帧构建，坐标实时跟随机体 */
export interface SkillContext {
  scene: Phaser.Scene;
  player: PlayerAircraft;
  bullets: EnemyBulletPool;
  config: BossConfig;
  phase: BossPhase;
  x: number;
  y: number;
  onLaserHit: (damage: number) => void;
  /** 预警线 + 高速冲锋（红线俯冲 / 引擎冲锋） */
  startDash: (targetX: number, warningMs: number, color?: number) => void;
  /** 开启正面护盾矩阵（减伤） */
  setShield: (durationMs: number) => void;
}

/** 技能产生的持续效果（火焰区、毒云、闪电、领域等） */
export interface BossEffect {
  /** 返回 true 表示效果结束 */
  update(deltaMs: number, ctx: SkillContext): boolean;
  destroy(): void;
}

export interface BossSkill {
  cast(ctx: SkillContext): BossEffect | null;
}

// ---------------------------------------------------------------------------
// 通用弹幕工具
// ---------------------------------------------------------------------------

function fanShot(
  ctx: SkillContext,
  count: number,
  spread: number,
  speed: number,
  damage: number,
  tint: number | undefined,
  originX = ctx.x,
  originY = ctx.y + 50,
): void {
  const base = Math.atan2(ctx.player.y - originY, ctx.player.x - originX);
  for (let i = 0; i < count; i += 1) {
    const angle = base + (i - (count - 1) / 2) * spread;
    ctx.bullets.fire(
      originX,
      originY,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      damage,
      undefined,
      tint,
    );
  }
}

function aimedShot(
  ctx: SkillContext,
  x: number,
  y: number,
  speed: number,
  damage: number,
  tint: number | undefined,
): void {
  const base = Math.atan2(ctx.player.y - y, ctx.player.x - x);
  ctx.bullets.fire(x, y, Math.cos(base) * speed, Math.sin(base) * speed, damage, undefined, tint);
}

function ringShot(
  ctx: SkillContext,
  count: number,
  speed: number,
  damage: number,
  tint: number | undefined,
  offset = 0,
): void {
  for (let i = 0; i < count; i += 1) {
    const angle = (i * Math.PI * 2) / count + offset;
    ctx.bullets.fire(
      ctx.x,
      ctx.y + 30,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      damage,
      undefined,
      tint,
    );
  }
}

// ---------------------------------------------------------------------------
// 通用视觉效果
// ---------------------------------------------------------------------------

/** 预警激光扫射：预警条 → 光束横扫（翼刃激光 / 帝焰审判共用） */
class LaserSweepEffect implements BossEffect {
  private readonly warning: Phaser.GameObjects.Rectangle;
  private readonly beam: Phaser.GameObjects.Rectangle;
  private elapsed = 0;
  private readonly laserX: number;
  private readonly warnMs: number;
  private readonly activeMs: number;
  private readonly width: number;
  private readonly damage: number;

  constructor(
    ctx: SkillContext,
    params: {
      warnMs: number;
      activeMs: number;
      width: number;
      color: number;
      damage: number;
    },
  ) {
    this.warnMs = params.warnMs;
    this.activeMs = params.activeMs;
    this.width = params.width;
    this.damage = params.damage;
    this.laserX = ctx.player.x;
    this.warning = ctx.scene.add
      .rectangle(this.laserX, 480, this.width, 960, 0xff4444, 0.25)
      .setDepth(3);
    this.beam = ctx.scene.add
      .rectangle(this.laserX, 480, this.width, 960, params.color, 0.75)
      .setVisible(false)
      .setDepth(4);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    if (this.elapsed < this.warnMs) {
      this.warning.setAlpha(Math.floor(this.elapsed / 90) % 2 === 0 ? 0.3 : 0.12);
      return false;
    }
    if (!this.beam.visible) {
      this.warning.setVisible(false);
      this.beam.setPosition(this.laserX - 70, 480).setVisible(true);
    }
    const sweep = Math.min(1, (this.elapsed - this.warnMs) / this.activeMs);
    this.beam.x = this.laserX - 70 + sweep * 140;
    this.beam.setAlpha(0.55 + Math.sin(this.elapsed / 40) * 0.15);
    if (Math.abs(ctx.player.x - this.beam.x) < this.width / 2 + 10)
      ctx.onLaserHit(this.damage);
    return this.elapsed >= this.warnMs + this.activeMs;
  }

  destroy(): void {
    this.warning.destroy();
    this.beam.destroy();
  }
}

/** 龙炎吐息：持续向玩家喷吐火焰弹 + 火柱视觉 */
class FlameBreathEffect implements BossEffect {
  private readonly flames: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private emitMs = 0;

  constructor(ctx: SkillContext) {
    this.flames = ctx.scene.add.graphics().setDepth(8);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    this.emitMs += deltaMs;
    const originX = ctx.x;
    const originY = ctx.y + 42;
    const base = Math.atan2(ctx.player.y - originY, ctx.player.x - originX);
    this.flames.clear();
    // 三层锥形火柱（外焰 → 内焰 → 焰心）
    for (const [len, width, color, alpha] of [
      [250, 64, 0xff5a2c, 0.18],
      [185, 38, 0xff8c3f, 0.3],
      [125, 18, 0xffd08a, 0.55],
    ] as const) {
      const tipX = originX + Math.cos(base) * len;
      const tipY = originY + Math.sin(base) * len;
      const perpX = -Math.sin(base) * width;
      const perpY = Math.cos(base) * width;
      this.flames.fillStyle(color, alpha);
      this.flames.fillTriangle(
        originX,
        originY,
        originX + perpX,
        originY + perpY,
        tipX,
        tipY,
      );
      this.flames.fillTriangle(
        originX,
        originY,
        originX - perpX,
        originY - perpY,
        tipX,
        tipY,
      );
    }
    if (this.emitMs >= 110) {
      this.emitMs = 0;
      for (let i = -1; i <= 1; i += 1) {
        const angle = base + i * 0.13;
        ctx.bullets.fire(
          originX,
          originY,
          Math.cos(angle) * 195,
          Math.sin(angle) * 195,
          11,
          undefined,
          0xff8c3f,
        );
      }
    }
    return this.elapsed >= 2100;
  }

  destroy(): void {
    this.flames.destroy();
  }
}

/** 熔核火雨：玩家上空随机落下陨火 */
class FireRainEffect implements BossEffect {
  private elapsed = 0;
  private emitMs = 0;
  private serial = 1;

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    this.emitMs += deltaMs;
    if (this.emitMs >= 170) {
      this.emitMs = 0;
      this.serial = -this.serial;
      const x = Phaser.Math.Clamp(
        ctx.player.x + this.serial * (70 + Math.random() * 130),
        30,
        GAME_WIDTH - 30,
      );
      ctx.bullets.fire(x, -18, 0, 215, 13, undefined, 0xff704f);
    }
    return this.elapsed >= 1700;
  }

  destroy(): void {}
}

/** 烈焰龙翼斩：两侧弧形火刃推进 */
class SlashWaveEffect implements BossEffect {
  private readonly waves: Phaser.GameObjects.Graphics;
  private elapsed = 0;

  constructor(ctx: SkillContext) {
    this.waves = ctx.scene.add.graphics().setDepth(8);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    const progress = Math.min(1, this.elapsed / 700);
    this.waves.clear();
    for (const side of [1, -1]) {
      const sweepX = ctx.x + side * (40 + progress * 150);
      const radius = 30 + progress * 70;
      this.waves.lineStyle(6, 0xff5a2c, 0.55 * (1 - progress));
      this.waves.beginPath();
      this.waves.arc(sweepX, ctx.y + 40 + progress * 90, radius, 0, Math.PI * 2);
      this.waves.strokePath();
      this.waves.lineStyle(2, 0xffd08a, 0.7 * (1 - progress));
      this.waves.beginPath();
      this.waves.arc(sweepX, ctx.y + 40 + progress * 90, radius * 0.7, 0, Math.PI * 2);
      this.waves.strokePath();
    }
    return this.elapsed >= 700;
  }

  destroy(): void {
    this.waves.destroy();
  }
}

/** 钢尾横扫：从左向右扫过的弹幕列 + 尾焰 */
class TailSweepEffect implements BossEffect {
  private readonly tail: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private emitMs = 0;

  constructor(ctx: SkillContext) {
    this.tail = ctx.scene.add.graphics().setDepth(8);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    this.emitMs += deltaMs;
    const progress = Math.min(1, this.elapsed / 1300);
    const x = 20 + progress * (GAME_WIDTH - 40);
    this.tail.clear();
    this.tail.lineStyle(10, 0xff7d3e, 0.35);
    this.tail.lineBetween(ctx.x, ctx.y + 60, x, ctx.y + 90);
    this.tail.lineStyle(3, 0xffd08a, 0.6);
    this.tail.lineBetween(ctx.x, ctx.y + 60, x, ctx.y + 90);
    if (this.emitMs >= 130) {
      this.emitMs = 0;
      ctx.bullets.fire(x, ctx.y + 90, 0, 230, 12, undefined, 0xff7d3e);
      ctx.bullets.fire(x, ctx.y + 110, 0, 200, 12, undefined, 0xff7d3e);
    }
    return this.elapsed >= 1300;
  }

  destroy(): void {
    this.tail.destroy();
  }
}

/** 毒雾残留：左头下方漂移的毒雾团 + 慢速毒球 */
class PoisonCloudEffect implements BossEffect {
  private readonly clouds: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private emitMs = 0;

  constructor(ctx: SkillContext) {
    this.clouds = ctx.scene.add.graphics().setDepth(8);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    this.emitMs += deltaMs;
    this.clouds.clear();
    for (let i = 0; i < 2; i += 1) {
      const cx = ctx.x - 34 + Math.sin(this.elapsed / 300 + i * 2) * 30;
      const cy = ctx.y + 30 + this.elapsed * 0.03 + i * 26;
      this.clouds.fillStyle(0x3fd08a, 0.12);
      this.clouds.fillCircle(cx, cy, 26);
      this.clouds.fillStyle(0x3fd08a, 0.2);
      this.clouds.fillCircle(cx + 6, cy + 4, 14);
    }
    if (this.emitMs >= 480) {
      this.emitMs = 0;
      const cx = ctx.x - 34;
      ctx.bullets.fire(cx, ctx.y + 40, (Math.random() - 0.5) * 80, 72, 13, undefined, 0x3fd08a);
    }
    return this.elapsed >= 2000;
  }

  destroy(): void {
    this.clouds.destroy();
  }
}

/** 雷首锁链：折线闪电链 + 分段伤害判定 */
class LightningChainEffect implements BossEffect {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly points: { x: number; y: number }[];
  private readonly hitSegments = new Set<number>();
  private elapsed = 0;

  constructor(ctx: SkillContext) {
    this.graphics = ctx.scene.add.graphics().setDepth(9);
    const startX = ctx.x + 34;
    const startY = ctx.y + 12;
    this.points = [
      { x: startX, y: startY },
      { x: Phaser.Math.Clamp(startX + (Math.random() - 0.5) * 320, 40, 500), y: startY + 180 },
      { x: Phaser.Math.Clamp(startX + (Math.random() - 0.5) * 320, 40, 500), y: startY + 380 },
      { x: ctx.player.x, y: ctx.player.y },
    ];
    this.checkHit(ctx);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    this.graphics.clear();
    for (let layer = 0; layer < 2; layer += 1) {
      this.graphics.lineStyle(
        layer === 0 ? 7 : 2,
        layer === 0 ? 0xb060e8 : 0xffffff,
        layer === 0 ? 0.28 : 0.85,
      );
      this.graphics.beginPath();
      for (const [index, point] of this.points.entries()) {
        const jitter = layer === 0 ? 9 : 3;
        const x = point.x + (Math.random() - 0.5) * jitter;
        const y = point.y + (Math.random() - 0.5) * jitter;
        if (index === 0) this.graphics.moveTo(x, y);
        else this.graphics.lineTo(x, y);
      }
      this.graphics.strokePath();
    }
    this.checkHit(ctx);
    return this.elapsed >= 420;
  }

  private checkHit(ctx: SkillContext): void {
    for (let index = 0; index < this.points.length - 1; index += 1) {
      if (this.hitSegments.has(index)) continue;
      const a = this.points[index];
      const b = this.points[index + 1];
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      if (Math.hypot(ctx.player.x - midX, ctx.player.y - midY) < 44) {
        this.hitSegments.add(index);
        ctx.onLaserHit(12);
      }
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

/** 灾厄共鸣：双色扩散冲击环 */
class ResonanceWaveEffect implements BossEffect {
  private readonly rings: Phaser.GameObjects.Arc[];
  private elapsed = 0;

  constructor(ctx: SkillContext) {
    this.rings = [
      ctx.scene.add.circle(ctx.x, ctx.y + 30, 20, 0x3fd08a, 0).setStrokeStyle(6, 0x3fd08a, 0.85).setDepth(7),
      ctx.scene.add.circle(ctx.x, ctx.y + 30, 20, 0xb060e8, 0).setStrokeStyle(3, 0xb060e8, 0.9).setDepth(7),
    ];
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    const progress = Math.min(1, this.elapsed / 900);
    for (const [index, ring] of this.rings.entries()) {
      ring
        .setPosition(ctx.x, ctx.y + 30)
        .setScale(0.4 + progress * (index === 0 ? 4.2 : 3.2))
        .setAlpha(Math.max(0, 1 - progress * 1.15));
    }
    return this.elapsed >= 900;
  }

  destroy(): void {
    for (const ring of this.rings) ring.destroy();
  }
}

/** 重炮齐射的炮口闪光 */
class MuzzleFlashEffect implements BossEffect {
  private readonly flashes: Phaser.GameObjects.Arc[];
  private elapsed = 0;

  constructor(ctx: SkillContext) {
    this.flashes = ctx.config.visual.turretOffsets.map((x) =>
      ctx.scene.add.circle(x, ctx.config.visual.turretY, 12, 0xfff0b0, 0.9).setDepth(7),
    );
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    for (const [index, flash] of this.flashes.entries()) {
      const ox = ctx.config.visual.turretOffsets[index];
      flash
        .setPosition(ox, ctx.config.visual.turretY + 10)
        .setScale(1 + this.elapsed / 160)
        .setAlpha(Math.max(0, 0.9 - this.elapsed / 300));
    }
    return this.elapsed >= 320;
  }

  destroy(): void {
    for (const flash of this.flashes) flash.destroy();
  }
}

/** 圣羽风暴的金色扩散羽环 */
class FeatherWaveEffect implements BossEffect {
  private readonly feathers: Phaser.GameObjects.Graphics;
  private elapsed = 0;

  constructor(ctx: SkillContext) {
    this.feathers = ctx.scene.add.graphics().setDepth(7);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    const progress = Math.min(1, this.elapsed / 750);
    this.feathers.clear();
    const count = 16;
    for (let i = 0; i < count; i += 1) {
      const angle = (i * Math.PI * 2) / count;
      const radius = 20 + progress * 150;
      const x = ctx.x + Math.cos(angle) * radius;
      const y = ctx.y + 30 + Math.sin(angle) * radius;
      this.feathers.fillStyle(0xffe898, 0.55 * (1 - progress));
      this.feathers.fillTriangle(
        x,
        y - 7,
        x - 4,
        y + 5,
        x + 4,
        y + 5,
      );
    }
    return this.elapsed >= 750;
  }

  destroy(): void {
    this.feathers.destroy();
  }
}

/** 凤凰再临：能量羽翼残影辅助攻击 */
class PhoenixShadesEffect implements BossEffect {
  private readonly shades: Phaser.GameObjects.Image[];
  private elapsed = 0;
  private fireMs = 0;

  constructor(ctx: SkillContext) {
    this.shades = [-92, 92].map((ox) =>
      ctx.scene.add
        .image(ctx.x + ox, ctx.y + 12, `boss_${ctx.config.id}`)
        .setFlipY(true)
        .setAlpha(0.45)
        .setScale(0.55)
        .setDepth(5),
    );
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    this.fireMs += deltaMs;
    for (const [index, shade] of this.shades.entries()) {
      const ox = (index === 0 ? -92 : 92) + Math.sin(this.elapsed / 300 + index * 2) * 26;
      shade
        .setPosition(ctx.x + ox, ctx.y + 12 + Math.sin(this.elapsed / 260 + index) * 10)
        .setAlpha(0.32 + (Math.sin(this.elapsed / 140 + index) + 1) * 0.16);
    }
    if (this.fireMs >= 700) {
      this.fireMs = 0;
      for (const shade of this.shades)
        aimedShot(ctx, shade.x, shade.y, 235, 12, 0xfff0b8);
    }
    return this.elapsed >= 3200;
  }

  destroy(): void {
    for (const shade of this.shades) shade.destroy();
  }
}

/** 皇权领域：收缩的环形压制区域 */
class RoyalDomainEffect implements BossEffect {
  private readonly ring: Phaser.GameObjects.Arc;
  private elapsed = 0;
  private emitMs = 0;

  constructor(ctx: SkillContext) {
    this.ring = ctx.scene.add
      .circle(ctx.x, ctx.y + 40, 480, 0xffe898, 0)
      .setStrokeStyle(6, 0xffe898, 0.85)
      .setDepth(4);
  }

  update(deltaMs: number, ctx: SkillContext): boolean {
    this.elapsed += deltaMs;
    this.emitMs += deltaMs;
    const progress = Math.min(1, this.elapsed / 2300);
    const radius = Phaser.Math.Linear(480, 170, progress);
    this.ring
      .setRadius(radius)
      .setPosition(ctx.x, ctx.y + 40)
      .setAlpha(0.5 + Math.sin(this.elapsed / 80) * 0.2);
    if (this.emitMs >= 140) {
      this.emitMs = 0;
      const count = 10;
      for (let i = 0; i < count; i += 1) {
        const angle = (i * Math.PI * 2) / count + this.elapsed / 950;
        ctx.bullets.fire(
          ctx.x + Math.cos(angle) * radius,
          ctx.y + 40 + Math.sin(angle) * radius,
          -Math.cos(angle) * 135,
          -Math.sin(angle) * 135 + 45,
          14,
          undefined,
          0xffe898,
        );
      }
    }
    return this.elapsed >= 2400;
  }

  destroy(): void {
    this.ring.destroy();
  }
}

// ---------------------------------------------------------------------------
// 技能实现
// ---------------------------------------------------------------------------

/** 猎鹰扇射（机械雄鹰） */
const fan: BossSkill = {
  cast(ctx) {
    const count = 5 + ctx.phase * 2;
    const speed = 220 + ctx.phase * 25;
    fanShot(ctx, count, 0.15, speed, 12, undefined);
    return null;
  },
};

/** 双翼追踪导弹（机械雄鹰） */
const missiles: BossSkill = {
  cast(ctx) {
    const speed = ctx.phase === 3 ? 230 : 185;
    ctx.bullets.fire(ctx.x - 60, ctx.y + 35, -speed * 0.4, speed, 14, ctx.player);
    ctx.bullets.fire(ctx.x + 60, ctx.y + 35, speed * 0.4, speed, 14, ctx.player);
    return null;
  },
};

/** 翼刃激光扫射（机械雄鹰） */
const laser_sweep: BossSkill = {
  cast(ctx) {
    return new LaserSweepEffect(ctx, {
      warnMs: 800,
      activeMs: 900,
      width: 55,
      color: 0xff6161,
      damage: 15,
    });
  },
};

/** 红线俯冲（机械雄鹰） */
const dash: BossSkill = {
  cast(ctx) {
    ctx.startDash(ctx.player.x, 750, 0xff3a3a);
    return null;
  },
};

/** 龙炎吐息（钢铁飞龙） */
const flame_breath: BossSkill = {
  cast(ctx) {
    return new FlameBreathEffect(ctx);
  },
};

/** 熔核火雨（钢铁飞龙） */
const fire_rain: BossSkill = {
  cast() {
    return new FireRainEffect();
  },
};

/** 烈焰龙翼斩（钢铁飞龙） */
const wing_slash: BossSkill = {
  cast(ctx) {
    for (const side of [1, -1]) {
      for (let k = 0; k < 3; k += 1) {
        ctx.bullets.fire(
          ctx.x + side * (46 + k * 24),
          ctx.y + 30,
          side * 95,
          150 + k * 48,
          15,
          undefined,
          0xff5a2c,
        );
      }
    }
    return new SlashWaveEffect(ctx);
  },
};

/** 钢尾横扫（钢铁飞龙） */
const tail_sweep: BossSkill = {
  cast(ctx) {
    return new TailSweepEffect(ctx);
  },
};

/** 毒首扩散（双生蛇） */
const poison_spray: BossSkill = {
  cast(ctx) {
    const ox = ctx.x - 34;
    const oy = ctx.y + 16;
    const base = Math.atan2(ctx.player.y - oy, ctx.player.x - ox);
    for (let i = 0; i < 5; i += 1) {
      const angle = base + (i - 2) * 0.16;
      ctx.bullets.fire(
        ox,
        oy,
        Math.cos(angle) * 150,
        Math.sin(angle) * 150,
        10,
        undefined,
        0x3fd08a,
      );
    }
    ctx.bullets.fire(ox, oy, -45, 80, 14, undefined, 0x3fd08a);
    ctx.bullets.fire(ox, oy, 45, 80, 14, undefined, 0x3fd08a);
    return new PoisonCloudEffect(ctx);
  },
};

/** 雷首锁链（双生蛇） */
const lightning_chain: BossSkill = {
  cast(ctx) {
    return new LightningChainEffect(ctx);
  },
};

/** 双首夹击（双生蛇） */
const pincer: BossSkill = {
  cast(ctx) {
    for (let i = 0; i < 5; i += 1) {
      const y = ctx.y + 24 + i * 42;
      ctx.bullets.fire(16, y, 155, 50, 10, undefined, 0x3fd08a);
      ctx.bullets.fire(GAME_WIDTH - 16, y, -155, 50, 10, undefined, 0xb060e8);
    }
    return null;
  },
};

/** 灾厄共鸣（双生蛇） */
const resonance: BossSkill = {
  cast(ctx) {
    const count = 14;
    for (let i = 0; i < count; i += 1) {
      const angle = (i * Math.PI * 2) / count;
      ctx.bullets.fire(
        ctx.x,
        ctx.y + 40,
        Math.cos(angle) * 195,
        Math.sin(angle) * 195,
        13,
        undefined,
        i % 2 === 0 ? 0x3fd08a : 0xb060e8,
      );
    }
    return new ResonanceWaveEffect(ctx);
  },
};

/** 重炮齐射（铁壁堡垒） */
const cannon_volley: BossSkill = {
  cast(ctx) {
    const count = 2 + ctx.phase;
    for (let i = 0; i < count; i += 1) {
      const tx = ctx.player.x + (Math.random() - 0.5) * 260;
      const ty = ctx.player.y + (Math.random() - 0.5) * 80;
      const base = Math.atan2(ty - (ctx.y + 30), tx - ctx.x);
      ctx.bullets.fire(
        ctx.x,
        ctx.y + 30,
        Math.cos(base) * 275,
        Math.sin(base) * 275,
        20,
        undefined,
        0xffc460,
      );
    }
    return new MuzzleFlashEffect(ctx);
  },
};

/** 导弹仓弹幕（铁壁堡垒） */
const missile_barrage: BossSkill = {
  cast(ctx) {
    for (let i = 0; i < 6; i += 1) {
      const x = ctx.x - 100 + i * 40;
      ctx.bullets.fire(
        x,
        ctx.y + 16,
        (i - 2.5) * 14,
        180,
        12,
        i % 2 === 0 ? ctx.player : undefined,
        0xffa24e,
      );
    }
    return null;
  },
};

/** 护盾矩阵（铁壁堡垒） */
const shield_matrix: BossSkill = {
  cast(ctx) {
    ctx.setShield(2300);
    return null;
  },
};

/** 三引擎冲锋压制（铁壁堡垒） */
const engine_charge: BossSkill = {
  cast(ctx) {
    ctx.startDash(ctx.player.x, 800, 0xffc460);
    return null;
  },
};

/** 圣羽风暴（天空帝皇） */
const feather_storm: BossSkill = {
  cast(ctx) {
    const count = 14;
    const offset = Math.random() * Math.PI;
    for (let i = 0; i < count; i += 1) {
      const angle = (i * Math.PI * 2) / count + offset;
      ctx.bullets.fire(
        ctx.x,
        ctx.y + 30,
        Math.cos(angle) * 240,
        Math.sin(angle) * 240,
        12,
        undefined,
        0xffe898,
      );
    }
    return new FeatherWaveEffect(ctx);
  },
};

/** 帝焰审判（天空帝皇贯穿光束） */
const holy_beam: BossSkill = {
  cast(ctx) {
    return new LaserSweepEffect(ctx, {
      warnMs: 900,
      activeMs: 1400,
      width: 90,
      color: 0xffe898,
      damage: 22,
    });
  },
};

/** 凤凰再临（天空帝皇） */
const phoenix_reborn: BossSkill = {
  cast(ctx) {
    return new PhoenixShadesEffect(ctx);
  },
};

/** 皇权领域（天空帝皇） */
const royal_domain: BossSkill = {
  cast(ctx) {
    return new RoyalDomainEffect(ctx);
  },
};

/** 技能注册表 */
export const bossSkills: Record<string, BossSkill> = {
  fan,
  missiles,
  laser_sweep,
  dash,
  flame_breath,
  fire_rain,
  wing_slash,
  tail_sweep,
  poison_spray,
  lightning_chain,
  pincer,
  resonance,
  cannon_volley,
  missile_barrage,
  shield_matrix,
  engine_charge,
  feather_storm,
  holy_beam,
  phoenix_reborn,
  royal_domain,
};

/** 快速弹幕辅助（供 BossController 与其他系统复用） */
export const skillHelpers = { fanShot, aimedShot, ringShot };
