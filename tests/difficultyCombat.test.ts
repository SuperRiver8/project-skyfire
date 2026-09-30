import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLevelDifficulty } from '../src/config/balance/levelDifficulty';
import { EnemyPool } from '../src/game/enemies/EnemyPool';
import { EnemyBulletPool } from '../src/game/bullets/EnemyBulletPool';
import { BossController } from '../src/game/bosses/BossController';
import { bossSkills } from '../src/game/bosses/BossSkills';
import type { PlayerAircraft } from '../src/game/player/PlayerAircraft';

// 只替代绘图对象，保留实际的敌机移动、对象池、弹幕和 Boss 调度逻辑。
const { Display } = vi.hoisted(() => {
  class Display {
    x = 0;
    y = 0;
    width = 80;
    height = 80;
    active = false;
    visible = false;
    alpha = 1;
    rotation = 0;
    scaleX = 1;
    scaleY = 1;
    texture = { key: '' };
    constructor(_scene: unknown, x: number, y: number, key: string) {
      this.x = x;
      this.y = y;
      this.texture.key = key;
    }
    get displayWidth() {
      return this.width * this.scaleX;
    }
    get displayHeight() {
      return this.height * this.scaleY;
    }
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
    setX(x: number) {
      this.x = x;
      return this;
    }
    setActive(value: boolean) {
      this.active = value;
      return this;
    }
    setVisible(value: boolean) {
      this.visible = value;
      return this;
    }
    setTexture(key: string) {
      this.texture.key = key;
      return this;
    }
    setRotation(value: number) {
      this.rotation = value;
      return this;
    }
    setScale(x: number, y = x) {
      this.scaleX = x;
      this.scaleY = y;
      return this;
    }
    setAlpha(value: number) {
      this.alpha = value;
      return this;
    }
    setDepth() {
      return this;
    }
    setFlipY() {
      return this;
    }
    setTint() {
      return this;
    }
    clearTint() {
      return this;
    }
    setTintMode() {
      return this;
    }
    setOrigin() {
      return this;
    }
    setStrokeStyle() {
      return this;
    }
    setFillStyle() {
      return this;
    }
    setText() {
      return this;
    }
    add() {
      return this;
    }
    destroy() {}
  }
  return { Display };
});

vi.mock('phaser', () => ({
  default: {
    GameObjects: { Image: Display },
    TintModes: { FILL: 1 },
    Math: {
      Clamp: (v: number, min: number, max: number) =>
        Math.min(max, Math.max(min, v)),
    },
  },
}));

function combatScene() {
  const rectangles: InstanceType<typeof Display>[] = [];
  const shape = (x = 0, y = 0, key = '') => new Display(null, x, y, key);
  const scene = {
    textures: { exists: () => true },
    add: {
      existing: () => {},
      image: shape,
      ellipse: shape,
      triangle: shape,
      circle: shape,
      text: shape,
      container: shape,
      rectangle: (x: number, y: number, width: number) => {
        const rectangle = shape(x, y);
        rectangle.width = width;
        rectangles.push(rectangle);
        return rectangle;
      },
      graphics: () => ({
        setDepth() {
          return this;
        },
        clear() {},
        lineStyle() {},
        lineBetween() {},
        destroy() {},
      }),
    },
    cameras: { main: { shake: vi.fn() } },
    time: {
      delayedCall: vi.fn<(delay: number, callback: () => void) => void>(),
    },
  };
  return {
    scene: scene as unknown as Phaser.Scene,
    rectangles,
    delayedCall: scene.time.delayedCall,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('difficulty combat integration', () => {
  it('moves tougher enemies faster and resets their health when a pool slot is reused', () => {
    const { scene } = combatScene();
    const pool = new EnemyPool(scene, getLevelDifficulty(5));
    const enemy = pool.spawn('shooter', 270, 100);
    expect(enemy.maxHp).toBe(110);
    pool.update(100, 270, 800);
    expect(enemy.y).toBeCloseTo(113.2);
    enemy.takeDamage(20);
    expect(enemy.currentHp).toBe(90);
    pool.release(enemy);
    const reused = pool.spawn('shooter', 270, 100);
    expect(reused).toBe(enemy);
    expect(reused.currentHp).toBe(110);
    expect(reused.collisionDamage).toBeCloseTo(13 * 1.3);
  });

  it('keeps scaled speed through homing updates and applies damage once on reuse', () => {
    const { scene } = combatScene();
    const pool = new EnemyBulletPool(scene, getLevelDifficulty(5));
    const target = { x: 100, y: 800 };
    const bullet = pool.fire(100, 100, 0, 100, 10, target);
    bullet.advance(100);
    bullet.advance(100);
    expect(bullet.y).toBeCloseTo(136);
    expect(bullet.damage).toBeCloseTo(13);
    pool.release(bullet);
    const reused = pool.fire(100, 100, 0, 100, 10);
    expect(reused).toBe(bullet);
    expect(reused.isHoming).toBe(false);
    reused.advance(100);
    expect(reused.y).toBeCloseTo(118);
    expect(reused.damage).toBeCloseTo(13);
    const normal = new EnemyBulletPool(scene).fire(100, 100, 0, 100, 10);
    normal.advance(100);
    expect(normal.y).toBe(110);
    expect(normal.damage).toBe(10);
  });

  it('uses scaled boss timing, direct damage, health bar and phase thresholds', () => {
    const { scene, rectangles, delayedCall } = combatScene();
    const hit = vi.fn();
    const attack = vi
      .spyOn(bossSkills.feather_storm, 'cast')
      .mockImplementation((ctx) => {
        ctx.onLaserHit(22);
        ctx.startDash(ctx.player.x, 650);
        return null;
      });
    const difficulty = getLevelDifficulty(5);
    const boss = new BossController(
      scene,
      { x: 270, y: 800 } as PlayerAircraft,
      new EnemyBulletPool(scene, difficulty),
      () => {},
      hit,
      () => {},
      () => {},
      'sky_tyrant',
      1.6,
      difficulty,
    );
    const hpBars = rectangles.filter(({ width }) => width === 430);
    expect(boss.hp).toBe(52800);
    boss.update(1400);
    boss.update(1266);
    expect(attack).not.toHaveBeenCalled();
    boss.update(1);
    expect(attack).toHaveBeenCalledTimes(1);
    expect(hit.mock.calls[0][0]).toBeCloseTo(28.6);
    expect(delayedCall.mock.calls[0][0]).toBe(650);
    delayedCall.mock.calls[0][1]();
    expect(hit.mock.calls[1][0]).toBeCloseTo(32.5);
    boss.damage(52800 * 0.21);
    expect(boss.phase).toBe(2);
    expect(hpBars[1].width).toBeCloseTo(430 * 0.79);
  });
});
