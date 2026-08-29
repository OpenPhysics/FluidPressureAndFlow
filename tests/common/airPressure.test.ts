/**
 * airPressure.test.ts
 *
 * The air column is a straight line between two anchor points; these tests pin
 * both anchors and the linearity between them, because every pressure the sim
 * reports is offset by this function and a slip here would shift all of them at
 * once without breaking anything visibly.
 */

import { describe, expect, it } from "vitest";
import { getStandardAirPressure } from "../../src/common/model/airPressure.js";
import {
  AIR_PRESSURE_AT_MAX_ALTITUDE,
  EARTH_AIR_PRESSURE,
  MAX_MODELLED_ALTITUDE,
} from "../../src/FluidPressureAndFlowConstants.js";

describe("getStandardAirPressure", () => {
  it("is one standard atmosphere at ground level", () => {
    expect(getStandardAirPressure(0)).toBe(EARTH_AIR_PRESSURE);
  });

  it("reaches the modelled ceiling pressure at the top of the air column", () => {
    expect(getStandardAirPressure(MAX_MODELLED_ALTITUDE)).toBeCloseTo(AIR_PRESSURE_AT_MAX_ALTITUDE, 6);
  });

  it("falls with altitude", () => {
    expect(getStandardAirPressure(10)).toBeLessThan(getStandardAirPressure(0));
  });

  it("is linear, so equal rises give equal drops", () => {
    const dropLow = getStandardAirPressure(0) - getStandardAirPressure(20);
    const dropHigh = getStandardAirPressure(40) - getStandardAirPressure(60);
    expect(dropHigh).toBeCloseTo(dropLow, 9);
  });

  it("extrapolates below ground, so a barometer just under the surface is continuous", () => {
    expect(getStandardAirPressure(-1)).toBeGreaterThan(EARTH_AIR_PRESSURE);
  });
});
