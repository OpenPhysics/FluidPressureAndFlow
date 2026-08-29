/**
 * FaucetModel.ts
 *
 * One tap — either the one filling a pool from above or the drain emptying it
 * from below.
 *
 * The flow rate is a fraction of maximum rather than a volumetric rate, because
 * what the student is manipulating is the handle position. The pool turns that
 * fraction into a change in water level; how fast that happens is a tuning
 * decision belonging to the pool, not to the tap.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";

export class FaucetModel {
  /** Handle position, 0 (closed) to 1 (fully open). */
  public readonly flowRateProperty = new NumberProperty(0);

  /**
   * Whether the tap responds to input. The fill tap goes dead when the pool is
   * full and the drain when it is empty, so the handle cannot be left open
   * against a tap that visibly does nothing.
   */
  public readonly isEnabledProperty = new BooleanProperty(true);

  public constructor() {
    // A tap that becomes disabled must also shut off, otherwise it would resume
    // at its old rate the moment the pool has room again.
    this.isEnabledProperty.link((isEnabled) => {
      if (!isEnabled) {
        this.flowRateProperty.value = 0;
      }
    });
  }

  public reset(): void {
    this.flowRateProperty.reset();
    this.isEnabledProperty.reset();
  }
}
