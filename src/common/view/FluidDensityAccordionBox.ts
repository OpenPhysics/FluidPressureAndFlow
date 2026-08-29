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
import { Text } from "scenerystack/scenery";
import { AccordionBox } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import {
  DENSITY_RANGE,
  GASOLINE_DENSITY,
  HONEY_DENSITY,
  PANEL_CORNER_RADIUS,
  WATER_DENSITY,
} from "../../FluidPressureAndFlowConstants.js";
import type { UnitLabelGroups, UnitSystem } from "../model/units.js";
import { UnitSlider } from "./UnitSlider.js";

export type FluidDensityLabels = {
  readonly fluidDensityStringProperty: TReadOnlyProperty<string>;
  readonly gasolineStringProperty: TReadOnlyProperty<string>;
  readonly waterStringProperty: TReadOnlyProperty<string>;
  readonly honeyStringProperty: TReadOnlyProperty<string>;
};

export class FluidDensityAccordionBox extends AccordionBox {
  public constructor(
    fluidDensityProperty: NumberProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    labels: FluidDensityLabels,
    accessibleName: TReadOnlyProperty<string>,
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
      titleNode: new Text(labels.fluidDensityStringProperty, {
        font: "bold 13px sans-serif",
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: 150,
      }),
      expandedDefaultValue: false,
      titleAlignX: "left",
      cornerRadius: PANEL_CORNER_RADIUS,
      fill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
      stroke: FluidPressureAndFlowColors.panelBorderColorProperty,
      contentXMargin: 10,
      contentYMargin: 8,
      buttonXMargin: 8,
      buttonYMargin: 6,
      expandCollapseButtonOptions: { sideLength: 16 },
    });
  }
}
