/**
 * GravityAccordionBox.ts
 *
 * The gravity slider, in an accordion box. Only the Under Pressure
 * screen has one.
 *
 * Gravity is deliberately absent from the other two screens. On the Water Tower
 * screen that is a design decision from PhET's original design document: the
 * student is meant to be able to *measure* g from the efflux speed and the drop
 * height, which they cannot do if the sim hands it to them on a slider.
 *
 * The range runs from Mars to Jupiter, with Earth marked. Real planets rather
 * than a bare 1–20 scale, so that "more gravity" has somewhere to stand.
 */

import type { EnumerationProperty, NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Text } from "scenerystack/scenery";
import { AccordionBox } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import {
  EARTH_GRAVITY,
  GRAVITY_RANGE,
  JUPITER_GRAVITY,
  MARS_GRAVITY,
  PANEL_CORNER_RADIUS,
} from "../../FluidPressureAndFlowConstants.js";
import type { UnitLabelGroups, UnitSystem } from "../model/units.js";
import { ACCORDION_BOX_SHRINK_WHEN_COLLAPSED } from "./pinAccordionBox.js";
import { UnitSlider } from "./UnitSlider.js";

export type GravityLabels = {
  readonly gravityStringProperty: TReadOnlyProperty<string>;
  readonly marsStringProperty: TReadOnlyProperty<string>;
  readonly earthStringProperty: TReadOnlyProperty<string>;
  readonly jupiterStringProperty: TReadOnlyProperty<string>;
};

export class GravityAccordionBox extends AccordionBox {
  public constructor(
    gravityProperty: NumberProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    labels: GravityLabels,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    const slider = new UnitSlider(gravityProperty, GRAVITY_RANGE, unitSystemProperty, {
      conversionFor: (system) => system.gravity,
      unitsLabelFor: (system) => system.labels(unitLabelGroups).gravityStringProperty,
      majorTicks: [
        { value: MARS_GRAVITY, labelProperty: labels.marsStringProperty },
        { value: EARTH_GRAVITY, labelProperty: labels.earthStringProperty },
        { value: JUPITER_GRAVITY, labelProperty: labels.jupiterStringProperty },
      ],
      accessibleName: accessibleName,
    });

    super(slider, {
      titleNode: new Text(labels.gravityStringProperty, {
        font: "bold 13px sans-serif",
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: 150,
      }),
      ...ACCORDION_BOX_SHRINK_WHEN_COLLAPSED,
      // Under Pressure is the only screen with this box, and gravity is one of
      // the two quantities the screen exists to let a student vary.
      expandedDefaultValue: true,
      titleAlignX: "center",
      cornerRadius: PANEL_CORNER_RADIUS,
      fill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
      stroke: FluidPressureAndFlowColors.panelBorderColorProperty,
      contentXMargin: 10,
      contentYMargin: 5,
      buttonXMargin: 8,
      buttonYMargin: 4,
      expandCollapseButtonOptions: { sideLength: 16 },
    });
  }
}
