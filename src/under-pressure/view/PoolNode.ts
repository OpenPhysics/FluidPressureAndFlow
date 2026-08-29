/**
 * PoolNode.ts
 *
 * Draws a pool: the concrete lining, and the water standing in it.
 *
 * One class covers all four scenes. The model already exposes each vessel's
 * outline and its water outline as shapes, so nothing here needs to know whether
 * it is drawing a rectangle, a pair of trapezoids or a hydraulic press. Upstream
 * has a four-class quartet — a view, a back, a grid and a water node — for every
 * pool, which is a large part of what PhET's own review objected to
 * (phetsims/fluid-pressure-and-flow#323).
 *
 * The water colour tracks fluid density, so switching from water to honey is
 * visible even before the barometer catches up.
 */

import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Path } from "scenerystack/scenery";
import { getFluidColor } from "../../common/model/fluidColor.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

/** Stroke width of the pool wall and the water outline, view pixels. */
const EDGE_LINE_WIDTH = 3;
const WATER_LINE_WIDTH = 1;

export class PoolNode extends Node {
  private readonly disposePoolNode: () => void;

  /**
   * @param containerShape - the vessel outline, model coordinates; never changes
   * @param waterShapeProperty - the water outline, model coordinates
   * @param fluidDensityProperty - kg/m³, drives the water colour
   * @param fluidColorOverrideProperty - a fixed colour that wins over density,
   *        used by the mystery pool so the fluid cannot be identified by eye
   * @param modelViewTransform - model → view
   */
  public constructor(
    containerShape: Shape,
    waterShapeProperty: TReadOnlyProperty<Shape>,
    fluidDensityProperty: NumberProperty,
    fluidColorOverrideProperty: TReadOnlyProperty<string | null>,
    modelViewTransform: ModelViewTransform2,
  ) {
    super();

    const viewContainerShape = modelViewTransform.modelToViewShape(containerShape);

    const lining = new Path(viewContainerShape, {
      fill: FluidPressureAndFlowColors.poolLiningColorProperty,
    });

    // The wall is stroked again over the top of the water. A full pool covers its
    // own lining exactly, so an outline drawn only underneath disappears at the
    // moment the vessel's shape matters most.
    const wall = new Path(viewContainerShape, {
      stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
      lineWidth: EDGE_LINE_WIDTH,
    });

    const waterFillProperty = new DerivedProperty(
      [fluidDensityProperty, fluidColorOverrideProperty],
      (density, override) => override ?? getFluidColor(density).toCSS(),
    );

    const water = new Path(null, {
      fill: waterFillProperty,
      stroke: FluidPressureAndFlowColors.waterEdgeColorProperty,
      lineWidth: WATER_LINE_WIDTH,
    });

    const updateWaterShape = (shape: Shape) => {
      water.shape = modelViewTransform.modelToViewShape(shape);
    };
    waterShapeProperty.link(updateWaterShape);

    this.children = [lining, water, wall];

    this.disposePoolNode = () => {
      waterShapeProperty.unlink(updateWaterShape);
      waterFillProperty.dispose();
    };
  }

  public override dispose(): void {
    this.disposePoolNode();
    super.dispose();
  }
}
