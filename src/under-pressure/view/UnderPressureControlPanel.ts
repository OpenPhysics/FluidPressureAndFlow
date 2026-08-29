/**
 * UnderPressureControlPanel.ts
 *
 * The panel down the right-hand side: the ruler and grid toggles, the atmosphere
 * switch, and the unit-system chooser.
 *
 * The atmosphere switch sits here rather than in Preferences because it is a
 * physics control, not a setting. Turning the air off drops every above-water
 * reading to zero and takes the ~101 kPa offset off the top of the water — which
 * is the most direct way the sim can say "that offset *is* the atmosphere."
 */

import type { BooleanProperty, EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { HSeparator, Text, VBox } from "scenerystack/scenery";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import type { UnitSystem } from "../../common/model/units.js";
import { UnitsControlPanel, type UnitsControlPanelLabels } from "../../common/view/UnitsControlPanel.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

const TITLE_FONT = "bold 13px sans-serif";
const LABEL_FONT = "13px sans-serif";

/** Width the panel's contents are held to, so the layout does not jump. */
const CONTENT_WIDTH = 150;

export type UnderPressureControlPanelLabels = UnitsControlPanelLabels & {
  readonly rulerStringProperty: TReadOnlyProperty<string>;
  readonly gridStringProperty: TReadOnlyProperty<string>;
  readonly atmosphereStringProperty: TReadOnlyProperty<string>;
  readonly onStringProperty: TReadOnlyProperty<string>;
  readonly offStringProperty: TReadOnlyProperty<string>;
};

export type UnderPressureControlPanelAccessibleNames = {
  readonly rulerCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly gridCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly atmosphereControlStringProperty: TReadOnlyProperty<string>;
  readonly unitsControlStringProperty: TReadOnlyProperty<string>;
};

export class UnderPressureControlPanel extends FluidPressureAndFlowPanel {
  public constructor(
    isRulerVisibleProperty: BooleanProperty,
    isGridVisibleProperty: BooleanProperty,
    isAtmosphereProperty: BooleanProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    labels: UnderPressureControlPanelLabels,
    accessibleNames: UnderPressureControlPanelAccessibleNames,
  ) {
    const rulerCheckbox = new Checkbox(
      isRulerVisibleProperty,
      new Text(labels.rulerStringProperty, {
        font: LABEL_FONT,
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: CONTENT_WIDTH - 30,
      }),
      { boxWidth: 16, accessibleName: accessibleNames.rulerCheckboxStringProperty },
    );

    const gridCheckbox = new Checkbox(
      isGridVisibleProperty,
      new Text(labels.gridStringProperty, {
        font: LABEL_FONT,
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: CONTENT_WIDTH - 30,
      }),
      { boxWidth: 16, accessibleName: accessibleNames.gridCheckboxStringProperty },
    );

    const atmosphereButtons = new AquaRadioButtonGroup(
      isAtmosphereProperty,
      [
        {
          value: true,
          createNode: () =>
            new Text(labels.onStringProperty, {
              font: LABEL_FONT,
              fill: FluidPressureAndFlowColors.textColorProperty,
              maxWidth: 60,
            }),
        },
        {
          value: false,
          createNode: () =>
            new Text(labels.offStringProperty, {
              font: LABEL_FONT,
              fill: FluidPressureAndFlowColors.textColorProperty,
              maxWidth: 60,
            }),
        },
      ],
      {
        orientation: "horizontal",
        spacing: 14,
        radioButtonOptions: { radius: 7 },
        accessibleName: accessibleNames.atmosphereControlStringProperty,
      },
    );

    const atmosphereControl = new VBox({
      align: "left",
      spacing: 5,
      children: [
        new Text(labels.atmosphereStringProperty, {
          font: TITLE_FONT,
          fill: FluidPressureAndFlowColors.textColorProperty,
          maxWidth: CONTENT_WIDTH,
        }),
        atmosphereButtons,
      ],
    });

    const unitsControl = new UnitsControlPanel(unitSystemProperty, labels, accessibleNames.unitsControlStringProperty);

    super(
      new VBox({
        align: "left",
        spacing: 10,
        children: [
          rulerCheckbox,
          gridCheckbox,
          new HSeparator({ stroke: FluidPressureAndFlowColors.panelBorderColorProperty }),
          atmosphereControl,
          new HSeparator({ stroke: FluidPressureAndFlowColors.panelBorderColorProperty }),
          unitsControl,
        ],
      }),
      { minWidth: CONTENT_WIDTH },
    );
  }
}
