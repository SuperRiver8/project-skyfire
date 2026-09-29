import Phaser from 'phaser';
import { electricArcBalance as balance } from '../../config/balance/electricArcBalance';
import type { Enemy } from '../enemies/Enemy';
import type { EnemyController } from '../enemies/EnemyController';
import { selectArcTargets } from './ArcTargeting';

export class ElectricArc {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private attackMs = 0;
  stacks = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly enemies: EnemyController,
  ) {
    this.graphics = scene.add.graphics().setDepth(14);
  }

  addStack(): void {
    this.setStacks(this.stacks + 1);
  }

  setStacks(value: number): void {
    this.stacks = Math.max(0, Math.min(balance.maxStacks, value));
  }

  update(
    deltaMs: number,
    playerX: number,
    playerY: number,
    attack: number,
    frozen = false,
  ): void {
    if (this.stacks === 0) {
      this.graphics.clear();
      return;
    }
    this.graphics.clear();
    const sourceY = playerY - 37;
    const color = frozen ? 0xe4f8ff : 0x43d6ff;

    // 电击装置优先锁定轻型敌机，同时可对范围内的 Boss 放电。
    const range =
      (balance.baseRange + this.stacks * balance.rangePerStack) *
      (frozen ? 1.3 : 1);
    const targets = selectArcTargets(
      this.enemies.enemies.activeEnemies(),
      playerX,
      sourceY,
      range,
      this.stacks >= 5 ? 3 : this.stacks >= 3 ? 2 : 1,
    );
    const boss = this.enemies.boss;
    const bossInRange =
      boss?.isDamageable() &&
      Math.hypot(boss.x - playerX, boss.y - sourceY) <= range + 70;
    if (targets.length === 0 && !bossInRange) return;
    const beamWidth = this.stacks >= 4 ? 7 : 3 + this.stacks * 0.5;
    for (const target of targets) {
      const bendX = (playerX + target.x) / 2 + Math.sin(this.attackMs) * 10;
      const bendY = (sourceY + target.y) / 2;
      this.graphics.lineStyle(beamWidth + 4, color, 0.28);
      this.graphics.lineBetween(playerX, sourceY, bendX, bendY);
      this.graphics.lineBetween(bendX, bendY, target.x, target.y);
      this.graphics.lineStyle(Math.max(2, beamWidth - 2), 0xffffff, 0.92);
      this.graphics.lineBetween(playerX, sourceY, bendX, bendY);
      this.graphics.lineBetween(bendX, bendY, target.x, target.y);
    }
    if (bossInRange && boss) {
      this.graphics.lineStyle(beamWidth + 5, color, 0.35);
      this.graphics.lineBetween(playerX, sourceY, boss.x, boss.y);
      this.graphics.lineStyle(Math.max(3, beamWidth - 1), 0xffffff, 0.95);
      this.graphics.lineBetween(playerX, sourceY, boss.x, boss.y);
    }
    this.attackMs -= deltaMs;
    if (this.attackMs <= 0) {
      const damage =
        (balance.baseDamage + this.stacks * balance.damagePerStack) *
        attack *
        (this.stacks >= 4 ? 1.45 : 1) *
        (frozen ? 1.25 : 1);
      for (const target of targets) {
        if (!target.isActive()) continue;
        const { x, y } = target;
        const killed = this.enemies.damageEnemy(target, damage);
        if (killed && this.stacks >= 5) {
          let jump: Enemy | undefined;
          for (const enemy of this.enemies.enemies.activeEnemies()) {
            if (
              this.isLight(enemy) &&
              !targets.includes(enemy) &&
              Math.hypot(enemy.x - x, enemy.y - y) < 95
            ) {
              jump = enemy;
              break;
            }
          }
          if (jump) {
            this.graphics.lineStyle(3, color, 0.95);
            this.graphics.lineBetween(x, y, jump.x, jump.y);
            this.enemies.damageEnemy(jump, damage * 0.55, false);
          }
        }
      }
      if (bossInRange) this.enemies.damageBoss(damage);
      this.attackMs = balance.attackIntervalMs;
    }
  }

  private isLight(enemy: Enemy): boolean {
    return enemy.aiType === 'STRAIGHT' || enemy.aiType === 'ZIGZAG';
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
