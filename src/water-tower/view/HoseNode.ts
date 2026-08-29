/**
 * HoseNode.ts
 *
 * The optional hose: a U-shaped green pipe from the tank's outlet to a nozzle
 * the student can raise, lower and aim. Geometry and imagery follow PhET's Java
 * port (HoseGeometry + HoseNode) and HTML5 port (nozzle and spout-handle
 * bitmaps).
 */

import { Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, Image, KeyboardDragListener, Node, Path } from "scenerystack/scenery";
import { handleImage, nozzleImage, spoutHandleImage } from "../../common/view/images.js";
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import { HOSE_OUTLET_X, type Hose, MAX_HOSE_OUTLET_Y } from "../model/Hose.js";
import type { WaterTower } from "../model/WaterTower.js";
import { HOLE_SIZE } from "../model/WaterTower.js";
import { createHoseViewShape, getHoseGeometryPoints, getHoseHeightHandlePoint } from "./HoseGeometry.js";

/** Hose fill and rim colours — match PhET's green hose with a grey edge. */
const HOSE_FILL = "#00FF00";
const HOSE_STROKE = "#555555";

/** Scale for the height and spout drag handles. */
const HANDLE_SCALE = 0.3;

/** Scale for the nozzle bitmap. */
const NOZZLE_SCALE = 0.75;

/** Scale for the spout rotation handle. */
const SPOUT_HANDLE_SCALE = 0.75;

/** Radius of grab padding around the spout handle, view pixels. */
const SPOUT_HANDLE_HIT_PADDING = 10;

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

    const hoseViewWidth = Math.abs(modelViewTransform.modelToViewDeltaY(HOLE_SIZE)) * 1.5;

    const pipe = new Path(null, {
      fill: HOSE_FILL,
      stroke: HOSE_STROKE,
      lineWidth: 1,
    });

    const heightHandle = new Image(handleImage, {
      rotation: Math.PI,
      scale: HANDLE_SCALE,
      cursor: "ns-resize",
      tagName: "div",
      focusable: true,
      accessibleName: heightAccessibleName,
    });

    const nozzle = new Image(nozzleImage, { scale: NOZZLE_SCALE });

    const spoutHandle = new Node({
      children: [new Image(spoutHandleImage, { scale: SPOUT_HANDLE_SCALE })],
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: angleAccessibleName,
    });
    spoutHandle.touchArea = spoutHandle.localBounds.dilated(SPOUT_HANDLE_HIT_PADDING);

    const spoutAndNozzle = new Node({ children: [nozzle, spoutHandle] });

    this.children = [pipe, heightHandle, spoutAndNozzle];

    const layout = () => {
      const attachment = waterTower.getHolePosition();
      const outlet = hose.getOutletPosition();
      const angle = hose.angleProperty.value;

      pipe.shape = createHoseViewShape(attachment, HOLE_SIZE, outlet, angle, modelViewTransform, hoseViewWidth);

      const geometry = getHoseGeometryPoints(attachment, HOLE_SIZE, outlet, angle);
      const handlePoint = getHoseHeightHandlePoint(geometry);
      heightHandle.center = modelViewTransform.modelToViewPosition(handlePoint);
      heightHandle.bottom = heightHandle.centerY + hoseViewWidth / 2;

      const nozzleView = modelViewTransform.modelToViewPosition(outlet);
      spoutAndNozzle.rotation = Math.PI / 2 - angle;
      spoutAndNozzle.centerX = nozzleView.x;
      spoutAndNozzle.y = nozzleView.y;

      spoutHandle.bottom = nozzle.bottom;
      spoutHandle.left = nozzle.right - 4;
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
      useParentOffset: true,
      dragBoundsProperty: heightBoundsProperty,
    });
    heightHandle.addInputListener(heightDragListener);
    const heightKeyboardListener = new KeyboardDragListener({
      positionProperty: heightPositionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: heightBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
    });
    heightHandle.addInputListener(heightKeyboardListener);

    // ── Angle handle: swings the nozzle between horizontal and vertical ───────
    const angleDragListener = new DragListener({
      drag: (event) => {
        const modelPoint = modelViewTransform.viewToModelPosition(this.globalToParentPoint(event.pointer.point));
        const outlet = hose.getOutletPosition();
        const direction = modelPoint.minus(outlet);
        hose.angleProperty.value = Math.max(0, Math.min(Math.PI / 2, Math.atan2(direction.y, direction.x)));
      },
    });
    spoutHandle.addInputListener(angleDragListener);

    const angleKeyboardListener = new KeyboardDragListener({
      drag: (_event, listener) => {
        const delta = listener.modelDelta.x + listener.modelDelta.y;
        hose.angleProperty.value = Math.max(
          0,
          Math.min(Math.PI / 2, hose.angleProperty.value + delta * KEYBOARD_ANGLE_SPEED),
        );
      },
    });
    spoutHandle.addInputListener(angleKeyboardListener);

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
