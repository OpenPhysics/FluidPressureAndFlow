/**
 * spline.test.ts
 *
 * The spline is what turns seven draggable handles into a smooth pipe wall, and
 * everything downstream — cross-sectional area, speed, pressure — is computed
 * from its output. These tests pin interpolation, the natural end condition, and
 * the clamping outside the knot range.
 */

import { describe, expect, it } from "vitest";
import { CubicSpline } from "../../src/flow/model/spline.js";

describe("CubicSpline", () => {
  it("passes exactly through every knot", () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = [0, 2, -1, 3, 1];
    const spline = new CubicSpline(xs, ys);
    xs.forEach((x, i) => {
      expect(spline.evaluate(x)).toBeCloseTo(ys[i] as number, 9);
    });
  });

  it("reproduces a straight line exactly", () => {
    const spline = new CubicSpline([0, 1, 2, 3], [1, 3, 5, 7]);
    expect(spline.evaluate(0.5)).toBeCloseTo(2, 9);
    expect(spline.evaluate(2.25)).toBeCloseTo(5.5, 9);
  });

  it("reproduces a constant exactly, so a uniform pipe stays uniform", () => {
    const spline = new CubicSpline([-6, -4, -2, 0, 2, 4, 6], new Array(7).fill(-3));
    for (const x of [-5, -1.3, 0, 3.7, 5.9]) {
      expect(spline.evaluate(x)).toBeCloseTo(-3, 9);
    }
  });

  it("is continuous across knots", () => {
    const spline = new CubicSpline([0, 1, 2, 3], [0, 5, -5, 0]);
    const epsilon = 1e-6;
    expect(spline.evaluate(1 - epsilon)).toBeCloseTo(spline.evaluate(1 + epsilon), 4);
    expect(spline.evaluate(2 - epsilon)).toBeCloseTo(spline.evaluate(2 + epsilon), 4);
  });

  it("clamps to the end knots outside the range", () => {
    const spline = new CubicSpline([0, 1, 2], [4, 5, 6]);
    expect(spline.evaluate(-10)).toBe(4);
    expect(spline.evaluate(10)).toBe(6);
  });

  it("stays between neighbouring knots on a monotone rise", () => {
    const spline = new CubicSpline([0, 1, 2, 3], [0, 1, 2, 3]);
    const midpoint = spline.evaluate(1.5);
    expect(midpoint).toBeGreaterThan(1);
    expect(midpoint).toBeLessThan(2);
  });

  it("rejects mismatched or too-short knot arrays", () => {
    expect(() => new CubicSpline([0, 1], [0])).toThrow();
    expect(() => new CubicSpline([0], [0])).toThrow();
  });
});
