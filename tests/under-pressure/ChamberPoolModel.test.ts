/**
 * ChamberPoolModel.test.ts
 *
 * The hydraulic press. These tests pin the two behaviours the scene exists to
 * show — weight on the narrow column lifts the wide one, and the press returns
 * to level when unloaded — plus the coupling ratio, which is the one number a
 * well-meaning future edit is most likely to "correct" from widths to areas.
 * See doc/model.md for why it is widths.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { EARTH_GRAVITY, WATER_DENSITY } from "../../src/FluidPressureAndFlowConstants.js";
import { ChamberPoolModel } from "../../src/under-pressure/model/ChamberPoolModel.js";
import type { PressureContext } from "../../src/under-pressure/model/Pool.js";

const CONTEXT: PressureContext = {
  getAirPressure: () => 101325,
  fluidDensity: WATER_DENSITY,
  gravity: EARTH_GRAVITY,
};

describe("ChamberPoolModel", () => {
  let pool: ChamberPoolModel;

  beforeEach(() => {
    pool = new ChamberPoolModel();
  });

  it("starts with both columns level", () => {
    expect(pool.getLeftSurfaceY()).toBeCloseTo(pool.getRightSurfaceY(), 9);
  });

  it("raises the wide column when the narrow one is pushed down", () => {
    const restingRight = pool.getRightSurfaceY();
    pool.leftColumnHeightProperty.value = 0.5;
    expect(pool.getLeftSurfaceY()).toBeLessThan(restingRight);
    expect(pool.getRightSurfaceY()).toBeGreaterThan(restingRight);
  });

  it("moves the wide column by a fifth of the narrow one's displacement", () => {
    // The openings are 0.5 m and 2.5 m wide, so the ratio is 5:1.
    const restingRight = pool.getRightSurfaceY();
    const pushDown = 0.5;
    pool.leftColumnHeightProperty.value = 1 - pushDown;
    expect(pool.getRightSurfaceY() - restingRight).toBeCloseTo(pushDown / 5, 9);
  });

  it("reports the pressure from the higher of the two surfaces", () => {
    pool.leftColumnHeightProperty.value = 0.5;
    expect(pool.getPressureSurfaceY(0)).toBeCloseTo(pool.getRightSurfaceY(), 9);
  });

  it("reads a higher pressure in the loaded press than in the unloaded one", () => {
    const deepPoint = { x: -3, y: -2.5 };
    const unloaded = pool.getPressureAt(deepPoint.x, deepPoint.y, CONTEXT) as number;
    pool.leftColumnHeightProperty.value = 0.5;
    const loaded = pool.getPressureAt(deepPoint.x, deepPoint.y, CONTEXT) as number;
    expect(loaded).toBeGreaterThan(unloaded);
  });

  it("relaxes back toward level once nothing is resting on it", () => {
    pool.leftColumnHeightProperty.value = 0.5;
    const displacementBefore = Math.abs(1 - pool.leftColumnHeightProperty.value);

    for (let i = 0; i < 60; i++) {
      pool.step(1 / 60, CONTEXT);
    }

    const displacementAfter = Math.abs(1 - pool.leftColumnHeightProperty.value);
    expect(displacementAfter).toBeLessThan(displacementBefore);
    expect(pool.getLeftSurfaceY()).toBeCloseTo(pool.getRightSurfaceY(), 2);
  });

  it("drops a released mass toward the ground", () => {
    const mass = pool.masses[0];
    expect(mass).toBeDefined();
    if (!mass) {
      return;
    }
    mass.setBottomY(2);
    const startY = mass.getBottomY();
    for (let i = 0; i < 10; i++) {
      pool.step(1 / 60, CONTEXT);
    }
    expect(mass.getBottomY()).toBeLessThan(startY);
  });

  it("holds a mass the student is dragging", () => {
    const mass = pool.masses[0];
    expect(mass).toBeDefined();
    if (!mass) {
      return;
    }
    mass.setBottomY(2);
    mass.isDraggingProperty.value = true;
    for (let i = 0; i < 10; i++) {
      pool.step(1 / 60, CONTEXT);
    }
    expect(mass.getBottomY()).toBe(2);
  });

  it("pushes the narrow column down when a mass is stacked in the opening", () => {
    const mass = pool.masses[0];
    expect(mass).toBeDefined();
    if (!mass) {
      return;
    }
    // Set the block down on the water in the narrow opening.
    mass.positionProperty.value = mass.positionProperty.value.copy();
    mass.setBottomY(pool.getLeftSurfaceY());
    for (let i = 0; i < 30; i++) {
      pool.step(1 / 60, CONTEXT);
    }
    expect(pool.getLeftSurfaceY()).toBeLessThan(pool.getRightSurfaceY());
  });

  it("resets both columns and every mass", () => {
    const mass = pool.masses[0];
    expect(mass).toBeDefined();
    if (!mass) {
      return;
    }
    const originalY = mass.getBottomY();
    mass.setBottomY(-1);
    pool.leftColumnHeightProperty.value = 0.4;

    pool.reset();

    expect(pool.leftColumnHeightProperty.value).toBe(1);
    expect(mass.getBottomY()).toBe(originalY);
  });
});
