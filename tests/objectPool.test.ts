import { describe, expect, it } from 'vitest';
import { ObjectPool, type Poolable } from '../src/game/utils/ObjectPool';

class PooledItem implements Poolable {
  active = false;

  deactivate(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}

describe('ObjectPool', () => {
  it('reuses a released object without creating another one', () => {
    const pool = new ObjectPool(() => new PooledItem(), 1);
    const first = pool.acquire();
    first.active = true;
    pool.release(first);

    expect(first.isActive()).toBe(false);
    expect(pool.acquire()).toBe(first);
    expect(pool.createdCount).toBe(1);
  });
});
