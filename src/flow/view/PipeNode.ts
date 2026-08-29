/**
 * PipeNode.ts
 *
 * The pipe: fluid inside, wall around it.
 *
 * The fluid is drawn in the density-dependent colour so that switching to honey
 * is visible here as it is in the pools, and the wall is a heavy stroke along the
 * ceiling and floor separately rather than an outline of the whole shape — the
 * pipe is open at both ends, and closing the outline would draw caps across the
 * mouths.
 */

import { Multilink, type NumberProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Path } from "scenerystack/scenery";
import { getFluidColor } from "../../common/model/fluidColor.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import type { Pipe } from "../model/Pipe.js";

/** Thickness of the pipe wall, view pixels. */
const WALL_LINE_WIDTH = 8;

export class PipeNode extends Node {
  private readonly disposePipeNode: () => void;

  public constructor(pipe: Pipe, fluidDensityProperty: NumberProperty, modelViewTransform: ModelViewTransform2) {
    super();

    const fluid = new Path(null, { fill: getFluidColor(fluidDensityProperty.value).toCSS() });
    const wall = new Path(null, {
      stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
      lineWidth: WALL_LINE_WIDTH,
      lineCap: "round",
    });

    this.children = [fluid, wall];

    const update = () => {
      fluid.shape = modelViewTransform.modelToViewShape(pipe.getShape());
      fluid.fill = getFluidColor(fluidDensityProperty.value).toCSS();

      // Ceiling and floor as two open strokes, so the ends stay open.
      const wallShape = new Shape();
      const samples = pipe.getWall();
      samples.forEach((sample, i) => {
        const point = modelViewTransform.modelToViewXY(sample.x, sample.topY);
        if (i === 0) {
          wallShape.moveToPoint(point);
        } else {
          wallShape.lineToPoint(point);
        }
      });
      samples.forEach((sample, i) => {
        const point = modelViewTransform.modelToViewXY(sample.x, sample.bottomY);
        if (i === 0) {
          wallShape.moveToPoint(point);
        } else {
          wallShape.lineToPoint(point);
        }
      });
      wall.shape = wallShape;
    };

    const updateMultilink = Multilink.multilinkAny([pipe.shapeVersionProperty, fluidDensityProperty], update);

    this.disposePipeNode = () => {
      updateMultilink.dispose();
    };
  }

  public override dispose(): void {
    this.disposePipeNode();
    super.dispose();
  }
}
