/**
 * FaucetMode.ts
 *
 * How the faucet above the tank is controlled.
 *
 *  - MANUAL        — the student sets the inflow by hand, and the level rises or
 *                    falls depending on how it compares with the leak.
 *  - MATCH_LEAKAGE — the inflow tracks whatever is leaving, holding the level
 *                    steady.
 *
 * Match Leakage is the more interesting of the two: with the head held constant,
 * the efflux speed stops changing, and a student can measure the jet at leisure
 * instead of chasing a falling water line. It is also the setting that makes the
 * "speed depends on head, not on how much water" claim checkable at a fixed head.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

/**
 * The localized name of each mode. Any object exposing these two StringProperties
 * satisfies it — in practice the `waterTower` string group from StringManager.
 */
export type FaucetModeLabelProperties = {
  readonly manualStringProperty: TReadOnlyProperty<string>;
  readonly matchLeakageStringProperty: TReadOnlyProperty<string>;
};

export class FaucetMode extends EnumerationValue {
  public static readonly MANUAL = new FaucetMode();
  public static readonly MATCH_LEAKAGE = new FaucetMode();

  public static readonly enumeration = new Enumeration(FaucetMode);

  /** The localized name of this mode. */
  public labelStringProperty(labels: FaucetModeLabelProperties): TReadOnlyProperty<string> {
    return this === FaucetMode.MANUAL ? labels.manualStringProperty : labels.matchLeakageStringProperty;
  }
}
