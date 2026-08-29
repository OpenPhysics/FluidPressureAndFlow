/**
 * PoolScene.ts
 *
 * The four vessels the student can switch between on the Under Pressure screen.
 * Each one isolates a different variable in `p = p₀ + ρgh`:
 *
 *  - SQUARE    — the plain case. Depth is the only thing that varies.
 *  - TRAPEZOID — two chambers of very different width sharing one water body,
 *                so equal depths read equal pressures however the walls slope.
 *  - CHAMBER   — a Pascal's-principle press: weight on a narrow column lifts a
 *                wide one.
 *  - MYSTERY   — the square pool with the fluid density or gravity hidden, so
 *                the student has to solve for it from the barometer.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

/**
 * The localized name of each scene, keyed by scene. Any object exposing these
 * four StringProperties satisfies this — in practice the `scenes` string group
 * from StringManager. Passed in at the call site so this module stays free of
 * the i18n system.
 */
export type PoolSceneLabelProperties = {
  readonly squareStringProperty: TReadOnlyProperty<string>;
  readonly trapezoidStringProperty: TReadOnlyProperty<string>;
  readonly chamberStringProperty: TReadOnlyProperty<string>;
  readonly mysteryStringProperty: TReadOnlyProperty<string>;
};

export class PoolScene extends EnumerationValue {
  public static readonly SQUARE = new PoolScene();
  public static readonly TRAPEZOID = new PoolScene();
  public static readonly CHAMBER = new PoolScene();
  public static readonly MYSTERY = new PoolScene();

  public static readonly enumeration = new Enumeration(PoolScene);

  /**
   * The localized name of this scene.
   *
   * @param labels - the `scenes` string group from StringManager
   */
  public labelStringProperty(labels: PoolSceneLabelProperties): TReadOnlyProperty<string> {
    return this === PoolScene.SQUARE
      ? labels.squareStringProperty
      : this === PoolScene.TRAPEZOID
        ? labels.trapezoidStringProperty
        : this === PoolScene.CHAMBER
          ? labels.chamberStringProperty
          : labels.mysteryStringProperty;
  }
}
