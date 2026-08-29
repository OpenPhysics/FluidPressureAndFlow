/**
 * WaterTowerNode.ts
 *
 * The tank, its legs, the water in it, and the sliding cover over the hole.
 *
 * The whole assembly is draggable vertically. That is the screen's main control:
 * raising the tank with the hose attached raises the water while leaving the
 * outlet where it is, which is the only way to vary the head on its own.
 *
 * The cover is a separate grab target rather than a checkbox because opening it
 * is the first thing a student has to do, and a thing you slide off a hole is
 * more obviously "the way to let the water out" than a labelled tick box.
 */

import type { NumberProperty } from "scenerystack/axon";
import { Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, KeyboardDragListener, Node, Path, Rectangle } from "scenerystack/scenery";
import { getFluidColor } from "../../common/model/fluidColor.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { HOLE_SIZE, MAX_TANK_BASE_Y, MIN_TANK_BASE_Y, TANK_HEIGHT, type WaterTower } from "../model/WaterTower.js";

/** How far the legs splay out from the tank wall, metres. */
const LEG_SPLAY = 3;

/** Thickness of the tank wall and the legs, view pixels. */
const STRUCTURE_LINE_WIDTH = 3;

/** Metres the tank moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 4;

export class WaterTowerNode extends Node {
  private readonly disposeWaterTowerNode: () => void;

  public constructor(
    waterTower: WaterTower,
    fluidDensityProperty: NumberProperty,
    modelViewTransform: ModelViewTransform2,
    tankAccessibleName: TReadOnlyProperty<string>,
    coverAccessibleName: TReadOnlyProperty<string>,
  ) {
    super();

    const legs = new Path(null, {
      stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
      lineWidth: STRUCTURE_LINE_WIDTH,
    });
    const water = new Path(null, { fill: getFluidColor(fluidDensityProperty.value).toCSS() });
    // The body is filled, the wall is only stroked, and the wall is drawn over
    // the water — so the tank still reads as a container when it is full.
    const tankBody = new Path(null, { fill: FluidPressureAndFlowColors.poolLiningColorProperty });
    const tankWall = new Path(null, {
      stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
      lineWidth: STRUCTURE_LINE_WIDTH,
    });
    const cover = new Rectangle(0, 0, 0, 0, 2, 2, {
      fill: FluidPressureAndFlowColors.massColorProperty,
      stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
      lineWidth: 2,
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: coverAccessibleName,
    });

    this.children = [legs, tankBody, water, tankWall, cover];

    const layout = () => {
      const base = waterTower.baseCenterProperty.value;
      const radius = waterTower.getRadius();
      const leftX = modelViewTransform.modelToViewX(base.x - radius);
      const rightX = modelViewTransform.modelToViewX(base.x + radius);
      const baseY = modelViewTransform.modelToViewY(base.y);
      const topY = modelViewTransform.modelToViewY(base.y + TANK_HEIGHT);

      tankBody.shape = Shape.rect(leftX, topY, rightX - leftX, baseY - topY);
      tankWall.shape = tankBody.shape;

      const surfaceY = modelViewTransform.modelToViewY(waterTower.getFluidSurfaceY());
      water.shape = Shape.rect(leftX, surfaceY, rightX - leftX, Math.max(0, baseY - surfaceY));
      water.fill = getFluidColor(fluidDensityProperty.value).toCSS();

      // Legs from the tank's underside out to the ground, splayed for stability.
      const groundY = modelViewTransform.modelToViewY(0);
      const legShape = new Shape();
      for (const side of [-1, 1]) {
        const topX = modelViewTransform.modelToViewX(base.x + (side * radius) / 2);
        const bottomX = modelViewTransform.modelToViewX(base.x + side * (radius / 2 + LEG_SPLAY));
        legShape.moveTo(topX, baseY);
        legShape.lineTo(bottomX, groundY);
      }
      // A crossbeam, so the legs read as a structure rather than two sticks.
      const beamY = (baseY + groundY) / 2;
      const beamHalfWidth = (rightX - leftX) / 4 + (modelViewTransform.modelToViewDeltaX(LEG_SPLAY) * 1) / 2;
      const centerX = modelViewTransform.modelToViewX(base.x);
      legShape.moveTo(centerX - beamHalfWidth, beamY);
      legShape.lineTo(centerX + beamHalfWidth, beamY);
      legs.shape = legShape;

      // The cover sits over the hole in the right-hand wall, and slides clear of
      // it when the hole is open.
      const holePosition = waterTower.getHolePosition();
      const holeViewSize = modelViewTransform.modelToViewDeltaX(HOLE_SIZE);
      cover.setRect(0, 0, holeViewSize * 0.6, holeViewSize * 1.4);
      cover.centerY = modelViewTransform.modelToViewY(holePosition.y);
      cover.left = waterTower.isHoleOpenProperty.value ? rightX + holeViewSize * 0.7 : rightX - holeViewSize * 0.2;
    };

    const layoutMultilink = Multilink.multilinkAny(
      [
        waterTower.baseCenterProperty,
        waterTower.fluidVolumeProperty,
        waterTower.capacityProperty,
        waterTower.isHoleOpenProperty,
        fluidDensityProperty,
      ],
      layout,
    );

    // ── Dragging the tank ─────────────────────────────────────────────────────
    const tankDragBounds = new Bounds2(0, MIN_TANK_BASE_Y, 0, MAX_TANK_BASE_Y);
    const tankDragBoundsProperty = new Property(tankDragBounds);

    for (const target of [tankBody, tankWall, legs]) {
      target.cursor = "ns-resize";
    }
    tankBody.tagName = "div";
    tankBody.focusable = true;
    tankBody.accessibleName = tankAccessibleName;

    const tankDragListener = new DragListener({
      positionProperty: waterTower.baseCenterProperty,
      transform: modelViewTransform,
      dragBoundsProperty: tankDragBoundsProperty,
    });
    tankBody.addInputListener(tankDragListener);
    tankWall.addInputListener(tankDragListener);

    const tankKeyboardListener = new KeyboardDragListener({
      positionProperty: waterTower.baseCenterProperty,
      transform: modelViewTransform,
      dragBoundsProperty: tankDragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
    });
    tankBody.addInputListener(tankKeyboardListener);

    // ── Sliding the cover ─────────────────────────────────────────────────────
    // The cover is all-or-nothing: a partly open hole would make the outlet area
    // a hidden extra variable, which is exactly what the design set out to avoid.
    const coverPositionProperty = new Property(new Vector2(0, 0));
    const applyCover = (position: Vector2) => {
      waterTower.isHoleOpenProperty.value = position.x > HOLE_SIZE / 2;
    };
    coverPositionProperty.link(applyCover);

    const coverDragListener = new DragListener({
      positionProperty: coverPositionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: new Property(new Bounds2(0, 0, HOLE_SIZE * 1.5, 0)),
      end: () => {
        // Snap to whichever end it is nearer, so it never rests half-way.
        coverPositionProperty.value = new Vector2(waterTower.isHoleOpenProperty.value ? HOLE_SIZE * 1.5 : 0, 0);
      },
    });
    cover.addInputListener(coverDragListener);
    cover.addInputListener({
      click: () => {
        waterTower.isHoleOpenProperty.value = !waterTower.isHoleOpenProperty.value;
      },
    });

    this.disposeWaterTowerNode = () => {
      layoutMultilink.dispose();
      coverPositionProperty.unlink(applyCover);
      tankDragListener.dispose();
      tankKeyboardListener.dispose();
      coverDragListener.dispose();
    };
  }

  public override dispose(): void {
    this.disposeWaterTowerNode();
    super.dispose();
  }
}
