export interface BossVisualConfig {
  /** 引擎火焰 x 偏移列表 */
  engineOffsets: number[];
  engineY: number;
  engineCoreY: number;
  /** 左右机翼装饰 x 偏移 */
  wingX: [number, number];
  wingY: number;
  wingColor: number;
  /** 机翼高光条 x 偏移 */
  highlightOffsets: number[];
  highlightY: number;
  highlightColor: number;
  /** 炮塔 x 偏移（空数组不显示炮塔） */
  turretOffsets: number[];
  turretY: number;
  turretStrokeColor: number;
  /** 核心位置与尺寸 */
  coreY: number;
  coreRadius: number;
  /** 核心颜色：[常规阶段, 第三阶段] */
  coreColors: [number, number];
  /** 第三阶段机体染色 */
  phase3Tint: number;
}

/** 单个技能的调度配置 */
export interface BossAttack {
  /** 技能实现 id（BossSkills 注册表） */
  id: string;
  /** 三阶段各自的施放间隔（毫秒） */
  intervalMs: readonly [number, number, number];
  /** 解锁阶段（1-3） */
  unlockPhase: number;
  /** 解锁后首次施放的等待时间；不设置时使用该阶段完整间隔 */
  firstCastDelayMs?: number;
}

export interface BossConfig {
  id: string;
  name: string;
  maxHp: number;
  phase2Threshold: number;
  phase3Threshold: number;
  enterMs: number;
  transitionMs: number;
  deathMs: number;
  /** 技能表：每个 Boss 拥有完全不同的技能组合 */
  attacks: BossAttack[];
  /** 机体整体显示倍率（营造巨物压迫感） */
  displayScale: number;
  /** 周期性全额挡伤，持续时间包含在刷新周期内 */
  protectionShield?: { durationMs: number; refreshMs: number };
  visual: BossVisualConfig;
}
