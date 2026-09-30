import { expect, it } from 'vitest';
import { PeriodicShield } from '../src/game/bosses/PeriodicShield';

it('blocks for three seconds in each five-second cycle with stable boundaries', () => {
  const shield = new PeriodicShield({ durationMs: 3_000, refreshMs: 5_000 });
  expect(shield.active).toBe(true);
  shield.update(2_999);
  expect(shield.active).toBe(true);
  shield.update(1);
  expect(shield.active).toBe(false);
  shield.update(1_999);
  expect(shield.active).toBe(false);
  shield.update(1);
  expect(shield.active).toBe(true);
  shield.update(0);
  expect(shield.active).toBe(true);
  shield.update(13_000);
  expect(shield.active).toBe(false);
});
