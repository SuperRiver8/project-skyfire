export abstract class BaseWeapon {
  abstract readonly id: string;
  level = 1;
  protected cooldownMs = 0;

  protected abstract get fireIntervalMs(): number;
  abstract fire(): void;

  update(deltaMs: number): void {
    this.cooldownMs -= Math.max(0, deltaMs);
    if (this.cooldownMs <= 0) {
      this.fire();
      this.cooldownMs += this.fireIntervalMs;
    }
  }

  canUpgrade(): boolean {
    return false;
  }

  upgrade(): void {
    // 武器升级在 Milestone 7 接入，这里先保留统一接口。
  }

  destroy(): void {
    // 无独立资源的武器无需清理；具体武器可以覆写。
  }
}
