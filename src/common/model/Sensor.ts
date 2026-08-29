/**
 * Sensor.ts
 *
 * Base class for the draggable instruments the student pulls out of the toolbox:
 * barometers on every screen, speedometers on Flow and Water Tower.
 *
 * A sensor knows only two things — where it is, and what it last read. It never
 * computes its own value; the screen model does that, because only the model
 * knows the pool shape, the pipe geometry or the water column that determines
 * the answer. Keeping the sampling out of the sensor is what lets one class
 * serve all three screens.
 */

import { Property } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";

export abstract class Sensor<T> {
  /**
   * Where the sensor's sampling point sits, in model coordinates (metres).
   * This is the tip of the instrument, not its centre — the view offsets the
   * body so the crosshair lands here.
   */
  public readonly positionProperty: Property<Vector2>;

  /**
   * The most recent reading, or `null` where the quantity is undefined — inside
   * the ground, outside the pipe, or anywhere else the model declines to answer.
   * The view shows a dash for `null` rather than a misleading zero.
   */
  public readonly valueProperty: Property<T | null>;

  /** True while the sensor is out of the toolbox and taking readings. */
  public readonly isActiveProperty: Property<boolean>;

  public constructor(initialPosition: Vector2) {
    this.positionProperty = new Property(initialPosition);
    this.valueProperty = new Property<T | null>(null);
    this.isActiveProperty = new Property(false);
  }

  public reset(): void {
    this.positionProperty.reset();
    this.valueProperty.reset();
    this.isActiveProperty.reset();
  }
}
