export const Random = {
  float: (): number => Math.random(),
  int: (min: number, max: number): number =>
    min + Math.floor(Math.random() * (max - min + 1)),
  pick: <T>(items: readonly T[]): T =>
    items[Math.floor(Math.random() * items.length)],
  weighted: <T>(items: readonly { value: T; weight: number }[]): T => {
    const total = items.reduce(
      (sum, item) => sum + Math.max(0, item.weight),
      0,
    );
    let roll = Math.random() * total;
    for (const item of items) {
      roll -= Math.max(0, item.weight);
      if (roll < 0) return item.value;
    }
    return items[items.length - 1].value;
  },
};
