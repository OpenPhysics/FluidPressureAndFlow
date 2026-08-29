/**
 * VelocitySensorNode.ts
 *
 * A speedometer the student drags into the flow.
 *
 * It shows a number and an arrow. The number answers "how fast", which is what a
 * student needs to check continuity against the flux meter. The arrow answers
 * "which way", which matters because the pipe slopes and the water tower's jet
 * arcs — a scalar readout would hide the most interesting part of the Water
 * Tower screen entirely.
 */

import { Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  DragListener,
  KeyboardDragListener,
  Node,
  Path,
  type PressListenerEvent,
  Rectangle,
  Text,
} from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import type { VelocitySensor } from "../model/VelocitySensor.js";

/** Size of the readout body, view pixels. */
const BODY_WIDTH = 76;
const BODY_HEIGHT = 44;

/** Height of the pointed tip below the body, view pixels. */
const TIP_HEIGHT = 12;
const TIP_HALF_WIDTH = 8;

/** View pixels of arrow per m/s of flow. */
const ARROW_SCALE = 22;

/** Longest the direction arrow is allowed to grow, view pixels. */
const MAX_ARROW_LENGTH = 90;

/** Metres the sampling point moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 3;

export type VelocitySensorNodeOptions = {
  /** Region that catches a drop; dropping here stows the tool. */
  readonly toolboxBounds: () => Bounds2;
  /** Where the sampling point may go, model coordinates. */
  readonly dragBounds: Bounds2;
  /** Where it lands when taken with the keyboard. */
  readonly homePosition: Vector2;
  /** Accessible name for this instrument. */
  readonly accessibleName: TReadOnlyProperty<string>;
};

export class VelocitySensorNode extends Node {
  private readonly disposeVelocitySensorNode: () => void;
  private readonly dragListener: DragListener;

  public constructor(
    sensor: VelocitySensor,
    modelViewTransform: ModelViewTransform2,
    speedTextProperty: TReadOnlyProperty<string>,
    labelProperty: TReadOnlyProperty<string>,
    options: VelocitySensorNodeOptions,
  ) {
    super({
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: options.accessibleName,
    });

    const body = new Rectangle(0, 0, BODY_WIDTH, BODY_HEIGHT, 5, 5, {
      fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: 2,
    });

    const label = new Text(labelProperty, {
      font: "11px sans-serif",
      fill: FluidPressureAndFlowColors.controlSurfaceColorProperty,
      maxWidth: BODY_WIDTH - 8,
      centerX: body.centerX,
      top: body.top + 3,
    });

    const readoutBackground = new Rectangle(0, 0, BODY_WIDTH - 10, 18, 3, 3, {
      fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
      centerX: body.centerX,
      bottom: body.bottom - 4,
    });
    const readoutText = new Text(speedTextProperty, {
      font: "bold 12px sans-serif",
      fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
      maxWidth: BODY_WIDTH - 14,
    });
    const centerReadout = () => {
      readoutText.center = readoutBackground.center;
    };
    speedTextProperty.link(centerReadout);

    const tip = new Path(
      new Shape().moveTo(-TIP_HALF_WIDTH, 0).lineTo(TIP_HALF_WIDTH, 0).lineTo(0, TIP_HEIGHT).close(),
      {
        fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
        top: body.bottom - 1,
        centerX: body.centerX,
      },
    );

    // Drawn from the sampling point, so it reads as the flow at the probe rather
    // than as a property of the instrument body.
    const arrow = new ArrowNode(0, 0, 0, 0, {
      fill: FluidPressureAndFlowColors.accentColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      headHeight: 12,
      headWidth: 12,
      tailWidth: 5,
    });

    this.children = [arrow, tip, body, label, readoutBackground, readoutText];

    const tipOffset = tip.centerBottom.minus(body.leftTop);

    const layout = () => {
      const viewPosition = modelViewTransform.modelToViewPosition(sensor.positionProperty.value);
      body.leftTop = viewPosition.minus(tipOffset);
      label.centerX = body.centerX;
      label.top = body.top + 3;
      readoutBackground.centerX = body.centerX;
      readoutBackground.bottom = body.bottom - 4;
      centerReadout();
      tip.top = body.bottom - 1;
      tip.centerX = body.centerX;

      const velocity = sensor.valueProperty.value;
      arrow.visible = velocity !== null && velocity.magnitude > 0;
      if (velocity && velocity.magnitude > 0) {
        const length = Math.min(MAX_ARROW_LENGTH, velocity.magnitude * ARROW_SCALE);
        const direction = velocity.normalized();
        arrow.setTail(viewPosition.x, viewPosition.y);
        // The view's y runs the other way from the model's, so the arrow's
        // vertical component is negated to point where the fluid actually goes.
        arrow.setTip(viewPosition.x + direction.x * length, viewPosition.y - direction.y * length);
      }
    };
    sensor.positionProperty.link(layout);
    sensor.valueProperty.link(layout);

    const dragBoundsProperty = new Property(options.dragBounds);

    const endDrag = () => {
      const viewPosition = modelViewTransform.modelToViewPosition(sensor.positionProperty.value);
      if (options.toolboxBounds().containsPoint(viewPosition)) {
        sensor.isActiveProperty.value = false;
        sensor.positionProperty.value = options.homePosition;
      }
    };

    this.dragListener = new DragListener({
      positionProperty: sensor.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      start: () => this.moveToFront(),
      end: endDrag,
    });
    this.addInputListener(this.dragListener);

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: sensor.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
      start: () => this.moveToFront(),
      end: endDrag,
    });
    this.addInputListener(keyboardDragListener);

    const updateVisibility = (isActive: boolean) => {
      this.visible = isActive;
    };
    sensor.isActiveProperty.link(updateVisibility);

    this.disposeVelocitySensorNode = () => {
      sensor.positionProperty.unlink(layout);
      sensor.valueProperty.unlink(layout);
      sensor.isActiveProperty.unlink(updateVisibility);
      speedTextProperty.unlink(centerReadout);
      this.dragListener.dispose();
      keyboardDragListener.dispose();
    };
  }

  /** Takes over a press that began on the toolbox. See BarometerNode.grabFromToolbox. */
  public grabFromToolbox(event: PressListenerEvent): void {
    this.moveToFront();
    this.dragListener.press(event, this);
  }

  public override dispose(): void {
    this.disposeVelocitySensorNode();
    super.dispose();
  }
}
