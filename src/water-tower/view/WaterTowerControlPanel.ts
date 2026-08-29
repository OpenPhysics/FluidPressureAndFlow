/**
 * WaterTowerControlPanel.ts
 *
 * The Water Tower screen's right-hand controls: the hose toggle, the two measuring
 * tools, and the unit-system chooser.
 *
 * The unit system gets its own box, as on the other two screens: it is set once
 * and left alone, and separating it keeps the toggles above it at a constant
 * height however tall the unit list grows in translation.
 */

import type { BooleanProperty, EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import type { UnitSystem } from "../../common/model/units.js";
import { UnitsControlPanel, type UnitsControlPanelLabels } from "../../common/view/UnitsControlPanel.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_SPACING } from "../../FluidPressureAndFlowConstants.js";

const LABEL_FONT = "13px sans-serif";

/** Width the panel's contents are held to, so the layout does not jump. */
const CONTENT_WIDTH = 150;

export type WaterTowerControlPanelLabels = UnitsControlPanelLabels & {
  readonly rulerStringProperty: TReadOnlyProperty<string>;
  readonly measuringTapeStringProperty: TReadOnlyProperty<string>;
  readonly hoseStringProperty: TReadOnlyProperty<string>;
};

export type WaterTowerControlPanelAccessibleNames = {
  readonly rulerCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly measuringTapeCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly hoseCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly unitsControlStringProperty: TReadOnlyProperty<string>;
};

export class WaterTowerControlPanel extends VBox {
  public constructor(
    isRulerVisibleProperty: BooleanProperty,
    isMeasuringTapeVisibleProperty: BooleanProperty,
    isHoseEnabledProperty: BooleanProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    labels: WaterTowerControlPanelLabels,
    accessibleNames: WaterTowerControlPanelAccessibleNames,
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

    const toggles = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: 8,
        children: [
          checkbox(isRulerVisibleProperty, labels.rulerStringProperty, accessibleNames.rulerCheckboxStringProperty),
          checkbox(
            isMeasuringTapeVisibleProperty,
            labels.measuringTapeStringProperty,
            accessibleNames.measuringTapeCheckboxStringProperty,
          ),
          checkbox(isHoseEnabledProperty, labels.hoseStringProperty, accessibleNames.hoseCheckboxStringProperty),
        ],
      }),
      { minWidth: CONTENT_WIDTH },
    );

    const units = new FluidPressureAndFlowPanel(
      new UnitsControlPanel(unitSystemProperty, labels, accessibleNames.unitsControlStringProperty),
      { minWidth: CONTENT_WIDTH },
    );

    super({ align: "right", spacing: PANEL_SPACING, children: [toggles, units] });
  }
}
