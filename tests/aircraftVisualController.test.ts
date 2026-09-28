import { describe, expect, it } from 'vitest';
import { aircraftVisuals } from '../src/config/aircraft/aircraftVisuals';
import { AircraftVisualController } from '../src/game/aircraft/AircraftVisualController';

describe('aircraft visual controller', () => {
  it('banks by real velocity and returns smoothly with mirrored wings and shadow', () => {
    const visual = new AircraftVisualController(aircraftVisuals.player);
    const left = visual.update(100, -300);
    expect(left.roll).toBeLessThan(0);
    expect(left.leftWingScaleX).toBeLessThan(left.rightWingScaleX);
    expect(left.shadowX).toBeGreaterThan(0);
    expect(left.flameX).toBeGreaterThan(0);
    const returning = visual.update(16, 0);
    expect(returning.roll).toBeLessThan(0);
    expect(Math.abs(returning.roll)).toBeLessThan(Math.abs(left.roll));
    visual.reset();
    const right = visual.update(100, 300);
    expect(right.roll).toBeGreaterThan(0);
    expect(right.leftWingScaleX).toBeGreaterThan(right.rightWingScaleX);
    expect(right.shadowX).toBeLessThan(0);
  });

  it('keeps heavy and boss rolls smaller and slower than light aircraft', () => {
    const light = new AircraftVisualController(aircraftVisuals.light);
    const heavy = new AircraftVisualController(aircraftVisuals.heavy);
    const boss = new AircraftVisualController(aircraftVisuals.boss);
    expect(light.update(120, 210).roll).toBeGreaterThan(
      heavy.update(120, 95).roll,
    );
    expect(heavy.update(120, 95).roll).toBeGreaterThan(
      boss.update(120, 210).roll,
    );
  });
});
