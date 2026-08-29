/**
 * FlowRateAccordionBox.ts
 *
 * The pipe's flow-rate slider, in a box that starts collapsed.
 *
 * Flow rate is the pump setting, not the thing the screen is about: the lesson is
 * that squeezing the pipe speeds the fluid up at a *fixed* Q, so the slider is
 * most useful once a student has already deformed the pipe and wants a second
 * variable. Folded away, it stays discoverable without inviting a student to
 * change two things at once on their first try.
 *
 * No tick labels. PhET's ticks here read "Min" and "Max", which say nothing the
 * slider's own ends do not, and the readout above the track already gives the
 * value in the chosen units.
 */

import type { EnumerationProperty, NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Text } from "scenerystack/scenery";
import { AccordionBox } from "scenerystack/sun";
import type { UnitLabelGroups, UnitSystem } from "../../common/model/units.js";
import { ACCORDION_BOX_SHRINK_WHEN_COLLAPSED } from "../../common/view/pinAccordionBox.js";
import { UnitSlider } from "../../common/view/UnitSlider.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { FLOW_RATE_RANGE, PANEL_CORNER_RADIUS } from "../../FluidPressureAndFlowConstants.js";

export class FlowRateAccordionBox extends AccordionBox {
  public constructor(
    flowRateProperty: NumberProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    titleStringProperty: TReadOnlyProperty<string>,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    const slider = new UnitSlider(flowRateProperty, FLOW_RATE_RANGE, unitSystemProperty, {
      conversionFor: (system) => system.flowRate,
      unitsLabelFor: (system) => system.labels(unitLabelGroups).flowRateStringProperty,
      majorTicks: [],
      accessibleName: accessibleName,
    });

    super(slider, {
      titleNode: new Text(titleStringProperty, {
        font: "bold 13px sans-serif",
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: 150,
      }),
      ...ACCORDION_BOX_SHRINK_WHEN_COLLAPSED,
      expandedDefaultValue: false,
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
