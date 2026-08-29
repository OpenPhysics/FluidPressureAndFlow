/**
 * PipeCrossSection.ts
 *
 * One slice through the pipe: a fixed x, with the wall's top and bottom y as
 * draggable Properties.
 *
 * The x never moves. Letting the student slide a cross-section along the pipe
 * would let two of them cross over, and a pipe whose wall doubles back has no
 * well-defined cross-sectional area — so the continuity equation, which is the
 * point of the screen, would stop meaning anything.
 */

import { NumberProperty } from "scenerystack/axon";

export class PipeCrossSection {
  /** Distance along the pipe, metres. Fixed for the life of the cross-section. */
  public readonly x: number;

  /** Altitude of the pipe floor at this x, metres. */
  public readonly bottomYProperty: NumberProperty;

  /** Altitude of the pipe ceiling at this x, metres. */
  public readonly topYProperty: NumberProperty;

  public constructor(x: number, bottomY: number, topY: number) {
    this.x = x;
    this.bottomYProperty = new NumberProperty(bottomY, { units: "m" });
    this.topYProperty = new NumberProperty(topY, { units: "m" });
  }

  /** Height of the pipe here, metres. Treated as a diameter by {@link Pipe}. */
  public getHeight(): number {
    return this.topYProperty.value - this.bottomYProperty.value;
  }

  public reset(): void {
    this.bottomYProperty.reset();
    this.topYProperty.reset();
  }
}
