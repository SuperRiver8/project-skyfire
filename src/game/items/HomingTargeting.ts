export interface MissileCandidate<T> {
  target: T;
  priority: number;
  distance: number;
  hp: number;
  assigned: number;
}

// 先遵守 Boss / 精英优先级，再把新导弹分给尚未被预定击毁的目标。
export function chooseMissileTarget<T>(
  candidates: readonly MissileCandidate<T>[],
  expectedDamage: number,
): T | undefined {
  const compare = (a: MissileCandidate<T>, b: MissileCandidate<T>) =>
    a.priority - b.priority ||
    a.assigned - b.assigned ||
    a.distance - b.distance;
  let available: MissileCandidate<T> | undefined;
  let fallback: MissileCandidate<T> | undefined;
  // 单次遍历替代复制数组再排序，优先级和分配结果保持一致。
  for (const candidate of candidates) {
    if (!fallback || compare(candidate, fallback) < 0) fallback = candidate;
    if (
      candidate.assigned <
        Math.max(1, Math.ceil(candidate.hp / Math.max(1, expectedDamage))) &&
      (!available || compare(candidate, available) < 0)
    )
      available = candidate;
  }
  return (available ?? fallback)?.target;
}
