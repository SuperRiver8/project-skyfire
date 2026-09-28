import Phaser from 'phaser';
import type { BossController } from '../bosses/BossController';
import type { Enemy } from '../enemies/Enemy';
import type { EnemyController } from '../enemies/EnemyController';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import type { PlayerStats } from '../player/PlayerStats';
import { ObjectPool } from '../utils/ObjectPool';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';
import { chooseMissileTarget, type MissileCandidate } from './HomingTargeting';
import { canvasArt, fillLinear, fillPoly, strokeLine } from '../visuals/pseudo3d';

type Target = Enemy | BossController;
const BASE_DAMAGE = 24;
const BASE_SPEED = 455;
const TURN_SPEED = 3.5;
const BASE_RADIUS = 48;
const MAX_ACTIVE = 40;
const MISSILE_KEY = 'homing_missile';

function ensureMissileArt(scene: Phaser.Scene): void {
  canvasArt(scene, MISSILE_KEY, 12, 26, (ctx) => {
    // 尾焰
    fillLinear(
      ctx,
      [
        [3, 14],
        [3, 26],
        [9, 26],
        [9, 14],
      ],
      [
        [0, 0xffd68a, 0.9],
        [1, 0xff8c4a, 0],
      ],
      6,
      14,
      6,
      26,
    );
    // 金属弹体
    fillLinear(
      ctx,
      [
        [3, 2],
        [3, 16],
        [9, 16],
        [9, 2],
      ],
      [
        [0, 0xfff0d0],
        [0.5, 0xffb870],
        [1, 0xd2602e],
      ],
      6,
      2,
      6,
      16,
    );
    // 弹头
    fillPoly(ctx, [[6, 0], [3, 5], [9, 5]], 0xff3b30, 1);
    // 高光
    strokeLine(ctx, 6, 3, 6, 14, 0xffffff, 1.2, 0.8);
  });
}

class HomingMissile extends Phaser.GameObjects.Image {
  target: Target | undefined;
  targetToken = 0;
  ageMs = 0;
  angle = -Math.PI / 2;
  private readonly trailX = [0, 0, 0, 0, 0, 0];
  private readonly trailY = [0, 0, 0, 0, 0, 0];

  constructor(scene: Phaser.Scene) {
    ensureMissileArt(scene);
    super(scene, 0, 0, MISSILE_KEY);
    this.setOrigin(0.5)
      .setDepth(18)
      .setScale(0.75)
      .setActive(false)
      .setVisible(false);
    scene.add.existing(this);
  }

  activate(x: number, y: number, target: Target | undefined): void {
    this.setPosition(x, y).setRotation(0).setActive(true).setVisible(true);
    this.angle = -Math.PI / 2;
    this.ageMs = 0;
    this.assign(target);
    this.trailX.fill(x);
    this.trailY.fill(y);
  }

  assign(target: Target | undefined): void {
    this.target = target;
    this.targetToken = target && 'spawnToken' in target ? target.spawnToken : 0;
  }

  remembers(target: Target): boolean {
    return (
      this.target === target &&
      (!('spawnToken' in target) || this.targetToken === target.spawnToken)
    );
  }

  advance(deltaMs: number, speed: number, turnSpeed: number): void {
    this.ageMs += deltaMs;
    // 先从挂架向前跃出，之后以受限角速度转弯，形成可辨认的弧线。
    if (this.ageMs > 170 && this.target) {
      const desired = Math.atan2(
        this.target.y - this.y,
        this.target.x - this.x,
      );
      const difference = Phaser.Math.Angle.Wrap(desired - this.angle);
      this.angle += Phaser.Math.Clamp(
        difference,
        (-turnSpeed * deltaMs) / 1000,
        (turnSpeed * deltaMs) / 1000,
      );
    }
    this.x += (Math.cos(this.angle) * speed * deltaMs) / 1000;
    this.y += (Math.sin(this.angle) * speed * deltaMs) / 1000;
    this.setRotation(this.angle + Math.PI / 2);
    for (let i = this.trailX.length - 1; i > 0; i -= 1) {
      this.trailX[i] = this.trailX[i - 1];
      this.trailY[i] = this.trailY[i - 1];
    }
    this.trailX[0] = this.x;
    this.trailY[0] = this.y;
  }

  drawTrail(graphics: Phaser.GameObjects.Graphics, level: number): void {
    const length = level >= 4 ? 5 : level >= 2 ? 3 : 2;
    for (let i = length; i > 0; i -= 1) {
      graphics.lineStyle(
        level >= 2 ? 3 : 2,
        level >= 5 ? 0xffe19a : 0xff9b54,
        0.65 * (1 - i / (length + 1)),
      );
      graphics.lineBetween(
        this.trailX[i],
        this.trailY[i],
        this.trailX[i - 1],
        this.trailY[i - 1],
      );
    }
  }

  isOutOfBounds(): boolean {
    return (
      this.ageMs > 70 &&
      (this.x < -45 ||
        this.x > GAME_WIDTH + 45 ||
        this.y < -60 ||
        this.y > GAME_HEIGHT + 45)
    );
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.target = undefined;
  }

  isActive(): boolean {
    return this.active;
  }
}

export class HomingMissileSystem {
  private readonly pool: ObjectPool<HomingMissile>;
  private readonly trails: Phaser.GameObjects.Graphics;
  private fireMs = 0;
  private launchSerial = 0;
  level = 0;
  overdrive = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly aircraft: PlayerAircraft,
    private readonly stats: PlayerStats,
    private readonly enemies: EnemyController,
    private readonly onLaunch: (upgraded: boolean) => void,
  ) {
    this.pool = new ObjectPool(() => new HomingMissile(scene), 32);
    this.trails = scene.add.graphics().setDepth(17);
  }

  addStack(): void {
    if (this.level < 5) this.level += 1;
    else this.overdrive = Math.min(3, this.overdrive + 1);
    this.aircraft.setMissileLevel(this.level);
  }

  restore(level: number, overdrive: number): void {
    this.level = Math.max(0, Math.min(5, level));
    this.overdrive = Math.max(0, Math.min(3, overdrive));
    this.aircraft.setMissileLevel(this.level);
  }

  update(deltaMs: number): void {
    this.trails.clear();
    if (this.level === 0) return;
    const interval = 1000 / (this.level * 2);
    this.fireMs = Math.min(this.fireMs + deltaMs, interval * 2);
    while (this.fireMs >= interval) {
      this.fireMs -= interval;
      if (this.pool.activeCount < MAX_ACTIVE) this.launch();
    }
    const speed = BASE_SPEED * this.stats.missileFlightMultiplier;
    const turn = TURN_SPEED * this.stats.missileFlightMultiplier;
    for (const missile of this.pool.activeItems()) {
      if (missile.target && !this.targetActive(missile))
        missile.assign(this.chooseTarget(missile.x, missile.y, missile));
      if (!missile.target && missile.ageMs >= 170)
        missile.assign(this.chooseTarget(missile.x, missile.y, missile));
      missile.advance(deltaMs, speed, turn);
      missile.drawTrail(this.trails, this.level);
      if (
        missile.target &&
        missile.ageMs > 170 &&
        Math.hypot(missile.x - missile.target.x, missile.y - missile.target.y) <
          19
      ) {
        this.hit(missile);
        this.pool.release(missile);
      } else if (missile.isOutOfBounds()) this.pool.release(missile);
    }
  }

  private launch(): void {
    const side = this.launchSerial++ % 2 === 0 ? -1 : 1;
    const x = this.aircraft.x + side * (this.level >= 5 ? 34 : 26);
    const y = this.aircraft.y - 11;
    this.pool.acquire().activate(x, y, this.chooseTarget(x, y));
    this.onLaunch(this.level >= 4);
  }

  private targetActive(missile: HomingMissile): boolean {
    const target = missile.target;
    return (
      !!target &&
      target.isActive() &&
      missile.remembers(target) &&
      (!('currentHp' in target) || target.currentHp > 0)
    );
  }

  private chooseTarget(
    x: number,
    y: number,
    exclude?: HomingMissile,
  ): Target | undefined {
    const candidates: MissileCandidate<Target>[] = [];
    const add = (target: Target, priority: number, hp: number) => {
      let assigned = 0;
      for (const missile of this.pool.activeItems())
        if (missile !== exclude && missile.remembers(target)) assigned += 1;
      candidates.push({
        target,
        priority,
        hp,
        assigned,
        distance: Math.hypot(target.x - x, target.y - y),
      });
    };
    if (this.enemies.boss?.isDamageable())
      add(this.enemies.boss, 0, this.enemies.boss.hp);
    for (const enemy of this.enemies.enemies.activeEnemies())
      if (enemy.currentHp > 0)
        add(enemy, enemy.isElite ? 1 : 2, enemy.currentHp);
    return chooseMissileTarget(candidates, this.baseDamage());
  }

  private baseDamage(): number {
    return (
      BASE_DAMAGE *
      this.stats.missileDamageMultiplier *
      (1 + this.overdrive * 0.1)
    );
  }

  private hit(missile: HomingMissile): void {
    const target = missile.target;
    if (!target) return;
    const x = target.x,
      y = target.y;
    const damage = this.baseDamage();
    const crit =
      'spawnToken' in target
        ? this.enemies.damageEnemyDetailed(target, damage).crit
        : this.enemies.damageBossDetailed(damage).crit;
    const radius =
      BASE_RADIUS * (this.level >= 5 ? 1.2 : 1) * (crit ? 1.15 : 1);
    this.enemies.spawnExplosion(x, y, (radius / BASE_RADIUS) * 0.8, crit);
    const splash = damage * (this.stats.attackCores >= 5 ? 1.15 : 1);
    for (const enemy of this.enemies.enemies.activeEnemies()) {
      if (enemy === target) continue;
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      if (distance < radius)
        this.enemies.damageEnemy(
          enemy,
          splash * Math.max(0.3, 1 - (0.7 * distance) / radius),
          false,
        );
    }
    const boss = this.enemies.boss;
    if (boss?.isDamageable() && boss !== target) {
      const distance = Math.hypot(boss.x - x, boss.y - y);
      if (distance < radius)
        this.enemies.damageBoss(
          splash * Math.max(0.3, 1 - (0.7 * distance) / radius),
          false,
        );
    }
  }

  destroy(): void {
    this.trails.destroy();
    for (const missile of this.pool.allItems()) missile.destroy();
  }
}
