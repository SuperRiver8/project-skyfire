/** 只降低装饰特效数量，敌机、子弹、伤害与碰撞保持完整。 */
export class VisualBudget {
  private slowFrames = 0;
  private fastFrames = 0;
  reduced: boolean;
  constructor(
    private readonly mobile = typeof navigator !== 'undefined' &&
      navigator.maxTouchPoints > 0,
  ) {
    this.reduced = mobile;
  }
  update(deltaMs: number): void {
    if (deltaMs > 25) {
      this.slowFrames += 1;
      this.fastFrames = 0;
      if (this.slowFrames >= 20) this.reduced = true;
    } else {
      this.slowFrames = Math.max(0, this.slowFrames - 1);
      if (deltaMs < 20 && ++this.fastFrames >= 180 && !this.mobile)
        this.reduced = false;
    }
  }
  get texts(): number {
    return this.reduced ? 12 : 24;
  }
  get sparks(): number {
    return this.reduced ? 40 : 80;
  }
}
