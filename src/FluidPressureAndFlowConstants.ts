/**
 * FluidPressureAndFlowConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Physics / model values use SI units (metres, seconds, kilograms, …);
 *    note the unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in FluidPressureAndFlowColors.ts, not here.
 *
 * Model coordinate convention (all three screens)
 * ───────────────────────────────────────────────
 *  - +x points right, +y points UP, and y = 0 is ground level.
 *  - Pools on the Under Pressure screen therefore occupy y ∈ [-3, 0].
 *  - The ModelViewTransform2 in each ScreenView flips y for the view.
 *
 * Values are taken from the PhET "Fluid Pressure and Flow" Java source and its
 * HTML5 port; see doc/model.md for the provenance of each group.
 */

import { Range } from "scenerystack/dot";
import FluidPressureAndFlowNamespace from "./FluidPressureAndFlowNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Vertical spacing between stacked control panels along the right edge. */
export const PANEL_SPACING = 8;

// ── Gravity (m/s²) ────────────────────────────────────────────────────────────

/** Surface gravity of Earth. The default for every screen. */
export const EARTH_GRAVITY = 9.8;

/** Surface gravity of Mars — the low end of the gravity slider. */
export const MARS_GRAVITY = 3.71;

/** Surface gravity of Jupiter — the high end of the gravity slider. */
export const JUPITER_GRAVITY = 24.79;

/** Range spanned by the gravity slider, labelled Mars / Earth / Jupiter. */
export const GRAVITY_RANGE = new Range(MARS_GRAVITY, JUPITER_GRAVITY);

// ── Fluid density (kg/m³) ─────────────────────────────────────────────────────

/** Density of gasoline — the low end of the fluid-density slider. */
export const GASOLINE_DENSITY = 700;

/** Density of water. The default for every screen. */
export const WATER_DENSITY = 1000;

/** Density of honey — the high end of the fluid-density slider. */
export const HONEY_DENSITY = 1420;

/** Range spanned by the fluid-density slider, labelled gasoline / water / honey. */
export const DENSITY_RANGE = new Range(GASOLINE_DENSITY, HONEY_DENSITY);

// ── Atmospheric pressure (Pa) ─────────────────────────────────────────────────

/** Standard atmospheric pressure at sea level (y = 0). */
export const EARTH_AIR_PRESSURE = 101325;

/**
 * Atmospheric pressure at the top of the modelled air column.
 * PhET names this constant "at 500 ft" but interpolates it over 0–150 m; the
 * discrepancy is inherited deliberately so readouts match upstream. See
 * doc/model.md § "Known simplifications".
 */
export const AIR_PRESSURE_AT_MAX_ALTITUDE = 99490;

/** Altitude (m) at which the air pressure reaches AIR_PRESSURE_AT_MAX_ALTITUDE. */
export const MAX_MODELLED_ALTITUDE = 150;

// ── Pressure readout ──────────────────────────────────────────────────────────

/** Range of the barometer dial (Pa). Values outside it peg the needle. */
export const PRESSURE_RANGE = new Range(50000, 250000);

// ── Under Pressure screen ─────────────────────────────────────────────────────

/** Depth (m) of every pool on the Under Pressure screen. */
export const MAX_POOL_HEIGHT = 3;

/** Number of barometers available on the Under Pressure screen. */
export const NUMBER_OF_BAROMETERS = 4;

// ── Flow screen ───────────────────────────────────────────────────────────────

/**
 * Range of the pipe flow-rate slider, in m³/s. Displayed as 1000–10000 L/s.
 * The upper bound is held down deliberately: a faster flow through a narrow
 * pipe drives Bernoulli's -½ρv² term below zero. See doc/model.md.
 */
export const FLOW_RATE_RANGE = new Range(1, 10);

/** Initial pipe flow rate (m³/s), i.e. 5000 L/s. */
export const DEFAULT_FLOW_RATE = 5;

// ── Time stepping ─────────────────────────────────────────────────────────────

/**
 * Largest dt (s) any screen will integrate in one call. Browser tab switches and
 * slow frames produce huge dt values that would otherwise tunnel particles
 * straight through the pipe or the water tower wall.
 */
export const MAX_DT = 0.04;

/** Multiplier applied to dt when the user selects "Slow Motion". */
export const SLOW_MOTION_FACTOR = 0.33;

FluidPressureAndFlowNamespace.register("FluidPressureAndFlowConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PANEL_SPACING,
  EARTH_GRAVITY,
  MARS_GRAVITY,
  JUPITER_GRAVITY,
  GRAVITY_RANGE,
  GASOLINE_DENSITY,
  WATER_DENSITY,
  HONEY_DENSITY,
  DENSITY_RANGE,
  EARTH_AIR_PRESSURE,
  AIR_PRESSURE_AT_MAX_ALTITUDE,
  MAX_MODELLED_ALTITUDE,
  PRESSURE_RANGE,
  MAX_POOL_HEIGHT,
  NUMBER_OF_BAROMETERS,
  FLOW_RATE_RANGE,
  DEFAULT_FLOW_RATE,
  MAX_DT,
  SLOW_MOTION_FACTOR,
});
