/**
 * Hose.ts
 *
 * An optional hose plugged into the hole in the tank, ending in a nozzle the
 * student can raise, lower and aim.
 *
 * Its purpose is to separate two things the bare hole conflates. Without the
 * hose, the outlet is fixed to the tank, so raising the tank raises both the
 * water and the outlet and the head barely changes. With it, the outlet stays
 * where the student put it while the tank moves — so the head, and only the
 * head, is what varies. Aiming the nozzle then turns the jet into a projectile
 * whose range can be measured against `v = √(2gh)`.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";

/** Where the nozzle sits horizontally, metres. Far enough out to see the whole arc. */
export const HOSE_OUTLET_X = 17;

/** Highest the nozzle may be raised, metres. */
export const MAX_HOSE_OUTLET_Y = 14;

/** Angle straight up, radians. Zero is horizontal, to the right. */
const INITIAL_ANGLE = Math.PI / 2;

export class Hose {
  /** Whether the hose is attached. */
  public readonly isEnabledProperty = new BooleanProperty(false);

  /** Altitude of the nozzle's mouth, metres. */
  public readonly outletYProperty = new NumberProperty(0, { units: "m" });

  /** Direction the nozzle points, radians. 0 is horizontal-right, π/2 straight up. */
  public readonly angleProperty = new NumberProperty(INITIAL_ANGLE, { units: "radians" });

  /** Where fluid leaves the hose, model coordinates. */
  public getOutletPosition(): Vector2 {
    return new Vector2(HOSE_OUTLET_X, this.outletYProperty.value);
  }

  /** Unit vector the jet leaves along. */
  public getDirection(): Vector2 {
    return Vector2.createPolar(1, this.angleProperty.value);
  }

  public reset(): void {
    this.isEnabledProperty.reset();
    this.outletYProperty.reset();
    this.angleProperty.reset();
  }
}
