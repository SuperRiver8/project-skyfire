export interface ArcTarget {
  x: number;
  y: number;
  aiType?: string;
}

export function selectArcTargets<T extends ArcTarget>(
  enemies: Iterable<T>,
  x: number,
  y: number,
  range: number,
  limit: number,
): T[] {
  const targets: T[] = [];
  const distances: number[] = [];
  for (const enemy of enemies) {
    if (enemy.aiType !== 'STRAIGHT' && enemy.aiType !== 'ZIGZAG') continue;
    const distance = Math.hypot(enemy.x - x, enemy.y - y);
    if (!(distance <= range)) continue;
    // 限制有序列表长度；相同距离维持敌机入场顺序。
    let index = 0;
    while (index < distances.length && distances[index] <= distance) index += 1;
    if (index >= limit) continue;
    targets.splice(index, 0, enemy);
    distances.splice(index, 0, distance);
    if (targets.length > limit) {
      targets.pop();
      distances.pop();
    }
  }
  return targets;
}
