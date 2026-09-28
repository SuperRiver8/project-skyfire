import Phaser from 'phaser';
import type { BulletPool } from '../bullets/BulletPool';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { EnemyPool } from '../enemies/EnemyPool';
import type { CombatEffects } from '../effects/CombatEffects';
import type { PlayerHealth } from '../player/PlayerHealth';
import type { WeaponManager } from '../weapons/WeaponManager';

export interface DebugCommands {
  kill: () => void;
  boss: () => void;
  upgrade: () => void;
  heal: () => void;
  god: () => void;
  stress: () => void;
  next: () => void;
  items: () => void;
}

export class DebugOverlay {
  private readonly text: Phaser.GameObjects.Text;
  private readonly boxes: Phaser.GameObjects.Graphics;
  private visible = false;
  private showBoxes = false;
  private elapsedMs = 0;
  private readonly keyBindings: { event: string; handler: () => void }[] = [];
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bullets: BulletPool,
    private readonly enemyBullets: EnemyBulletPool,
    private readonly enemies: EnemyPool,
    private readonly effects: CombatEffects,
    private readonly health: PlayerHealth,
    private readonly weapons: WeaponManager,
    commands: DebugCommands,
  ) {
    this.text = scene.add
      .text(10, 240, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#071326',
      })
      .setDepth(200)
      .setVisible(false);
    this.boxes = scene.add.graphics().setDepth(199);
    const keyboard = scene.input.keyboard;
    const bind = (event: string, handler: () => void): void => {
      keyboard?.on(event, handler);
      this.keyBindings.push({ event, handler });
    };
    bind('keydown-F2', () => {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    });
    bind('keydown-F3', () => {
      this.showBoxes = !this.showBoxes;
      if (!this.showBoxes) this.boxes.clear();
    });
    bind('keydown-K', commands.kill);
    bind('keydown-B', commands.boss);
    bind('keydown-U', commands.upgrade);
    bind('keydown-H', commands.heal);
    bind('keydown-G', commands.god);
    bind('keydown-P', commands.stress);
    bind('keydown-N', commands.next);
    bind('keydown-I', commands.items);
  }
  update(deltaMs: number, levelId: number, wave: number): void {
    this.elapsedMs += deltaMs;
    if (this.visible && this.elapsedMs >= 250) {
      this.elapsedMs = 0;
      this.text.setText(
        `帧率 ${this.scene.game.loop.actualFps.toFixed(0)}\n关卡 ${levelId} 波次 ${wave}\n生命 ${this.health.hp} 无敌 ${this.health.godMode ? '开' : '关'}\n敌机 ${this.enemies.activeCount}/${this.enemies.createdCount}\n我方子弹 ${this.bullets.activeCount}/${this.bullets.createdCount}\n敌方子弹 ${this.enemyBullets.activeCount}/${this.enemyBullets.createdCount}\n粒子 ${this.effects.particleCount}\n武器等级（机炮/散射/激光/导弹/闪电）\n${Object.values(this.weapons.levels).join(' / ')}`,
      );
    }
    if (this.showBoxes) {
      this.boxes.clear().lineStyle(1, 0x58ffb3, 0.7);
      for (const enemy of this.enemies.activeEnemies())
        this.boxes.strokeRect(
          enemy.x - enemy.hitboxWidth / 2,
          enemy.y - enemy.hitboxHeight / 2,
          enemy.hitboxWidth,
          enemy.hitboxHeight,
        );
      for (const bullet of this.bullets.activeBullets())
        this.boxes.strokeRect(bullet.x - 5, bullet.y - 14, 10, 28);
    }
  }
  destroy(): void {
    for (const { event, handler } of this.keyBindings)
      this.scene.input.keyboard?.off(event, handler);
    this.text.destroy();
    this.boxes.destroy();
  }
}
