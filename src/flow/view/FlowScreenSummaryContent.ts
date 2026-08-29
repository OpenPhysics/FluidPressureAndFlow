/**
 * FlowScreenSummaryContent.ts
 *
 * The accessible screen summary for the Flow screen.
 *
 * The live paragraph reports the flow rate and how many instruments are out.
 * Not the pipe's shape: a student reshapes it continuously while dragging, and a
 * paragraph that re-announced on every frame of a drag would be unusable. The
 * instruments' own readouts carry what the shape did.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatValue } from "../../common/model/units.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { FlowModel } from "../model/FlowModel.js";

export class FlowScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: FlowModel) {
    const strings = StringManager.getInstance();
    const a11y = strings.getFlowA11yStrings();
    const unitLabelGroups = strings.getUnitLabelGroups();

    const sensors = [...model.barometers, ...model.velocitySensors];

    const flowRateProperty = new DerivedProperty(
      [
        model.pipe.flowRateProperty,
        model.unitSystemProperty,
        unitLabelGroups.metric.flowRateStringProperty,
        unitLabelGroups.english.flowRateStringProperty,
      ],
      (flowRate, system) =>
        `${formatValue(system.flowRate, flowRate)} ${system.labels(unitLabelGroups).flowRateStringProperty.value}`,
    );

    const placedCountProperty = DerivedProperty.deriveAny(
      sensors.map((sensor) => sensor.isActiveProperty),
      () => sensors.filter((sensor) => sensor.isActiveProperty.value).length,
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsStringProperty, {
        flowRate: flowRateProperty,
        placed: placedCountProperty,
        total: sensors.length,
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
