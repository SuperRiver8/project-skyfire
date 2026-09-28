import type { LevelConfig, SpawnGroupConfig } from '../../config/levels/types';
import { spawnX } from './SpawnManager';

interface PendingGroup {
  config: SpawnGroupConfig;
  nextAtMs: number;
  spawned: number;
}

export class WaveManager {
  elapsedMs = 0;
  readonly groups: PendingGroup[];
  private completed = false;

  constructor(
    private readonly level: LevelConfig,
    private readonly spawn: (enemyId: string, x: number, y: number) => void,
    private readonly onComplete: () => void,
  ) {
    this.groups = level.waves.flatMap((wave) =>
      wave.groups.map((group) => ({
        config: group,
        nextAtMs: wave.startAtMs,
        spawned: 0,
      })),
    );
  }

  update(deltaMs: number, activeEnemies: number): void {
    if (this.completed) return;
    // 失焦恢复时只推进一个有限时间片，避免整关 Wave 同帧爆发。
    this.elapsedMs += Math.min(100, Math.max(0, deltaMs));
    for (const group of this.groups) {
      while (
        group.spawned < group.config.count &&
        this.elapsedMs >= group.nextAtMs
      ) {
        this.spawn(
          group.config.enemyId,
          spawnX(group.config, group.spawned),
          -24,
        );
        group.spawned += 1;
        group.nextAtMs += group.config.intervalMs;
      }
    }
    if (
      this.elapsedMs >= this.level.durationMs &&
      (this.level.bossId || activeEnemies === 0) &&
      this.groups.every((group) => group.spawned >= group.config.count)
    ) {
      this.completed = true;
      this.onComplete();
    }
  }
}
