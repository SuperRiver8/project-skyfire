export interface Poolable {
  deactivate(): void;
  isActive(): boolean;
}

export class ObjectPool<T extends Poolable> {
  private readonly available: T[] = [];
  private readonly active = new Set<T>();
  private readonly all: T[] = [];

  constructor(
    private readonly factory: () => T,
    initialSize: number,
  ) {
    for (let index = 0; index < initialSize; index += 1) {
      this.available.push(this.create());
    }
  }

  acquire(): T {
    const item = this.available.pop() ?? this.create();
    this.active.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.active.delete(item)) return;
    item.deactivate();
    this.available.push(item);
  }

  activeItems(): Iterable<T> {
    return this.active;
  }

  allItems(): Iterable<T> {
    return this.all;
  }

  get activeCount(): number {
    return this.active.size;
  }

  get createdCount(): number {
    return this.all.length;
  }

  private create(): T {
    const item = this.factory();
    this.all.push(item);
    return item;
  }
}
