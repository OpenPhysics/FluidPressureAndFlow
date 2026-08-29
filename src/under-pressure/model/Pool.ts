/**
 * Pool.ts
 *
 * Base class for the four vessels on the Under Pressure screen.
 *
 * Every pool answers the same question — what is the pressure at (x, y)? — and
 * the answer always has the same three-way shape:
 *
 *   above ground              → air pressure at that altitude
 *   underground, outside      → nothing; the barometer shows a dash
 *   underground, in the water → air pressure at the free surface, plus ρgh
 *
 * Only the *geometry* differs between pools, so that three-way logic lives here
 * once and subclasses supply two things: the container outline, and where the
 * free surface sits above a given x. Upstream repeats the branch verbatim in
 * every pool (phetsims/fluid-pressure-and-flow#331).
 *
 * Shapes are cached rather than rebuilt per call. Two of the pools union and
 * intersect polygons to get their outline, and `getPressureAt` runs for every
 * active barometer on every frame — rebuilding there would put polygon boolean
 * arithmetic in the inner loop for no benefit, since the container never changes
 * at all and the water changes only when the level does.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { Shape } from "scenerystack/kite";

/**
 * What a pool needs to know about its surroundings in order to report a
 * pressure. Supplied by the screen model; passed explicitly rather than held as
 * a back-reference so pools stay directly unit-testable.
 */
export type PressureContext = {
  /** Air pressure (Pa) at the given altitude in metres; 0 when the atmosphere is off. */
  getAirPressure(altitude: number): number;

  /** Density of the working fluid, kg/m³. */
  readonly fluidDensity: number;

  /** Acceleration due to gravity, m/s². */
  readonly gravity: number;
};

export abstract class Pool {
  /** Outline of the water currently in the vessel. Views link to this directly. */
  public abstract readonly waterShapeProperty: TReadOnlyProperty<Shape>;

  /** Built once on first use; the container outline never changes. */
  private cachedContainerShape: Shape | null = null;

  /** Builds the vessel outline, water or no water. Model coordinates, metres. */
  protected abstract createContainerShape(): Shape;

  /** Outline of the vessel, water or no water. */
  public getContainerShape(): Shape {
    this.cachedContainerShape ??= this.createContainerShape();
    return this.cachedContainerShape;
  }

  /**
   * The x-ranges (metres) where this vessel actually breaks the surface.
   *
   * Not the same as the container's overall extent: the trapezoid and chamber
   * pools each open in two separate places with solid ground between them, and
   * the view needs that distinction to lay the grass. Returning bounds instead
   * would leave a strip of earth floating over nothing.
   */
  public abstract getGroundOpenings(): ReadonlyArray<{ readonly minX: number; readonly maxX: number }>;

  /**
   * Altitude (m) of the free surface that sets the pressure at the given x — the
   * water level a barometer at that x is measuring down from.
   *
   * Not always the surface directly overhead: in the chamber pool the two
   * columns sit at different heights, and it is the higher one that fixes the
   * pressure throughout the connected fluid. See {@link ChamberPoolModel}.
   */
  public abstract getPressureSurfaceY(x: number): number;

  /**
   * Pressure at a point, or `null` where pressure is undefined — that is,
   * underground but outside the vessel, where the model has nothing to say.
   *
   * @param x - metres, +x to the right
   * @param y - metres, +y up, 0 at ground level
   */
  public getPressureAt(x: number, y: number, context: PressureContext): number | null {
    if (y >= 0) {
      return context.getAirPressure(y);
    }

    const point = new Vector2(x, y);
    if (!this.getContainerShape().containsPoint(point)) {
      return null;
    }

    // In the vessel but above the water: still just air, which is what makes the
    // reading continuous as a barometer is lowered through the surface.
    if (!this.waterShapeProperty.value.containsPoint(point)) {
      return context.getAirPressure(y);
    }

    const surfaceY = this.getPressureSurfaceY(x);
    return context.getAirPressure(surfaceY) + context.fluidDensity * context.gravity * (surfaceY - y);
  }

  /**
   * Advances any dynamics this pool has.
   *
   * The context comes in because the chamber pool's masses respond to gravity
   * and to the density of the fluid holding them up; the other pools ignore it.
   */
  public step(_dt: number, _context: PressureContext): void {
    // Most pools have no dynamics; PoolWithFaucetsModel and ChamberPoolModel override.
  }

  public abstract reset(): void;
}
