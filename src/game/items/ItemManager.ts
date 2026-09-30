import type Phaser from 'phaser';
import {
  itemConfigs,
  itemDropConfig,
  type ItemId,
} from '../../config/items/items';
import { playerBalance } from '../../config/balance/playerBalance';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { EnemyController } from '../enemies/EnemyController';
import type { PlayerHealth } from '../player/PlayerHealth';
import type { PlayerStats } from '../player/PlayerStats';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import type { WeaponManager } from '../weapons/WeaponManager';
import { ObjectPool } from '../utils/ObjectPool';
import { Random } from '../utils/Random';
import type { PickupPool } from './PickupPool';
import { ItemPickup } from './ItemPickup';
import { ElectricArc } from './ElectricArc';
import { ItemEffects } from './ItemEffects';
import { rollItem } from './ItemDrop';
import { HomingMissileSystem } from './HomingMissileSystem';
import {
  getLevelDifficulty,
  type LevelDifficulty,
} from '../../config/balance/levelDifficulty';
import { GAME_WIDTH } from '../viewport';

const DROP_MARGIN = 40;
const DROP_SPACING = 64;

export class ItemManager {
  private readonly pool: ObjectPool<ItemPickup>;
  private phoenixReady = false;
  private dropMs: number;
  private readonly electricArc: ElectricArc;
  private readonly homingMissiles: HomingMissileSystem;
  private readonly effects: ItemEffects;
  private readonly recent: ItemId[] = [];
  private repairOverflow = 0;
  private reviveSlowMs = 0;
  freezeMs = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly aircraft: PlayerAircraft,
    private readonly health: PlayerHealth,
    private readonly stats: PlayerStats,
    private readonly expOrbs: PickupPool,
    private readonly enemies: EnemyController,
    private readonly weapons: WeaponManager,
    private readonly enemyBullets: EnemyBulletPool,
    private readonly onItem: (message: string, maxed: boolean) => void,
    onMissileLaunch: (upgraded: boolean) => void = () => {},
    private readonly difficulty: LevelDifficulty = getLevelDifficulty(1),
  ) {
    this.dropMs = Math.round(
      itemDropConfig.firstDropMs / difficulty.itemDropDensity,
    );
    this.pool = new ObjectPool(() => new ItemPickup(scene), 24);
    this.electricArc = new ElectricArc(scene, enemies);
    this.homingMissiles = new HomingMissileSystem(
      scene,
      aircraft,
      stats,
      enemies,
      onMissileLaunch,
    );
    this.effects = new ItemEffects(scene, aircraft);
  }

  private spawnRandomDrop(): void {
    const count = this.difficulty.itemDropCount;
    const laneWidth = (GAME_WIDTH - DROP_MARGIN * 2) / count;
    const inset = count > 1 ? DROP_SPACING / 2 : 0;
    // 每个道具独立抽取，分区掉落留出间距，避免双份道具完全重叠。
    for (let index = 0; index < count; index += 1) {
      const x =
        DROP_MARGIN +
        index * laneWidth +
        inset +
        Random.float() * (laneWidth - inset * 2);
      this.spawnDrop(x, -20);
    }
  }

  private spawnDrop(x: number, y: number, elite = false): void {
    const id = rollItem({
      attackCores: this.stats.attackCores,
      rapidCores: this.stats.rapidCores,
      critCores: this.stats.critCores,
      spreadLevel: this.weapons.levels.spread_gun,
      electricStacks: this.electricArc.stacks,
      missileLevel: this.homingMissiles.level,
      missileOverdrive: this.homingMissiles.overdrive,
      shields: this.health.shields,
      hpRatio: this.health.hp / playerBalance.maxHp,
      phoenixReady: this.phoenixReady,
      recent: this.recent,
      elite,
    });
    this.pool.acquire().activate(x, y, id);
    this.recent.push(id);
    if (this.recent.length > 3) this.recent.shift();
  }

  rollEliteDrop(x: number, y: number): void {
    if (Random.float() >= 0.65) return;
    const count = this.difficulty.itemDropCount;
    const halfSpread = ((count - 1) * DROP_SPACING) / 2;
    const centerX =
      count === 1
        ? x
        : Math.max(
            DROP_MARGIN + halfSpread,
            Math.min(GAME_WIDTH - DROP_MARGIN - halfSpread, x),
          );
    // 精英掉落成功时也给双份；保留原概率，贴边时整组移回画面内。
    for (let index = 0; index < count; index += 1)
      this.spawnDrop(centerX + index * DROP_SPACING - halfSpread, y, true);
  }

  // 仅由开发环境快捷键调用，便于目视检查全部道具的配色和文字。
  spawnPreview(): void {
    (Object.keys(itemConfigs) as ItemId[]).forEach((id, index) => {
      this.pool
        .acquire()
        .activate(70 + (index % 5) * 100, 280 + Math.floor(index / 5) * 80, id);
    });
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    this.dropMs -= deltaMs;
    if (this.dropMs <= 0) {
      this.spawnRandomDrop();
      this.dropMs = Math.round(
        (itemDropConfig.intervalMinMs +
          Random.float() * itemDropConfig.intervalRandomMs) /
          this.difficulty.itemDropDensity,
      );
    }
    this.freezeMs = Math.max(0, this.freezeMs - deltaMs);
    this.reviveSlowMs = Math.max(0, this.reviveSlowMs - deltaMs);
    this.stats.update(deltaMs);
    this.enemies.frozen = this.freezeMs > 0;
    this.effects.update(this.freezeMs > 0);
    this.electricArc.update(
      deltaMs,
      playerX,
      playerY,
      this.stats.attackMultiplier,
      this.freezeMs > 0,
    );
    this.homingMissiles.update(deltaMs);
    const magnetBoost = this.stats.magnetMs > 0;
    for (const item of this.pool.activeItems()) {
      const result = item.advance(
        deltaMs,
        playerX,
        playerY,
        magnetBoost ? 200 : 100,
        magnetBoost
          ? itemDropConfig.pickupRadius * 2
          : itemDropConfig.pickupRadius,
      );
      if (result === 'collect') this.apply(item.itemId, item.x, item.y);
      if (result) this.pool.release(item);
    }
  }

  apply(
    id: ItemId,
    sourceX = this.aircraft.x,
    sourceY = this.aircraft.y - 85,
  ): void {
    this.effects.pickup(id, sourceX, sourceY);
    let message: string = itemConfigs[id].name;
    let maxed = false;
    switch (id) {
      case 'attack_core':
        this.stats.attackCores = Math.min(5, this.stats.attackCores + 1);
        maxed = this.stats.attackCores === 5;
        message = `攻击核心 ${maxed ? 'MAX' : `Lv.${this.stats.attackCores}`}  伤害 +12%`;
        if (this.stats.firepowerOverload) message += '  火力过载';
        break;
      case 'fire_rate_core':
        this.stats.rapidCores = Math.min(5, this.stats.rapidCores + 1);
        maxed = this.stats.rapidCores === 5;
        message = `急速核心 ${maxed ? 'MAX' : `Lv.${this.stats.rapidCores}`}  射速 +10%`;
        if (this.stats.firepowerOverload) message += '  火力过载';
        break;
      case 'critical_core':
        this.stats.critCores = Math.min(5, this.stats.critCores + 1);
        maxed = this.stats.critCores === 5;
        message = `暴击核心 ${maxed ? 'MAX' : `Lv.${this.stats.critCores}`}  暴击 +5%`;
        if (this.stats.destructionCore) message += '  毁灭核心';
        break;
      case 'shield':
        if (this.health.shields >= 5) {
          this.shieldOverload();
          message = '护盾过载  冲击波';
          maxed = true;
        } else {
          this.health.addShield();
          message = `能量护盾 Lv.${this.health.shields}`;
          maxed = this.health.shields === 5;
        }
        break;
      case 'electric_arc':
        this.electricArc.addStack();
        maxed = this.electricArc.stacks === 5;
        message = `电击能量 ${maxed ? 'MAX' : `Lv.${this.electricArc.stacks}`}`;
        break;
      case 'spread_gun': {
        this.weapons.upgradeWeapon('spread_gun');
        const level = this.weapons.levels.spread_gun;
        maxed = level === 5;
        message = `散射枪 ${maxed ? 'MAX' : `Lv.${level}`}`;
        break;
      }
      case 'homing_missile':
        this.homingMissiles.addStack();
        maxed = this.homingMissiles.level === 5;
        message =
          this.homingMissiles.overdrive > 0
            ? `追踪导弹系统 MAX  伤害 +${this.homingMissiles.overdrive * 10}%`
            : `追踪导弹系统 ${maxed ? 'MAX · 导弹风暴' : `Lv.${this.homingMissiles.level}`}  ${this.homingMissiles.level * 2} 枚/秒`;
        this.effects.ring(
          this.aircraft.x,
          this.aircraft.y,
          0xffb865,
          maxed ? 160 : 95,
        );
        break;
      case 'heal':
        if (this.health.hp >= playerBalance.maxHp && this.health.shields >= 5) {
          this.emergencyOvercharge();
          message = 'EMERGENCY OVERCHARGE';
          maxed = true;
        } else {
          this.repairOverflow += this.health.heal(30);
          while (this.repairOverflow >= 30 && this.health.shields < 5) {
            this.repairOverflow -= 30;
            this.health.addShield();
          }
          this.repairOverflow = Math.min(this.repairOverflow, 29);
          message =
            this.health.shields > 0 && this.health.hp === playerBalance.maxHp
              ? `维修装置  HP 满 / 护盾 Lv.${this.health.shields}`
              : '维修装置  HP +30';
        }
        break;
      case 'magnet':
        this.expOrbs.startMagnet();
        this.stats.magnetMs = 5_000;
        this.effects.ring(this.aircraft.x, this.aircraft.y, 0x6af7d3, 230);
        message = '吸附磁铁  经验吸收 / 范围 +100%';
        break;
      case 'berserk':
        this.stats.activateBerserk();
        this.effects.ring(this.aircraft.x, this.aircraft.y, 0xff7040, 120);
        message =
          this.stats.rapidCores >= 5
            ? 'REDLINE  狂暴射速强化'
            : '狂暴模式  10 秒过载';
        break;
      case 'time_freeze':
        this.freezeMs = 5_000;
        this.effects.screenPulse(0xc7eeff, 0.4);
        message = '时间冻结  5 秒';
        break;
      case 'phoenix_core':
        if (this.phoenixReady) {
          this.health.heal(40);
          this.health.addShield();
          message = '凤凰核心  HP +40 / 护盾 +1';
        } else {
          this.phoenixReady = true;
          message = '凤凰核心  重生已就绪';
        }
        this.effects.ring(this.aircraft.x, this.aircraft.y, 0xffb45b, 110);
        break;
    }
    if (maxed)
      this.effects.ring(this.aircraft.x, this.aircraft.y, 0xffdc79, 155);
    this.onItem(message, maxed);
  }

  private shieldOverload(): void {
    this.enemyBullets.clearWithin(this.aircraft.x, this.aircraft.y, 190);
    this.enemies.areaDamage(this.aircraft.x, this.aircraft.y, 155, 24);
    this.effects.ring(this.aircraft.x, this.aircraft.y, 0xffdc62, 190);
  }

  private emergencyOvercharge(): void {
    this.enemyBullets.clearWithin(this.aircraft.x, this.aircraft.y, 230);
    for (const enemy of this.enemies.enemies.activeEnemies()) {
      if (
        Math.hypot(enemy.x - this.aircraft.x, enemy.y - this.aircraft.y) < 230
      )
        enemy.knockback(this.aircraft.x, this.aircraft.y, 90);
    }
    this.effects.ring(this.aircraft.x, this.aircraft.y, 0x83eaff, 230);
    this.scene.cameras.main.shake(180, 0.003);
  }

  tryRevive(): boolean {
    if (!this.phoenixReady) return false;
    this.phoenixReady = false;
    this.health.revive();
    this.reviveSlowMs = 450;
    this.enemyBullets.clear();
    for (const enemy of this.enemies.enemies.activeEnemies())
      if (
        Math.hypot(enemy.x - this.aircraft.x, enemy.y - this.aircraft.y) < 230
      )
        this.enemies.damageEnemy(enemy, 140, false);
    this.effects.screenPulse(0xffaa63, 0.5);
    this.effects.ring(this.aircraft.x, this.aircraft.y, 0xffcb78, 240);
    this.onItem('凤凰重生  HP 50% / 无敌 2 秒', true);
    return true;
  }

  get enemySpeedFactor(): number {
    return Math.min(
      this.freezeMs > 0 ? 0.15 : 1,
      this.reviveSlowMs > 0 ? 0.25 : 1,
    );
  }
  get bulletSpeedFactor(): number {
    return Math.min(
      this.freezeMs > 0 ? 0.3 : 1,
      this.reviveSlowMs > 0 ? 0.25 : 1,
    );
  }
  get bossSpeedFactor(): number {
    return Math.min(
      this.freezeMs > 0 ? 0.7 : 1,
      this.reviveSlowMs > 0 ? 0.25 : 1,
    );
  }
  get hasPhoenix(): boolean {
    return this.phoenixReady;
  }
  get electricStacks(): number {
    return this.electricArc.stacks;
  }
  get missileLevel(): number {
    return this.homingMissiles.level;
  }
  get missileOverdrive(): number {
    return this.homingMissiles.overdrive;
  }
  get repairOverflowAmount(): number {
    return this.repairOverflow;
  }
  get recentDrops(): readonly ItemId[] {
    return this.recent;
  }
  restore(
    electricStacks: number,
    phoenixReady: boolean,
    freezeMs = 0,
    repairOverflow = 0,
    recent: readonly ItemId[] = [],
    missileLevel = 0,
    missileOverdrive = 0,
  ): void {
    this.electricArc.setStacks(electricStacks);
    this.homingMissiles.restore(missileLevel, missileOverdrive);
    this.phoenixReady = phoenixReady;
    this.freezeMs = freezeMs;
    this.repairOverflow = repairOverflow;
    this.recent.splice(0, this.recent.length, ...recent.slice(-3));
  }

  destroy(): void {
    for (const item of this.pool.allItems()) item.destroy();
    this.electricArc.destroy();
    this.homingMissiles.destroy();
    this.effects.destroy();
  }
}
