/**
 * Pipe.test.ts
 *
 * Continuity, and the guard rails around it.
 *
 * The claim the Flow screen makes is that `v · A` is the same everywhere in the
 * pipe. These tests check that it holds in a uniform pipe, in a deformed one,
 * and after the flow rate changes — and that the minimum-height clamp that keeps
 * Bernoulli in its domain actually holds.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { MIN_PIPE_HEIGHT, Pipe } from "../../src/flow/model/Pipe.js";

describe("Pipe", () => {
  let pipe: Pipe;

  beforeEach(() => {
    pipe = new Pipe();
  });

  it("starts as a uniform two-metre-tall duct", () => {
    for (const x of [-5, -2, 0, 3, 5]) {
      const section = pipe.getCrossSectionAt(x);
      expect(section.topY - section.bottomY).toBeCloseTo(2, 6);
    }
  });

  it("keeps v·A constant along a uniform pipe", () => {
    const reference = pipe.getSpeed(0) * pipe.getCrossSectionalArea(0);
    for (const x of [-5, -2, 2, 5]) {
      expect(pipe.getSpeed(x) * pipe.getCrossSectionalArea(x)).toBeCloseTo(reference, 6);
    }
  });

  it("keeps v·A constant after the pipe is deformed", () => {
    const middle = pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    middle.topYProperty.value = -2.2;
    middle.bottomYProperty.value = -2.9;

    const flowRate = pipe.flowRateProperty.value;
    for (const x of [-4, -1, 0, 1, 4]) {
      expect(pipe.getSpeed(x) * pipe.getCrossSectionalArea(x)).toBeCloseTo(flowRate, 6);
    }
  });

  it("speeds the fluid up where the pipe is narrower", () => {
    const middle = pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    const wideSpeed = pipe.getSpeed(0);
    middle.topYProperty.value = -2.0;
    expect(pipe.getSpeed(0)).toBeGreaterThan(wideSpeed);
  });

  it("scales speed with the flow rate", () => {
    const before = pipe.getSpeed(0);
    pipe.flowRateProperty.value *= 2;
    expect(pipe.getSpeed(0)).toBeCloseTo(2 * before, 6);
  });

  it("never lets the wall close below the minimum height", () => {
    // Drive both handles to the same y; the spline must still be pushed apart.
    for (const section of pipe.crossSections) {
      section.topYProperty.value = -2;
      section.bottomYProperty.value = -2;
    }
    for (const sample of pipe.getWall()) {
      expect(sample.topY - sample.bottomY).toBeGreaterThanOrEqual(MIN_PIPE_HEIGHT - 1e-9);
    }
  });

  it("reports a point inside the pipe as inside, and one above ground as outside", () => {
    expect(pipe.containsPoint(0, -2)).toBe(true);
    expect(pipe.containsPoint(0, 5)).toBe(false);
  });

  it("maps fraction-to-top and back consistently", () => {
    const y = pipe.fractionToY(1.5, 0.25);
    expect(pipe.getFractionToTop(1.5, y)).toBeCloseTo(0.25, 6);
  });

  describe("friction", () => {
    it("does not change the speed at the centreline", () => {
      const centreY = pipe.fractionToY(0, 0.5);
      const withoutFriction = pipe.getTweakedVx(0, centreY);
      pipe.isFrictionEnabledProperty.value = true;
      expect(pipe.getTweakedVx(0, centreY)).toBeCloseTo(withoutFriction, 6);
    });

    it("slows particles near the wall", () => {
      pipe.isFrictionEnabledProperty.value = true;
      const centre = pipe.getTweakedVx(0, pipe.fractionToY(0, 0.5));
      const nearWall = pipe.getTweakedVx(0, pipe.fractionToY(0, 0.9));
      expect(nearWall).toBeLessThan(centre);
      expect(nearWall).toBeGreaterThan(0);
    });

    it("leaves the flux unchanged, which is the known divergence from viscosity", () => {
      // Documented in doc/model.md and upstream as phetsims/…#314: the friction
      // checkbox is a velocity profile only. This test pins the current
      // behaviour so a future fix is a deliberate change, not an accident.
      const areaBefore = pipe.getCrossSectionalArea(0);
      const speedBefore = pipe.getSpeed(0);
      pipe.isFrictionEnabledProperty.value = true;
      expect(pipe.getCrossSectionalArea(0)).toBeCloseTo(areaBefore, 9);
      expect(pipe.getSpeed(0)).toBeCloseTo(speedBefore, 9);
    });
  });

  it("restores the initial shape on reset", () => {
    const middle = pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    middle.topYProperty.value = -1.5;
    pipe.flowRateProperty.value = 9;
    pipe.reset();
    expect(middle.topYProperty.value).toBe(-1);
    expect(pipe.getCrossSectionAt(0).topY - pipe.getCrossSectionAt(0).bottomY).toBeCloseTo(2, 6);
  });
});
