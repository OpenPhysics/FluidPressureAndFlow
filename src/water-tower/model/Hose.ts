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

/** Radius of the hose bore represented by the model, metres. */
export const HOSE_RADIUS = 0.4;

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

  /**
   * Whether a model point lies in the water-filled hose.
   *
   * The view and the model use the same quadratic sag followed by the short
   * straight nozzle. Keeping this test in the model prevents a barometer from
   * treating water inside the hose as open air (upstream issue #322).
   */
  public containsPoint(attachment: Vector2, x: number, y: number): boolean {
    if (!this.isEnabledProperty.value) {
      return false;
    }
    const outlet = this.getOutletPosition();
    const nozzleLength = 2.4;
    const direction = this.getDirection();
    const bend = outlet.minus(direction.timesScalar(nozzleLength));
    const control = new Vector2(bend.x, Math.min(attachment.y, bend.y) - 1);
    let previous = attachment;
    const samples = 24;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const inverseT = 1 - t;
      const current = attachment
        .timesScalar(inverseT * inverseT)
        .plus(control.timesScalar(2 * inverseT * t))
        .plus(bend.timesScalar(t * t));
      if (distanceToSegmentSquared(x, y, previous, current) <= HOSE_RADIUS * HOSE_RADIUS) {
        return true;
      }
      previous = current;
    }
    return distanceToSegmentSquared(x, y, bend, outlet) <= HOSE_RADIUS * HOSE_RADIUS;
  }

  public reset(): void {
    this.isEnabledProperty.reset();
    this.outletYProperty.reset();
    this.angleProperty.reset();
  }
}

function distanceToSegmentSquared(x: number, y: number, start: Vector2, end: Vector2): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;
  return (x - closestX) ** 2 + (y - closestY) ** 2;
}
