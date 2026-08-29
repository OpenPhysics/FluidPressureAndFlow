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
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import { HOLE_SIZE, MAX_TANK_BASE_Y, MIN_TANK_BASE_Y, TANK_HEIGHT, type WaterTower } from "../model/WaterTower.js";

/** How far the legs splay out from the tank wall, metres. */
const LEG_SPLAY = 3;

/** Thickness of the tank wall and the legs, view pixels. */
const STRUCTURE_LINE_WIDTH = 4;

/** Thickness of the cross-bracing between the legs. Thinner than the legs it braces. */
const BRACE_LINE_WIDTH = 2;

/** Height of the lid on top of the tank, view pixels. */
const LID_HEIGHT = 10;

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
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: STRUCTURE_LINE_WIDTH,
    });
    const braces = new Path(null, {
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: BRACE_LINE_WIDTH,
    });
    const water = new Path(null, { fill: getFluidColor(fluidDensityProperty.value).toCSS() });
    // The body is filled, the wall is only stroked, and the wall is drawn over
    // the water — so the tank still reads as a container when it is full.
    const tankBody = new Path(null, { fill: FluidPressureAndFlowColors.poolLiningColorProperty });
    const tankWall = new Path(null, {
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: STRUCTURE_LINE_WIDTH,
    });
    const lid = new Rectangle(0, 0, 0, 0, {
      fill: FluidPressureAndFlowColors.towerTrimColorProperty,
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: 2,
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

    this.children = [legs, braces, tankBody, water, tankWall, lid, cover];

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

      lid.setRect(leftX - 3, topY - LID_HEIGHT, rightX - leftX + 6, LID_HEIGHT);

      // Legs from the tank's underside out to the ground, splayed for stability.
      const groundY = modelViewTransform.modelToViewY(0);
      const legShape = new Shape();
      const legTopX: number[] = [];
      const legBottomX: number[] = [];
      for (const side of [-1, 1]) {
        const topX = modelViewTransform.modelToViewX(base.x + (side * radius) / 2);
        const bottomX = modelViewTransform.modelToViewX(base.x + side * (radius / 2 + LEG_SPLAY));
        legTopX.push(topX);
        legBottomX.push(bottomX);
        legShape.moveTo(topX, baseY);
        legShape.lineTo(bottomX, groundY);
      }
      legs.shape = legShape;

      // A horizontal beam and an X between the legs, so the tower reads as a
      // braced structure standing up to the weight rather than two bent sticks.
      const beamY = (baseY + groundY) / 2;
      const braceShape = new Shape();
      const edgeAt = (side: 0 | 1, y: number) => {
        const fraction = (y - baseY) / (groundY - baseY);
        return (legTopX[side] as number) + ((legBottomX[side] as number) - (legTopX[side] as number)) * fraction;
      };
      braceShape.moveTo(edgeAt(0, beamY), beamY);
      braceShape.lineTo(edgeAt(1, beamY), beamY);
      braceShape.moveTo(legTopX[0] as number, baseY);
      braceShape.lineTo(legBottomX[1] as number, groundY);
      braceShape.moveTo(legTopX[1] as number, baseY);
      braceShape.lineTo(legBottomX[0] as number, groundY);
      braces.shape = braceShape;

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

    // The tower is drawn at absolute view coordinates, so this node's origin says
    // nothing about where the tank is. `useParentOffset` measures the grab offset
    // against baseCenterProperty through the transform, which does.
    const tankDragListener = new DragListener({
      positionProperty: waterTower.baseCenterProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: tankDragBoundsProperty,
    });
    tankBody.addInputListener(tankDragListener);
    tankWall.addInputListener(tankDragListener);

    const tankKeyboardListener = new KeyboardDragListener({
      positionProperty: waterTower.baseCenterProperty,
      transform: modelViewTransform,
      dragBoundsProperty: tankDragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
    });
    tankBody.addInputListener(tankKeyboardListener);

    // ── Sliding the cover ─────────────────────────────────────────────────────
    // The cover is all-or-nothing: a partly open hole would make the outlet area
    // a hidden extra variable, which is exactly what the design set out to avoid.
    const coverPositionProperty = new Property(new Vector2(0, 0));

    /** Where the cover rests when the hole is open, and when it is shut. */
    const coverOpenX = HOLE_SIZE * 1.5;
    const restingCoverPosition = (isOpen: boolean) => new Vector2(isOpen ? coverOpenX : 0, 0);

    // The two properties drive each other, so each direction locks the other out for
    // the duration of its write rather than relying on the values happening to settle.
    let isSyncing = false;

    const applyCover = (position: Vector2) => {
      if (isSyncing) {
        return;
      }
      isSyncing = true;
      waterTower.isHoleOpenProperty.value = position.x > HOLE_SIZE / 2;
      isSyncing = false;
    };
    coverPositionProperty.link(applyCover);

    // Anything that opens or shuts the hole without dragging the cover — a reset, most
    // often — has to bring the drag position with it, or the next drag would measure
    // its offset from a place the cover is no longer drawn.
    const syncCover = (isOpen: boolean) => {
      if (isSyncing) {
        return;
      }
      isSyncing = true;
      coverPositionProperty.value = restingCoverPosition(isOpen);
      isSyncing = false;
    };
    waterTower.isHoleOpenProperty.link(syncCover);

    const coverDragListener = new DragListener({
      positionProperty: coverPositionProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: new Property(new Bounds2(0, 0, coverOpenX, 0)),
      end: () => {
        // Snap to whichever end it is nearer, so it never rests half-way.
        coverPositionProperty.value = restingCoverPosition(waterTower.isHoleOpenProperty.value);
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
      waterTower.isHoleOpenProperty.unlink(syncCover);
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
