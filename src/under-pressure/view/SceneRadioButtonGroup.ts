/**
 * SceneRadioButtonGroup.ts
 *
 * Picks which pool is on screen, using a small drawing of each one rather than
 * its name.
 *
 * The scenes differ only in shape, so a shape is the honest label — and it also
 * sidesteps the problem that "chamber pool" means nothing to a student who has
 * not yet seen one. The names are still carried as accessible labels, where they
 * are the only thing that can be read aloud.
 */

import type { EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, Path, Rectangle } from "scenerystack/scenery";
import { RectangularRadioButtonGroup } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_CORNER_RADIUS } from "../../FluidPressureAndFlowConstants.js";
import { PoolScene, type PoolSceneLabelProperties } from "../model/PoolScene.js";

/** Size of one scene icon, view pixels. */
const ICON_WIDTH = 34;
const ICON_HEIGHT = 26;

export class SceneRadioButtonGroup extends RectangularRadioButtonGroup<PoolScene> {
  public constructor(
    sceneProperty: EnumerationProperty<PoolScene>,
    sceneLabels: PoolSceneLabelProperties,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    super(
      sceneProperty,
      [
        {
          value: PoolScene.SQUARE,
          createNode: () => createIcon(squareIconShape()),
          options: { accessibleName: sceneLabels.squareStringProperty },
        },
        {
          value: PoolScene.TRAPEZOID,
          createNode: () => createIcon(trapezoidIconShape()),
          options: { accessibleName: sceneLabels.trapezoidStringProperty },
        },
        {
          value: PoolScene.CHAMBER,
          createNode: () => createIcon(chamberIconShape()),
          options: { accessibleName: sceneLabels.chamberStringProperty },
        },
        {
          value: PoolScene.MYSTERY,
          createNode: () => createIcon(squareIconShape(), true),
          options: { accessibleName: sceneLabels.mysteryStringProperty },
        },
      ],
      {
        orientation: "horizontal",
        spacing: 5,
        accessibleName: accessibleName,
        radioButtonOptions: {
          baseColor: FluidPressureAndFlowColors.controlSurfaceColorProperty,
          cornerRadius: PANEL_CORNER_RADIUS,
          xMargin: 5,
          yMargin: 5,
          buttonAppearanceStrategyOptions: {
            selectedStroke: FluidPressureAndFlowColors.accentColorProperty,
            selectedLineWidth: 3,
            deselectedLineWidth: 1,
          },
        },
      },
    );
  }
}

/** A plain rectangular basin. */
function squareIconShape(): Shape {
  return Shape.rect(4, 6, ICON_WIDTH - 8, ICON_HEIGHT - 10);
}

/** Two chambers with opposite taper, joined along the floor. */
function trapezoidIconShape(): Shape {
  const bottom = ICON_HEIGHT - 4;
  const left = Shape.polygon([new Vector2(5, 6), new Vector2(2, bottom), new Vector2(14, bottom), new Vector2(11, 6)]);
  const right = Shape.polygon([
    new Vector2(17, 6),
    new Vector2(23, bottom),
    new Vector2(29, bottom),
    new Vector2(32, 6),
  ]);
  return left.shapeUnion(right).shapeUnion(Shape.rect(5, bottom - 3, 24, 3));
}

/** A narrow shaft and a wide one over a linked pair of chambers. */
function chamberIconShape(): Shape {
  const bottom = ICON_HEIGHT - 4;
  return Shape.rect(6, 6, 3, bottom - 6)
    .shapeUnion(Shape.rect(18, 6, 12, bottom - 6))
    .shapeUnion(Shape.rect(3, bottom - 5, 27, 5));
}

/**
 * Wraps a pool outline in a fixed-size frame so all four buttons come out the
 * same size regardless of how much of the frame their shape fills.
 */
function createIcon(shape: Shape, isMystery = false): Node {
  const frame = new Rectangle(0, 0, ICON_WIDTH, ICON_HEIGHT, { fill: null });
  const outline = new Path(shape, {
    fill: isMystery
      ? FluidPressureAndFlowColors.mysteryFluidColorProperty
      : FluidPressureAndFlowColors.waterEdgeColorProperty,
    stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
    lineWidth: 1,
  });
  return new Node({ children: [frame, outline] });
}
