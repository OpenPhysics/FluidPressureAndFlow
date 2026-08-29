/**
 * airPressure.ts
 *
 * Atmospheric pressure as a function of altitude.
 *
 * PhET models the air column as a straight line between sea-level pressure and
 * the pressure at the top of the sim's reachable airspace, rather than the true
 * exponential barometric formula. Over the ~30 m of altitude the sim actually
 * exposes, the two agree to well under a readout digit, and the linear form
 * keeps the "air pressure decreases with altitude" learning goal legible.
 *
 * See doc/model.md § "Known simplifications" for the 500 ft / 150 m unit
 * discrepancy inherited from upstream.
 */

import {
  AIR_PRESSURE_AT_MAX_ALTITUDE,
  EARTH_AIR_PRESSURE,
  MAX_MODELLED_ALTITUDE,
} from "../../FluidPressureAndFlowConstants.js";

/** Pressure drop per metre of altitude (Pa/m). Negative: pressure falls as you rise. */
const PRESSURE_GRADIENT = (AIR_PRESSURE_AT_MAX_ALTITUDE - EARTH_AIR_PRESSURE) / MAX_MODELLED_ALTITUDE;

/**
 * Atmospheric pressure at the given altitude.
 *
 * @param altitude - metres above ground level (y = 0); may be negative underground
 * @returns pressure in pascals
 */
export function getStandardAirPressure(altitude: number): number {
  return EARTH_AIR_PRESSURE + PRESSURE_GRADIENT * altitude;
}
