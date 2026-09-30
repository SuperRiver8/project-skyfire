interface Bounds {
  x: number;
  y: number;
  hitboxWidth: number;
  hitboxHeight: number;
}

/** 按纵向分区复用候选数组，保留对象池顺序，不改变穿透子弹的命中顺序。 */
export class SpatialIndex<T extends Bounds> {
  private readonly buckets = new Map<number, number[]>();
  private readonly items: T[] = [];
  private readonly indices: number[] = [];
  private readonly candidates: T[] = [];
  private maxHalfHeight = 0;

  constructor(private readonly cellHeight = 96) {}

  rebuild(items: Iterable<T>): void {
    for (const bucket of this.buckets.values()) bucket.length = 0;
    this.items.length = 0;
    this.maxHalfHeight = 0;
    for (const item of items) {
      const row = Math.floor(item.y / this.cellHeight);
      let bucket = this.buckets.get(row);
      if (!bucket) {
        bucket = [];
        this.buckets.set(row, bucket);
      }
      bucket.push(this.items.length);
      this.items.push(item);
      this.maxHalfHeight = Math.max(this.maxHalfHeight, item.hitboxHeight / 2);
    }
  }

  query(x: number, y: number, width: number, height: number): readonly T[] {
    this.indices.length = 0;
    this.candidates.length = 0;
    const first = Math.floor(
      (y - height / 2 - this.maxHalfHeight) / this.cellHeight,
    );
    const last = Math.floor(
      (y + height / 2 + this.maxHalfHeight) / this.cellHeight,
    );
    for (let row = first; row <= last; row += 1) {
      const bucket = this.buckets.get(row);
      if (!bucket) continue;
      for (const index of bucket) {
        const item = this.items[index];
        if (Math.abs(item.x - x) * 2 <= width + item.hitboxWidth)
          this.indices.push(index);
      }
    }
    this.indices.sort((a, b) => a - b);
    for (const index of this.indices) this.candidates.push(this.items[index]);
    return this.candidates;
  }
}
