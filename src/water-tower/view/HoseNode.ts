/**
 * HoseNode.ts
 *
 * The optional hose: a pipe from the tank's outlet out to a nozzle the student
 * can raise, lower and aim.
 *
 * Drawn as one curve from the tank to the nozzle rather than as a jointed pipe,
 * because the shape of the hose is not the point — where its mouth is, and which
 * way it faces, is. Two handles carry those two degrees of freedom: one on the
 * body to move the mouth up and down, one at the tip to swing it.
 */

import { Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, DragListener, KeyboardDragListener, Node, Path } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { HOSE_OUTLET_X, type Hose, MAX_HOSE_OUTLET_Y } from "../model/Hose.js";
import type { WaterTower } from "../model/WaterTower.js";

/** Thickness of the hose, view pixels. */
const HOSE_LINE_WIDTH = 12;

/** Radius of a grab handle, view pixels. */
const HANDLE_RADIUS = 9;

/** Length of the nozzle beyond the last bend, metres. */
const NOZZLE_LENGTH = 2.4;

/** Metres the nozzle moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 3;

/** Radians the nozzle swings per arrow-key press. */
const KEYBOARD_ANGLE_SPEED = 0.6;

export class HoseNode extends Node {
  private readonly disposeHoseNode: () => void;

  public constructor(
    hose: Hose,
    waterTower: WaterTower,
    modelViewTransform: ModelViewTransform2,
    heightAccessibleName: TReadOnlyProperty<string>,
    angleAccessibleName: TReadOnlyProperty<string>,
  ) {
    super();

    const pipe = new Path(null, {
      stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
      lineWidth: HOSE_LINE_WIDTH,
      lineCap: "round",
    });

    const heightHandle = new Circle(HANDLE_RADIUS, {
      fill: FluidPressureAndFlowColors.accentColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: 2,
      cursor: "ns-resize",
      tagName: "div",
      focusable: true,
      accessibleName: heightAccessibleName,
    });

    const angleHandle = new Circle(HANDLE_RADIUS, {
      fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: 2,
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: angleAccessibleName,
    });

    this.children = [pipe, heightHandle, angleHandle];

    const layout = () => {
      const attach = waterTower.getHolePosition();
      const outlet = hose.getOutletPosition();
      // The nozzle's mouth is the outlet; the pipe runs back from it along the
      // aiming direction, so swinging the nozzle pivots about the mouth rather
      // than dragging the whole hose sideways.
      const bend = outlet.minus(hose.getDirection().timesScalar(NOZZLE_LENGTH));

      const shape = new Shape();
      shape.moveToPoint(modelViewTransform.modelToViewPosition(attach));
      // A single quadratic through a control point below the bend, so the hose
      // sags the way a hose does instead of running dead straight.
      shape.quadraticCurveToPoint(
        modelViewTransform.modelToViewPosition(new Vector2(bend.x, Math.min(attach.y, bend.y) - 1)),
        modelViewTransform.modelToViewPosition(bend),
      );
      shape.lineToPoint(modelViewTransform.modelToViewPosition(outlet));
      pipe.shape = shape;

      heightHandle.center = modelViewTransform.modelToViewPosition(bend);
      angleHandle.center = modelViewTransform.modelToViewPosition(outlet);
    };

    const layoutMultilink = Multilink.multilinkAny(
      [hose.outletYProperty, hose.angleProperty, waterTower.baseCenterProperty],
      layout,
    );

    // ── Height handle: moves the nozzle up and down ───────────────────────────
    const heightPositionProperty = new Property(new Vector2(HOSE_OUTLET_X, hose.outletYProperty.value));
    const applyHeight = (position: Vector2) => {
      hose.outletYProperty.value = position.y;
    };
    heightPositionProperty.link(applyHeight);
    const syncHeight = (y: number) => {
      if (heightPositionProperty.value.y !== y) {
        heightPositionProperty.value = new Vector2(HOSE_OUTLET_X, y);
      }
    };
    hose.outletYProperty.link(syncHeight);

    const heightBoundsProperty = new Property(new Bounds2(HOSE_OUTLET_X, 0, HOSE_OUTLET_X, MAX_HOSE_OUTLET_Y));
    const heightDragListener = new DragListener({
      positionProperty: heightPositionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: heightBoundsProperty,
    });
    heightHandle.addInputListener(heightDragListener);
    const heightKeyboardListener = new KeyboardDragListener({
      positionProperty: heightPositionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: heightBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
    });
    heightHandle.addInputListener(heightKeyboardListener);

    // ── Angle handle: swings the nozzle between horizontal and vertical ───────
    const angleDragListener = new DragListener({
      drag: (event) => {
        const modelPoint = modelViewTransform.viewToModelPosition(this.globalToParentPoint(event.pointer.point));
        const bend = hose.getOutletPosition().minus(hose.getDirection().timesScalar(NOZZLE_LENGTH));
        const direction = modelPoint.minus(bend);
        // Held to the first quadrant: aiming the nozzle down or backwards would
        // put the jet inside the ground or the tower, neither of which the model
        // has anything to say about.
        hose.angleProperty.value = Math.max(0, Math.min(Math.PI / 2, Math.atan2(direction.y, direction.x)));
      },
    });
    angleHandle.addInputListener(angleDragListener);

    const angleKeyboardListener = new KeyboardDragListener({
      drag: (_event, listener) => {
        const delta = listener.modelDelta.x + listener.modelDelta.y;
        hose.angleProperty.value = Math.max(
          0,
          Math.min(Math.PI / 2, hose.angleProperty.value + delta * KEYBOARD_ANGLE_SPEED),
        );
      },
    });
    angleHandle.addInputListener(angleKeyboardListener);

    const updateVisibility = (isEnabled: boolean) => {
      this.visible = isEnabled;
    };
    hose.isEnabledProperty.link(updateVisibility);

    this.disposeHoseNode = () => {
      layoutMultilink.dispose();
      heightPositionProperty.unlink(applyHeight);
      hose.outletYProperty.unlink(syncHeight);
      hose.isEnabledProperty.unlink(updateVisibility);
      heightDragListener.dispose();
      heightKeyboardListener.dispose();
      angleDragListener.dispose();
      angleKeyboardListener.dispose();
    };
  }

  public override dispose(): void {
    this.disposeHoseNode();
    super.dispose();
  }
}
