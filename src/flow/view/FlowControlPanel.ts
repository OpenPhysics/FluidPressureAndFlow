/**
 * FlowControlPanel.ts
 *
 * The Flow screen's right-hand panel: the ruler, friction, flux meter and marker
 * dots, and the unit-system chooser.
 *
 * Friction sits with the display toggles rather than with the physics controls
 * because, in this sim, that is honestly what it is: a change to how the tracers
 * move near the wall, not to the pressure or the flux. See doc/model.md and
 * phetsims/fluid-pressure-and-flow#314.
 */

import type { BooleanProperty, EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { HSeparator, Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import type { UnitSystem } from "../../common/model/units.js";
import { UnitsControlPanel, type UnitsControlPanelLabels } from "../../common/view/UnitsControlPanel.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

const LABEL_FONT = "13px sans-serif";

/** Width the panel's contents are held to, so the layout does not jump. */
const CONTENT_WIDTH = 150;

export type FlowControlPanelLabels = UnitsControlPanelLabels & {
  readonly rulerStringProperty: TReadOnlyProperty<string>;
  readonly frictionStringProperty: TReadOnlyProperty<string>;
  readonly fluxMeterStringProperty: TReadOnlyProperty<string>;
  readonly dotsStringProperty: TReadOnlyProperty<string>;
};

export type FlowControlPanelAccessibleNames = {
  readonly rulerCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly frictionCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly fluxMeterCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly dotsCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly unitsControlStringProperty: TReadOnlyProperty<string>;
};

export class FlowControlPanel extends FluidPressureAndFlowPanel {
  public constructor(
    isRulerVisibleProperty: BooleanProperty,
    isFrictionEnabledProperty: BooleanProperty,
    isFluxMeterVisibleProperty: BooleanProperty,
    areDotsVisibleProperty: BooleanProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    labels: FlowControlPanelLabels,
    accessibleNames: FlowControlPanelAccessibleNames,
  ) {
    const checkbox = (
      property: BooleanProperty,
      labelProperty: TReadOnlyProperty<string>,
      accessibleName: TReadOnlyProperty<string>,
    ) =>
      new Checkbox(
        property,
        new Text(labelProperty, {
          font: LABEL_FONT,
          fill: FluidPressureAndFlowColors.textColorProperty,
          maxWidth: CONTENT_WIDTH - 30,
        }),
        { boxWidth: 16, accessibleName: accessibleName },
      );

    super(
      new VBox({
        align: "left",
        spacing: 8,
        children: [
          checkbox(isRulerVisibleProperty, labels.rulerStringProperty, accessibleNames.rulerCheckboxStringProperty),
          checkbox(areDotsVisibleProperty, labels.dotsStringProperty, accessibleNames.dotsCheckboxStringProperty),
          checkbox(
            isFrictionEnabledProperty,
            labels.frictionStringProperty,
            accessibleNames.frictionCheckboxStringProperty,
          ),
          checkbox(
            isFluxMeterVisibleProperty,
            labels.fluxMeterStringProperty,
            accessibleNames.fluxMeterCheckboxStringProperty,
          ),
          new HSeparator({ stroke: FluidPressureAndFlowColors.panelBorderColorProperty }),
          new UnitsControlPanel(unitSystemProperty, labels, accessibleNames.unitsControlStringProperty),
        ],
      }),
      { minWidth: CONTENT_WIDTH },
    );
  }
}
