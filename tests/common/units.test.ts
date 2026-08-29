/**
 * units.test.ts
 *
 * Round-trips and reference values for the unit conversions.
 *
 * The round-trip tests catch a factor written the wrong way up — the failure
 * mode that is invisible on screen for quantities whose two systems happen to
 * look similar. The reference values pin the absolute scale against numbers a
 * physics teacher would recognise.
 */

import { describe, expect, it } from "vitest";
import { toDisplayValue, toSIValue, UnitSystem } from "../../src/common/model/units.js";
import { EARTH_AIR_PRESSURE, WATER_DENSITY } from "../../src/FluidPressureAndFlowConstants.js";

const QUANTITIES = ["pressure", "distance", "velocity", "density", "gravity", "flowRate", "flux", "area"] as const;

describe("unit conversions", () => {
  for (const system of UnitSystem.enumeration.values) {
    for (const quantity of QUANTITIES) {
      it(`round-trips ${quantity} through ${UnitSystem.enumeration.getKey(system)}`, () => {
        const conversion = system[quantity];
        expect(toSIValue(conversion, toDisplayValue(conversion, 123.456))).toBeCloseTo(123.456, 9);
      });
    }
  }

  it("shows sea-level air pressure as about 101.325 kPa", () => {
    expect(toDisplayValue(UnitSystem.METRIC.pressure, EARTH_AIR_PRESSURE)).toBeCloseTo(101.325, 3);
  });

  it("shows sea-level air pressure as about one atmosphere", () => {
    expect(toDisplayValue(UnitSystem.ATMOSPHERES.pressure, EARTH_AIR_PRESSURE)).toBeCloseTo(1, 2);
  });

  it("shows sea-level air pressure as about 14.7 psi", () => {
    expect(toDisplayValue(UnitSystem.ENGLISH.pressure, EARTH_AIR_PRESSURE)).toBeCloseTo(14.7, 1);
  });

  it("shows water as about 62.4 lb/ft³", () => {
    expect(toDisplayValue(UnitSystem.ENGLISH.density, WATER_DENSITY)).toBeCloseTo(62.4, 6);
  });

  it("shows a metre as about 3.28 feet", () => {
    expect(toDisplayValue(UnitSystem.ENGLISH.distance, 1)).toBeCloseTo(3.2808399, 6);
  });

  it("leaves metric distance and velocity untouched", () => {
    expect(toDisplayValue(UnitSystem.METRIC.distance, 7)).toBe(7);
    expect(toDisplayValue(UnitSystem.METRIC.velocity, 7)).toBe(7);
  });

  it("uses metric lengths even when pressure reads in atmospheres", () => {
    expect(UnitSystem.ATMOSPHERES.distance).toBe(UnitSystem.METRIC.distance);
    expect(UnitSystem.ATMOSPHERES.density).toBe(UnitSystem.METRIC.density);
  });
});
