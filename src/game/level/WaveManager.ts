import type { LevelConfig, SpawnGroupConfig } from '../../config/levels/types';
import { levelProgressConfig } from '../../config/levels/progression';
import { GAME_WIDTH } from '../viewport';
import { spawnX } from './SpawnManager';
import {
  allocateEnemyCounts,
  getLevelDifficulty,
  type LevelDifficulty,
} from '../../config/balance/levelDifficulty';

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
  private warned = false;
  private idleMs = 0;
  private fillerSerial = 0;

  constructor(
    private readonly level: LevelConfig,
    private readonly spawn: (
      enemyId: string,
      x: number,
      y: number,
      filler?: boolean,
    ) => void,
    private readonly onComplete: () => void,
    private readonly difficulty: LevelDifficulty = getLevelDifficulty(level.id),
    private readonly onBossWarning: () => void = () => {},
  ) {
    const timelineScale =
      level.durationMs / (level.waveTimelineMs ?? level.durationMs);
    const groups = level.waves.flatMap((wave) =>
      wave.groups.map((config) => ({
        config,
        startAtMs: Math.round(wave.startAtMs * timelineScale),
      })),
    );
    // 已有的数量翻倍属于当前版本基准，新难度只在此基础上应用一次。
    const counts = allocateEnemyCounts(
      groups.map(({ config }) => config.count * 2),
      difficulty.enemyCount,
    );
    this.groups = groups.map(({ config, startAtMs }, index) => {
      const count = counts[index];
      // 常规间隔最低 100ms；原本的 1ms 等同时生成配置保持原样。
      let intervalMs = Math.min(
        config.intervalMs <= 1 ? config.intervalMs : Infinity,
        Math.max(
          100,
          Math.round(
            (config.intervalMs * timelineScale) / difficulty.spawnDensity,
          ),
        ),
      );
      const availableMs = level.durationMs - startAtMs;
      if (count > 1 && availableMs > 0) {
        // 增加数量不延后 Boss；最后一架最晚在既定阶段结束时生成。
        intervalMs = Math.min(
          intervalMs,
          Math.max(1, Math.floor(availableMs / (count - 1))),
        );
      }
      return {
        config: { ...config, count, intervalMs },
        nextAtMs: startAtMs,
        spawned: 0,
      };
    });
  }

  update(deltaMs: number, activeEnemies: number): void {
    if (this.completed) return;
    // 失焦恢复时只推进一个有限时间片，避免整关 Wave 同帧爆发。
    const stepMs = Math.min(100, Math.max(0, deltaMs));
    this.elapsedMs += stepMs;
    if (
      !this.warned &&
      this.level.bossId &&
      this.elapsedMs >=
        this.level.durationMs - levelProgressConfig.bossWarningMs
    ) {
      this.warned = true;
      this.onBossWarning();
    }
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
    if (this.idleMs < Math.round(IDLE_FILL_MS / this.difficulty.spawnDensity))
      return;
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
    this.spawn(fillerId, GAME_WIDTH * left, -24, true);
    this.spawn(fillerId, GAME_WIDTH * (1 - left), -24, true);
  }
}
