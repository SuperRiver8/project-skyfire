import type { LevelConfig, SpawnGroupConfig } from '../../config/levels/types';
import { GAME_WIDTH } from '../viewport';
import { spawnX } from './SpawnManager';

const IDLE_FILL_MS = 950;
const NEXT_WAVE_GUARD_MS = 1_500;

interface PendingGroup {
  config: SpawnGroupConfig;
  nextAtMs: number;
  spawned: number;
}

export class WaveManager {
  elapsedMs = 0;
  readonly groups: PendingGroup[];
  private completed = false;
  private idleMs = 0;
  private fillerSerial = 0;

  constructor(
    private readonly level: LevelConfig,
    private readonly spawn: (enemyId: string, x: number, y: number) => void,
    private readonly onComplete: () => void,
  ) {
    this.groups = level.waves.flatMap((wave) =>
      wave.groups.map((group) => ({
        // 数量翻倍后沿原间隔持续投放，减少波次间的无敌机时间。
        config: {
          ...group,
          count: group.count * 2,
        },
        nextAtMs: wave.startAtMs,
        spawned: 0,
      })),
    );
  }

  update(deltaMs: number, activeEnemies: number): void {
    if (this.completed) return;
    // 失焦恢复时只推进一个有限时间片，避免整关 Wave 同帧爆发。
    const stepMs = Math.min(100, Math.max(0, deltaMs));
    this.elapsedMs += stepMs;
    let spawnedThisUpdate = false;
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
        spawnedThisUpdate = true;
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
      return;
    }
    if (activeEnemies > 0 || spawnedThisUpdate) {
      this.idleMs = 0;
      return;
    }
    let nextSpawnAtMs = this.level.durationMs;
    for (const group of this.groups) {
      if (group.spawned < group.config.count)
        nextSpawnAtMs = Math.min(nextSpawnAtMs, group.nextAtMs);
    }
    if (nextSpawnAtMs - this.elapsedMs <= NEXT_WAVE_GUARD_MS) {
      this.idleMs = 0;
      return;
    }
    this.idleMs += stepMs;
    if (this.idleMs < IDLE_FILL_MS) return;
    this.idleMs = 0;
    // 只在清屏的长间隔补一对轻型敌机，不打断既定波次。
    const fillerId =
      this.level.id <= 2
        ? 'scout'
        : this.level.id <= 4
          ? 'zigzag_fighter'
          : 'shooter';
    const left = 0.22 + (this.fillerSerial % 3) * 0.08;
    this.fillerSerial += 1;
    this.spawn(fillerId, GAME_WIDTH * left, -24);
    this.spawn(fillerId, GAME_WIDTH * (1 - left), -24);
  }
}
