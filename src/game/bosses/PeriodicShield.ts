export class PeriodicShield {
  private elapsedMs = 0;

  constructor(
    private readonly config: { durationMs: number; refreshMs: number },
  ) {}

  get active(): boolean {
    return this.elapsedMs < this.config.durationMs;
  }

  update(deltaMs: number): void {
    // 一个周期包括挡伤和可攻击窗口，刷新不受攻击频率或阶段切换影响。
    this.elapsedMs =
      (this.elapsedMs + Math.max(0, deltaMs)) % this.config.refreshMs;
  }
}
