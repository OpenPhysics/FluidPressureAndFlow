/**
 * BarometerNode.ts
 *
 * A pressure gauge the student drags anywhere on the screen.
 *
 * The dial and the digital readout say the same thing twice on purpose. The
 * needle carries the comparison — is this pressure bigger than that one, and by
 * roughly how much — which is what the screen's learning goals are actually
 * about. The digits carry the value a student needs to write down or to invert
 * for the mystery pool. Neither alone does both jobs.
 *
 * The sampling point is the tip at the bottom of the body, not the centre of the
 * dial, so that what is being measured is the place the student put the point.
 */

import { DerivedProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
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
import { GaugeNode } from "scenerystack/scenery-phet";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PRESSURE_RANGE } from "../../FluidPressureAndFlowConstants.js";
import type { Barometer } from "../model/Barometer.js";

/** Radius of the dial face, view pixels. */
const GAUGE_RADIUS = 34;

/** Height of the pointed tip below the dial, view pixels. */
const TIP_HEIGHT = 12;

/** Half-width of the tip where it meets the dial, view pixels. */
const TIP_HALF_WIDTH = 7;

/** Metres the sampling point moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 3;

export type BarometerNodeOptions = {
  /** Where the barometer returns to when dropped back on the toolbox. */
  readonly homePosition: Vector2;

  /** Region that catches a drop, in view coordinates. Dropping here stows the tool. */
  readonly toolboxBounds: () => Bounds2;

  /** Region the sampling point is confined to, in model coordinates. */
  readonly dragBounds: Bounds2;

  /** Accessible name for this instrument. */
  readonly accessibleName: TReadOnlyProperty<string>;
};

export class BarometerNode extends Node {
  private readonly disposeBarometerNode: () => void;

  /** All set in the constructor; used by {@link grabFromToolbox}. */
  private readonly dragListener: DragListener;
  private readonly positionProperty: Property<Vector2>;
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly dragBounds: Bounds2;

  public constructor(
    barometer: Barometer,
    modelViewTransform: ModelViewTransform2,
    pressureTextProperty: TReadOnlyProperty<string>,
    labelProperty: TReadOnlyProperty<string>,
    options: BarometerNodeOptions,
  ) {
    super({
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: options.accessibleName,
    });

    // The needle stays pegged rather than wrapping when the reading leaves the
    // dial's range; a null reading parks it at the low end and the digits show a
    // dash, so an out-of-fluid probe never looks like a measurement of zero.
    const needleValueProperty = new DerivedProperty([barometer.valueProperty], (value) =>
      value === null ? PRESSURE_RANGE.min : value,
    );

    const gauge = new GaugeNode(needleValueProperty, labelProperty, PRESSURE_RANGE, {
      radius: GAUGE_RADIUS,
      backgroundFill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
      backgroundStroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      backgroundLineWidth: 2,
      labelTextOptions: { fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty },
    });

    // The digits go in a box hung off the bottom of the dial rather than inside
    // it: GaugeNode already writes its own label across the middle of the face,
    // and stacking a second readout there leaves both unreadable.
    const readoutText = new Text(pressureTextProperty, {
      font: "bold 12px sans-serif",
      fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
      maxWidth: GAUGE_RADIUS * 1.9,
    });
    const readoutBackground = new Rectangle(0, 0, GAUGE_RADIUS * 2.1, 19, 3, 3, {
      fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: 2,
      centerX: gauge.centerX,
      top: gauge.bottom - 10,
    });
    const centerReadout = () => {
      readoutText.center = readoutBackground.center;
    };
    pressureTextProperty.link(centerReadout);

    const tip = new Path(
      new Shape().moveTo(-TIP_HALF_WIDTH, 0).lineTo(TIP_HALF_WIDTH, 0).lineTo(0, TIP_HEIGHT).close(),
      {
        fill: FluidPressureAndFlowColors.gaugeRimColorProperty,
        top: readoutBackground.bottom - 2,
        centerX: gauge.centerX,
      },
    );

    this.children = [tip, gauge, readoutBackground, readoutText];

    // The sampling point is the tip, so the children are shifted to put the tip at
    // this node's origin. Setting `translation` below then lands the tip exactly on
    // the model position; a bounds-based setter such as `leftTop` would land the
    // corner of the artwork there instead, and the gauge would read a pressure from
    // a point the student can't see.
    const tipAnchor = tip.centerBottom;
    for (const child of this.children) {
      child.translate(-tipAnchor.x, -tipAnchor.y);
    }

    this.positionProperty = barometer.positionProperty;
    this.modelViewTransform = modelViewTransform;
    this.dragBounds = options.dragBounds;

    const updatePosition = (position: Vector2) => {
      this.translation = modelViewTransform.modelToViewPosition(position);
    };
    barometer.positionProperty.link(updatePosition);

    /** Stows the tool if it was let go over the toolbox. */
    const endDrag = () => {
      if (
        options.toolboxBounds().containsPoint(modelViewTransform.modelToViewPosition(barometer.positionProperty.value))
      ) {
        barometer.isActiveProperty.value = false;
        barometer.positionProperty.value = options.homePosition;
      }
    };

    // Both pointer and keyboard drags are held to the same region, so a tool
    // cannot be walked somewhere it could not be dragged.
    const dragBoundsProperty = new Property(options.dragBounds);

    // `useParentOffset` measures the grab offset against positionProperty through the
    // transform rather than against this node's origin. The grab point then stays
    // under the pointer no matter how the artwork is laid out around the tip.
    this.dragListener = new DragListener({
      positionProperty: barometer.positionProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: dragBoundsProperty,
      start: () => {
        barometer.isActiveProperty.value = true;
        this.moveToFront();
      },
      end: endDrag,
    });
    this.addInputListener(this.dragListener);

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: barometer.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
      start: () => {
        barometer.isActiveProperty.value = true;
        this.moveToFront();
      },
      end: endDrag,
    });
    this.addInputListener(keyboardDragListener);

    // A stowed barometer is not on the play area at all — it is drawn inside the
    // toolbox instead — so hide the free-floating copy rather than leaving an
    // unreachable duplicate for keyboard users to land on.
    const updateVisibility = (isActive: boolean) => {
      this.visible = isActive;
    };
    barometer.isActiveProperty.link(updateVisibility);

    this.disposeBarometerNode = () => {
      barometer.positionProperty.unlink(updatePosition);
      barometer.isActiveProperty.unlink(updateVisibility);
      pressureTextProperty.unlink(centerReadout);
      needleValueProperty.dispose();
      this.dragListener.dispose();
      keyboardDragListener.dispose();
      gauge.dispose();
    };
  }

  /**
   * Takes over a press that started on the toolbox, so the instrument follows
   * the pointer out of the tray in one continuous motion.
   *
   * Without this the tray would only be able to activate a sensor and drop it
   * at some fixed spot, and the student would have to grab it a second time to
   * actually place it.
   *
   * The press began on the tray, which knows nothing about where this instrument
   * was left, so the sampling point is moved under the pointer first. From there
   * the drag carries zero offset and the tip follows the pointer out of the tray.
   */
  public grabFromToolbox(event: PressListenerEvent): void {
    this.moveToFront();
    this.positionProperty.value = this.dragBounds.closestPointTo(
      this.modelViewTransform.viewToModelPosition(this.globalToParentPoint(event.pointer.point)),
    );
    this.dragListener.press(event, this);
  }

  public override dispose(): void {
    this.disposeBarometerNode();
    super.dispose();
  }
}
