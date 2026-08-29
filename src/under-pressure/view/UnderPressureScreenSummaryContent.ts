/**
 * UnderPressureScreenSummaryContent.ts
 *
 * The accessible screen summary — what a screen-reader user hears when they
 * arrive, and what they can re-read at any point to find out where things stand.
 *
 * The "current details" paragraph is live. It names the pool on screen, how many
 * of the four barometers have been placed, and whether the atmosphere is on,
 * because those three facts are exactly what a sighted student reads off the
 * screen at a glance and what every other reading on the screen depends on.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { NUMBER_OF_BAROMETERS } from "../../FluidPressureAndFlowConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { UnderPressureModel } from "../model/UnderPressureModel.js";

export class UnderPressureScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: UnderPressureModel) {
    const strings = StringManager.getInstance();
    const a11y = strings.getUnderPressureA11yStrings();
    const common = strings.getCommonStrings();
    const scenes = strings.getUnderPressureStrings().scenes;

    const sceneNameProperty = new DerivedProperty(
      [
        model.sceneProperty,
        scenes.squareStringProperty,
        scenes.trapezoidStringProperty,
        scenes.chamberStringProperty,
        scenes.mysteryStringProperty,
      ],
      (scene) => scene.labelStringProperty(scenes).value,
    );

    const placedCountProperty = DerivedProperty.deriveAny(
      model.barometers.map((barometer) => barometer.isActiveProperty),
      () => model.barometers.filter((barometer) => barometer.isActiveProperty.value).length,
    );

    const atmosphereProperty = new DerivedProperty(
      [model.isAtmosphereProperty, common.onStringProperty, common.offStringProperty],
      (isOn, on, off) => (isOn ? on : off),
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsStringProperty, {
        scene: sceneNameProperty,
        placed: placedCountProperty,
        total: NUMBER_OF_BAROMETERS,
        atmosphere: atmosphereProperty,
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
