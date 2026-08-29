/**
 * FluxMeterNode.ts
 *
 * The flux meter: a hoop the student slides along the pipe, with a panel showing
 * the area it encloses, the flux through it, and the flow rate.
 *
 * The three numbers are shown together because their relationship is the point.
 * Flow rate holds still while area and flux move opposite ways — that is the
 * continuity equation made watchable, and no one of the three shows it alone.
 */

import type { EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { DerivedProperty, Multilink, Property } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, KeyboardDragListener, Node, Path, Text, VBox } from "scenerystack/scenery";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import { formatValue, type UnitLabelGroups, type UnitSystem } from "../../common/model/units.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import type { FluxMeter } from "../model/FluxMeter.js";
import type { Pipe } from "../model/Pipe.js";

/** Metres the hoop moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 1.5;

/** Thickness of the hoop, view pixels. */
const HOOP_LINE_WIDTH = 4;

/** How much wider than the pipe the hoop is drawn, view pixels. */
const HOOP_OVERHANG = 10;

export type FluxMeterLabels = {
  readonly flowRateStringProperty: TReadOnlyProperty<string>;
  readonly areaStringProperty: TReadOnlyProperty<string>;
  readonly fluxStringProperty: TReadOnlyProperty<string>;
};

export class FluxMeterNode extends Node {
  private readonly disposeFluxMeterNode: () => void;

  public constructor(
    fluxMeter: FluxMeter,
    pipe: Pipe,
    modelViewTransform: ModelViewTransform2,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    labels: FluxMeterLabels,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    super({
      cursor: "ew-resize",
      tagName: "div",
      focusable: true,
      accessibleName: accessibleName,
    });

    // The hoop is drawn as an ellipse standing across the pipe, so it reads as a
    // ring seen at an angle rather than as a bar laid over the picture.
    const hoop = new Path(null, {
      stroke: FluidPressureAndFlowColors.accentColorProperty,
      lineWidth: HOOP_LINE_WIDTH,
    });

    const flowRateTextProperty = new DerivedProperty(
      [pipe.flowRateProperty, unitSystemProperty, labels.flowRateStringProperty],
      (flowRate, system, label) =>
        `${label}: ${formatValue(system.flowRate, flowRate)} ${system.labels(unitLabelGroups).flowRateStringProperty.value}`,
    );
    const areaTextProperty = new DerivedProperty(
      [fluxMeter.areaProperty, unitSystemProperty, labels.areaStringProperty],
      (area, system, label) =>
        `${label}: ${formatValue(system.area, area)} ${system.labels(unitLabelGroups).areaStringProperty.value}`,
    );
    const fluxTextProperty = new DerivedProperty(
      [fluxMeter.fluxProperty, unitSystemProperty, labels.fluxStringProperty],
      (flux, system, label) =>
        `${label}: ${formatValue(system.flux, flux)} ${system.labels(unitLabelGroups).fluxStringProperty.value}`,
    );

    const panel = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: 3,
        children: [
          new Text(flowRateTextProperty, {
            font: "12px sans-serif",
            fill: FluidPressureAndFlowColors.textColorProperty,
            maxWidth: 180,
          }),
          new Text(areaTextProperty, {
            font: "12px sans-serif",
            fill: FluidPressureAndFlowColors.textColorProperty,
            maxWidth: 180,
          }),
          new Text(fluxTextProperty, {
            font: "12px sans-serif",
            fill: FluidPressureAndFlowColors.textColorProperty,
            maxWidth: 180,
          }),
        ],
      }),
    );

    this.children = [hoop, panel];

    const layout = () => {
      const x = fluxMeter.xProperty.value;
      const section = pipe.getCrossSectionAt(x);
      const viewX = modelViewTransform.modelToViewX(x);
      const viewTop = modelViewTransform.modelToViewY(section.topY);
      const viewBottom = modelViewTransform.modelToViewY(section.bottomY);
      const height = viewBottom - viewTop;

      hoop.shape = Shape.ellipse(viewX, (viewTop + viewBottom) / 2, HOOP_OVERHANG, height / 2 + HOOP_OVERHANG, 0);
      panel.centerX = viewX;
      panel.bottom = viewTop - HOOP_OVERHANG - 8;
    };

    const layoutMultilink = Multilink.multilinkAny([fluxMeter.xProperty, pipe.shapeVersionProperty], layout);

    // Only x is draggable; the hoop always sits across the pipe, so a vertical
    // degree of freedom would only let the student pull it off the thing it
    // measures.
    const positionProperty = new Property(new Vector2(fluxMeter.xProperty.value, 0));
    const syncToModel = (position: Vector2) => {
      fluxMeter.xProperty.value = position.x;
    };
    positionProperty.link(syncToModel);
    const syncFromModel = (x: number) => {
      if (positionProperty.value.x !== x) {
        positionProperty.value = new Vector2(x, 0);
      }
    };
    fluxMeter.xProperty.link(syncFromModel);

    const dragBoundsProperty = new Property(new Bounds2(pipe.getMinX(), 0, pipe.getMaxX(), 0));

    const dragListener = new DragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
    });
    this.addInputListener(dragListener);

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
    });
    this.addInputListener(keyboardDragListener);

    const updateVisibility = (isVisible: boolean) => {
      this.visible = isVisible;
    };
    fluxMeter.isVisibleProperty.link(updateVisibility);

    this.disposeFluxMeterNode = () => {
      layoutMultilink.dispose();
      positionProperty.unlink(syncToModel);
      fluxMeter.xProperty.unlink(syncFromModel);
      fluxMeter.isVisibleProperty.unlink(updateVisibility);
      flowRateTextProperty.dispose();
      areaTextProperty.dispose();
      fluxTextProperty.dispose();
      dragListener.dispose();
      keyboardDragListener.dispose();
    };
  }

  public override dispose(): void {
    this.disposeFluxMeterNode();
    super.dispose();
  }
}
