import { expect, it } from 'vitest';
import { VisualBudget } from '../src/game/effects/VisualBudget';

it('bounds phone effects and reduces effects after sustained slow frames', () => {
  const mobile = new VisualBudget(true);
  expect(mobile.sparks).toBe(40);
  expect(mobile.texts).toBe(12);
  const desktop = new VisualBudget(false);
  for (let i = 0; i < 20; i += 1) desktop.update(33);
  expect(desktop.sparks).toBe(40);
  for (let i = 0; i < 180; i += 1) desktop.update(16);
  expect(desktop.sparks).toBe(80);
});
