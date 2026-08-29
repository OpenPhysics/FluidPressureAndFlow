/**
 * FluidPressureAndFlowPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to FluidPressureAndFlowPreferencesModel Properties (whose initial values come from
 * fluidPressureAndFlowQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import FluidPressureAndFlowColors from "../FluidPressureAndFlowColors.js";
import FluidPressureAndFlowNamespace from "../FluidPressureAndFlowNamespace.js";
import { StringManager } from "../i18n/StringManager.js";
import type { FluidPressureAndFlowPreferencesModel } from "./FluidPressureAndFlowPreferencesModel.js";

const HEADER_FONT_SIZE = 18;
const CHECKBOX_LABEL_FONT_SIZE = 14;
const DESCRIPTION_FONT_SIZE = 12;
const DESCRIPTION_MAX_WIDTH = 380;
const CHECKBOX_SPACING = 8;
const CONTENT_SPACING = 8;

export class FluidPressureAndFlowPreferencesNode extends VBox {
  public constructor(preferencesModel: FluidPressureAndFlowPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: HEADER_FONT_SIZE, weight: "bold" }),
      fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
    });

    const linkUnitsCheckbox = new Checkbox(
      preferencesModel.linkUnitsProperty,
      new Text(prefStrings.linkUnitsStringProperty, {
        font: new PhetFont(CHECKBOX_LABEL_FONT_SIZE),
        fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: FluidPressureAndFlowColors.controlSurfaceColorProperty,
        spacing: CHECKBOX_SPACING,
        ...(tandem && { tandem: tandem.createTandem("linkUnitsCheckbox") }),
      },
    );

    const description = new Text(prefStrings.linkUnitsDescriptionStringProperty, {
      font: new PhetFont(DESCRIPTION_FONT_SIZE),
      fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
      maxWidth: DESCRIPTION_MAX_WIDTH,
    });

    super({
      align: "left",
      spacing: CONTENT_SPACING,
      children: [header, linkUnitsCheckbox, description],
    });
  }
}

FluidPressureAndFlowNamespace.register("FluidPressureAndFlowPreferencesNode", FluidPressureAndFlowPreferencesNode);
