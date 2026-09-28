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
  const sorted = [...candidates].sort(
    (a, b) =>
      a.priority - b.priority ||
      a.assigned - b.assigned ||
      a.distance - b.distance,
  );
  return (
    sorted.find(
      (candidate) =>
        candidate.assigned <
        Math.max(1, Math.ceil(candidate.hp / Math.max(1, expectedDamage))),
    ) ?? sorted[0]
  )?.target;
}
