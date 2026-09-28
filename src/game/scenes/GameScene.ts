import Phaser from 'phaser';
import { getLevelConfig } from '../level/LevelManager';
import { WaveManager } from '../level/WaveManager';
import { CollisionSystem } from '../combat/CollisionSystem';
import { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import { EnemyController } from '../enemies/EnemyController';
import { InputController } from '../input/InputController';
import { PlayerAircraft } from '../player/PlayerAircraft';
import { PlayerController } from '../player/PlayerController';
import { PlayerHealth } from '../player/PlayerHealth';
import { PlayerStats } from '../player/PlayerStats';
import { PlayerProgress, expRequired } from '../player/PlayerProgress';
import { PickupPool } from '../items/PickupPool';
import { ItemManager } from '../items/ItemManager';
import { BossController } from '../bosses/BossController';
import { CombatEffects } from '../effects/CombatEffects';
import { AudioManager } from '../audio/AudioManager';
import { feedbackConfig } from '../../config/effects/feedback';
import { SaveManager } from '../save/SaveManager';
import { PausePanel } from '../ui/PausePanel';
import { DebugOverlay } from '../ui/DebugOverlay';
import { Random } from '../utils/Random';
import type { ResultData } from './ResultScene';
import {
  generateUpgrades,
  type UpgradeOption,
} from '../upgrades/UpgradeGenerator';
import { GAME_WIDTH } from '../viewport';
import { WeaponManager } from '../weapons/WeaponManager';

export class GameScene extends Phaser.Scene {
  private playerController!: PlayerController;
  private weaponManager!: WeaponManager;
  private enemyController!: EnemyController;
  private collisionSystem!: CollisionSystem;
  private enemyBullets!: EnemyBulletPool;
  private health!: PlayerHealth;
  private aircraft!: PlayerAircraft;
  private gameOver = false;
  private waveManager!: WaveManager;
  private stats!: PlayerStats;
  private progress!: PlayerProgress;
  private pickups!: PickupPool;
  private itemManager!: ItemManager;
  private notificationText!: Phaser.GameObjects.Text;
  private toastSerial = 0;
  private hpText!: Phaser.GameObjects.Text;
  private expText!: Phaser.GameObjects.Text;
  private levelId = 1;
  private boss: BossController | undefined;
  private effects!: CombatEffects;
  private audio!: AudioManager;
  private hitStopMs = 0;
  private pausePanel: PausePanel | undefined;
  private score = 0;
  private kills = 0;
  private damageDealt = 0;
  private damageTaken = 0;
  private elapsedTimeMs = 0;
  private debugOverlay: DebugOverlay | undefined;
  private stressMs = 0;
  private readonly onEscape = (): void => this.togglePause();

  constructor() {
    super('GameScene');
  }

  init(data?: { levelId?: number }): void {
    this.levelId = data?.levelId ?? 1;
  }

  create(): void {
    this.boss = undefined;
    this.pausePanel = undefined;
    this.debugOverlay = undefined;
    this.stressMs = 0;
    this.score = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.elapsedTimeMs = 0;
    this.toastSerial = 0;
    const scoreText = this.add.text(20, 22, '得分 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#e8f7ff',
    });

    const aircraft = new PlayerAircraft(this);
    this.aircraft = aircraft;
    this.health = new PlayerHealth();
    this.gameOver = false;
    this.stats = new PlayerStats();
    const settings = new SaveManager().load().settings;
    this.effects = new CombatEffects(
      this,
      settings.damageNumbers,
      settings.screenShake,
    );
    this.audio = new AudioManager();
    this.audio.setSfxVolume(settings.sfxVolume);
    this.hitStopMs = 0;
    this.progress = new PlayerProgress();
    this.hpText = this.add.text(20, 48, `生命 ${this.health.hp}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#8ef0cf',
    });
    this.expText = this.add.text(20, 76, '等级 1  经验 0/40', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#5affb0',
    });
    const input = new InputController(this);
    this.playerController = new PlayerController(aircraft, input);
    this.pickups = new PickupPool(this);
    this.enemyController = new EnemyController(
      this,
      (score) => {
        this.score = score;
        scoreText.setText(`得分 ${score}`);
      },
      (x, y, exp) => {
        this.kills += 1;
        this.pickups.spawnExp(x, y, exp);
        this.itemManager.rollDrop(x, y);
      },
      this.stats,
      (x, y, damage, crit, killed) => {
        this.damageDealt += damage;
        this.effects.hit(x, y, damage, crit, killed);
        this.audio.playSfx(killed ? 'enemy_explosion' : 'enemy_hit');
        if (killed) this.hitStopMs = feedbackConfig.killHitStopMs;
      },
    );
    this.weaponManager = new WeaponManager(
      this,
      aircraft,
      this.stats,
      this.enemyController,
      this.audio,
    );
    this.enemyBullets = new EnemyBulletPool(this);
    this.enemyController.attachCombat(
      aircraft,
      this.enemyBullets,
      (x, y, radius, damage) => {
        if (Math.hypot(aircraft.x - x, aircraft.y - y) < radius)
          this.hitPlayer(damage);
      },
    );
    this.notificationText = this.add
      .text(GAME_WIDTH / 2, 165, '', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#ffe4a0',
      })
      .setOrigin(0.5);
    this.itemManager = new ItemManager(
      this,
      this.health,
      this.stats,
      this.pickups,
      this.enemyController,
      this.enemyBullets,
      (name) => {
        this.audio.playSfx('pickup');
        this.showToast(name);
        this.hpText.setText(
          `生命 ${this.health.hp}  护盾 ${this.health.shields}`,
        );
      },
      (exp) => this.gainExp(exp),
    );
    this.collisionSystem = new CollisionSystem(
      this.weaponManager.bullets,
      this.enemyController,
      this.enemyBullets,
      aircraft,
      this.health,
      (hpLost) => this.afterPlayerHit(hpLost),
    );

    this.waveManager = new WaveManager(
      getLevelConfig(this.levelId),
      (id, x, y) => this.enemyController.spawn(id, x, y),
      () => this.onWavesComplete(),
    );

    this.add
      .text(505, 24, 'Ⅱ', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#e8f7ff',
      })
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(50)
      .on('pointerdown', () => this.togglePause());
    this.input.keyboard?.on('keydown-ESC', this.onEscape);
    if (import.meta.env.DEV) {
      this.debugOverlay = new DebugOverlay(
        this,
        this.weaponManager.bullets,
        this.enemyBullets,
        this.enemyController.enemies,
        this.effects,
        this.health,
        this.weaponManager,
        {
          kill: () => this.enemyController.enemies.clear(),
          boss: () => this.spawnBoss(),
          upgrade: () => this.gainExp(expRequired(this.progress.level)),
          heal: () => {
            this.health.heal(100);
            this.hpText.setText(`生命 ${this.health.hp}`);
          },
          god: () => {
            this.health.godMode = !this.health.godMode;
          },
          stress: () => this.startStress(),
          next: () => this.showLevelComplete(),
          items: () => this.itemManager.spawnPreview(),
        },
      );
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.weaponManager.destroy();
      this.enemyController.destroy();
      this.enemyBullets.destroy();
      this.pickups.destroy();
      this.itemManager.destroy();
      this.boss?.destroy();
      this.effects.destroy();
      this.pausePanel?.destroy();
      this.debugOverlay?.destroy();
      this.input.keyboard?.off('keydown-ESC', this.onEscape);
    });
  }

  update(_time: number, deltaMs: number): void {
    if (this.gameOver || this.pausePanel) return;
    if (this.hitStopMs > 0) {
      this.hitStopMs -= deltaMs;
      this.effects.update(deltaMs);
      return;
    }
    this.playerController.update(deltaMs);
    this.weaponManager.update(deltaMs);
    this.enemyController.update(deltaMs * this.itemManager.enemySpeedFactor);
    this.enemyBullets.update(deltaMs * this.itemManager.bulletSpeedFactor);
    this.boss?.update(deltaMs);
    if (this.gameOver) return;
    if (this.stressMs > 0) {
      this.stressMs -= deltaMs;
      if (this.stressMs <= 0) {
        this.enemyController.enemies.clear();
        this.weaponManager.bullets.clear();
        this.enemyBullets.clear();
      }
    } else this.collisionSystem.update();
    if (this.gameOver) return;
    this.pickups.update(
      deltaMs,
      this.aircraft.x,
      this.aircraft.y,
      this.stats.pickupRadius,
      (exp) => this.gainExp(exp),
    );
    this.itemManager.update(deltaMs, this.aircraft.x, this.aircraft.y);
    this.effects.update(deltaMs);
    this.waveManager.update(deltaMs, this.enemyController.enemies.activeCount);
    this.health.update(deltaMs);
    this.elapsedTimeMs += deltaMs;
    this.aircraft.setAlpha(
      this.health.invulnerableMs > 0 &&
        Math.floor(this.health.invulnerableMs / 80) % 2 === 0
        ? 0.4
        : 1,
    );
    this.debugOverlay?.update(
      deltaMs,
      this.levelId,
      Math.floor(this.waveManager.elapsedMs / 10_000) + 1,
    );
  }

  private startStress(): void {
    this.stressMs = 3000;
    for (let i = 0; i < 50; i += 1)
      this.enemyController.spawn(
        'scout',
        30 + (i % 10) * 52,
        90 + Math.floor(i / 10) * 60,
      );
    for (let i = 0; i < 250; i += 1)
      this.weaponManager.bullets.fire(
        20 + (i % 25) * 20,
        220 + Math.floor(i / 25) * 45,
        0,
        1,
      );
    for (let i = 0; i < 200; i += 1)
      this.enemyBullets.fire(
        20 + (i % 20) * 25,
        270 + Math.floor(i / 20) * 35,
        0,
        0,
        1,
      );
    this.effects.stressParticles(100);
  }

  private togglePause(): void {
    if (this.gameOver) return;
    if (this.pausePanel) {
      this.pausePanel.destroy();
      this.pausePanel = undefined;
      this.time.paused = false;
      return;
    }
    this.time.paused = true;
    this.pausePanel = new PausePanel(
      this,
      () => this.togglePause(),
      () => {
        this.time.paused = false;
        this.scene.restart({ levelId: this.levelId });
      },
      () => {
        this.time.paused = false;
        this.scene.start('MainMenuScene');
      },
      this.audio.sfxVolume > 0,
      () => {
        const manager = new SaveManager();
        const save = manager.load();
        save.settings.sfxVolume = save.settings.sfxVolume > 0 ? 0 : 0.7;
        manager.save(save);
        this.audio.setSfxVolume(save.settings.sfxVolume);
        if (save.settings.sfxVolume > 0) {
          AudioManager.unlock();
          this.audio.playSfx('pickup');
        }
        return save.settings.sfxVolume > 0;
      },
    );
  }

  private result(victory: boolean): ResultData {
    return {
      victory,
      levelId: this.levelId,
      elapsedTimeMs: this.elapsedTimeMs,
      kills: this.kills,
      damageDealt: this.damageDealt,
      damageTaken: this.damageTaken,
      score: this.score,
    };
  }

  private onWavesComplete(): void {
    if (this.levelId !== 5) {
      this.showLevelComplete();
      return;
    }
    this.enemyController.enemies.clear();
    this.enemyBullets.clear();
    const warning = this.add
      .text(GAME_WIDTH / 2, 360, '警告\n机械雄鹰来袭', {
        fontFamily: 'Arial',
        fontSize: '38px',
        color: '#ff7272',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.audio.playSfx('boss_warning');
    this.time.delayedCall(1800, () => {
      warning.destroy();
      this.spawnBoss();
    });
  }

  private spawnBoss(): void {
    if (this.boss?.isActive()) return;
    this.enemyController.enemies.clear();
    this.enemyBullets.clear();
    this.boss = new BossController(
      this,
      this.aircraft,
      this.enemyBullets,
      () => this.showLevelComplete(),
      (damage) => this.hitPlayer(damage),
      () => this.audio.playSfx('boss_phase'),
      (x, y) => {
        this.enemyController.spawnExplosion(x, y);
        this.audio.playSfx('boss_explosion');
      },
    );
    this.enemyController.boss = this.boss;
  }

  private gainExp(exp: number): void {
    this.progress.gain(exp);
    this.aircraft.setForm(
      this.progress.level >= 6 ? 3 : this.progress.level >= 3 ? 2 : 1,
    );
    this.expText.setText(
      `等级 ${this.progress.level}  经验 ${this.progress.exp}/${expRequired(this.progress.level)}`,
    );
    while (this.progress.pendingUpgrades > 0) this.autoUpgrade();
  }

  private autoUpgrade(): void {
    const firstLevelUp =
      this.progress.level - this.progress.pendingUpgrades === 1;
    const options = generateUpgrades(this.weaponManager.levels, firstLevelUp);
    this.applyUpgrade(Random.pick(options));
  }

  private applyUpgrade(option: UpgradeOption): void {
    this.audio.playSfx('upgrade');
    switch (option.id) {
      case 'machine_gun':
      case 'spread_gun':
      case 'laser':
      case 'missile':
      case 'lightning':
        this.weaponManager.upgradeWeapon(option.id);
        break;
      case 'attack':
        this.itemManager.apply('attack_core');
        break;
      case 'rapid':
        this.itemManager.apply('fire_rate_core');
        break;
      case 'heal':
        this.itemManager.apply('heal');
        break;
    }
    this.progress.claimUpgrade();
    this.showToast(`自动升级：${option.title}`);
  }

  private showToast(message: string): void {
    const serial = ++this.toastSerial;
    this.notificationText.setText(message);
    this.time.delayedCall(1500, () => {
      if (serial === this.toastSerial) this.notificationText.setText('');
    });
  }

  private showGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.audio.playSfx('game_over');
    const result = this.result(false);
    queueMicrotask(() => this.scene.start('ResultScene', result));
  }

  private showLevelComplete(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.audio.playSfx('victory');
    const result = this.result(true);
    queueMicrotask(() => this.scene.start('ResultScene', result));
  }

  private hitPlayer(damage: number): void {
    const hpBefore = this.health.hp;
    if (this.health.hit(damage)) this.afterPlayerHit(hpBefore - this.health.hp);
  }

  private afterPlayerHit(hpLost: number): void {
    this.damageTaken += hpLost;
    if (this.health.isDead && !this.itemManager.tryRevive())
      this.showGameOver();
    this.hpText.setText(`生命 ${this.health.hp}  护盾 ${this.health.shields}`);
    this.cameras.main.shake(80, 0.003);
    this.audio.playSfx('player_hit');
  }
}
