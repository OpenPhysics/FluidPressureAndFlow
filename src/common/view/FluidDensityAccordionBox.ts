/**
 * FluidDensityAccordionBox.ts
 *
 * The fluid-density slider, in a box that starts collapsed.
 *
 * Density is a secondary variable on every screen — the primary story is depth,
 * or the pipe's cross-section, or the height of the tank — so the control folds
 * away until a student goes looking for it. Collapsed, it is a labelled promise
 * that the fluid can be changed; expanded, it is a slider with gasoline, water
 * and honey called out as landmarks so the numbers mean something.
 *
 * PhET's own review of the upstream sim asked for exactly this class and never
 * got it (phetsims/fluid-pressure-and-flow#323); there, the box is assembled
 * inline in each of the three ScreenViews.
 */

import type { EnumerationProperty, NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { AccordionBox } from "scenerystack/sun";
import { DENSITY_RANGE, GASOLINE_DENSITY, HONEY_DENSITY, WATER_DENSITY } from "../../FluidPressureAndFlowConstants.js";
import type { UnitLabelGroups, UnitSystem } from "../model/units.js";
import {
  ACCORDION_BOX_CHROME_OPTIONS,
  ACCORDION_BOX_SHRINK_WHEN_COLLAPSED,
  createAccordionBoxTitle,
} from "./pinAccordionBox.js";
import { UnitSlider } from "./UnitSlider.js";

export type FluidDensityLabels = {
  readonly fluidDensityStringProperty: TReadOnlyProperty<string>;
  readonly gasolineStringProperty: TReadOnlyProperty<string>;
  readonly waterStringProperty: TReadOnlyProperty<string>;
  readonly honeyStringProperty: TReadOnlyProperty<string>;
};

export type FluidDensityAccordionBoxOptions = {
  /**
   * Whether the box starts open. It does on Under Pressure, where density is one
   * of only two things a student can vary and both are meant to be in reach from
   * the first frame. On the other two screens the pipe or the tank is the story,
   * so it stays folded away.
   */
  readonly expandedDefaultValue?: boolean;
};

export class FluidDensityAccordionBox extends AccordionBox {
  public readonly unitSlider: UnitSlider;

  public constructor(
    fluidDensityProperty: NumberProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    labels: FluidDensityLabels,
    accessibleName: TReadOnlyProperty<string>,
    providedOptions?: FluidDensityAccordionBoxOptions,
  ) {
    const slider = new UnitSlider(fluidDensityProperty, DENSITY_RANGE, unitSystemProperty, {
      conversionFor: (system) => system.density,
      unitsLabelFor: (system) => system.labels(unitLabelGroups).densityStringProperty,
      majorTicks: [
        { value: GASOLINE_DENSITY, labelProperty: labels.gasolineStringProperty },
        { value: WATER_DENSITY, labelProperty: labels.waterStringProperty },
        { value: HONEY_DENSITY, labelProperty: labels.honeyStringProperty },
      ],
      accessibleName: accessibleName,
    });

    super(slider, {
      titleNode: createAccordionBoxTitle(labels.fluidDensityStringProperty),
      ...ACCORDION_BOX_SHRINK_WHEN_COLLAPSED,
      ...ACCORDION_BOX_CHROME_OPTIONS,
      expandedDefaultValue: providedOptions?.expandedDefaultValue ?? false,
    });

    this.unitSlider = slider;
  }
}
