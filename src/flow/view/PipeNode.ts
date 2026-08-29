/**
 * PipeNode.ts
 *
 * The Flow pipe: bitmap heads at each end, a spline middle section with fluid
 * fill and a brown wall stroke, and a layer for tracers between the fill and
 * the wall — matching the layering in PhET's HTML5 build so particles read as
 * inside the pipe rather than painted over it.
 */

import { Multilink, type NumberProperty } from "scenerystack/axon";
import { type Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Image, Node, Path } from "scenerystack/scenery";
import pipeLeftBackUrl from "../../../images/pipeLeftBack.png";
import pipeLeftFrontUrl from "../../../images/pipeLeftFront.png";
import pipeRightUrl from "../../../images/pipeRight.png";
import pipeSegmentUrl from "../../../images/pipeSegment.png";
import { getFluidColor } from "../../common/model/fluidColor.js";
import { FLOW_PARTICLE_CANVAS_BOUNDS } from "../../FluidPressureAndFlowConstants.js";
import type { FlowModel } from "../model/FlowModel.js";
import type { Pipe, WallSample } from "../model/Pipe.js";
import { ParticleCanvasNode } from "./ParticleCanvasNode.js";
import { getPipeEndLayout, LEFT_PIPE_X, PIPE_HEAD_X_SCALE, RIGHT_PIPE_LAYOUT_INSET } from "./pipeEndLayout.js";

/** Brown stroke around the flexible middle section, from the PhET artwork. */
const MIDDLE_WALL_COLOR = "#613705";

const MIDDLE_WALL_LINE_WIDTH = 6;

/** Model x-range of the spline middle; overlaps the bitmap heads slightly. */
const MIDDLE_MIN_X = -6.7;
const MIDDLE_MAX_X = 6.7;

/** Horizontal stretch of the repeating pipe-segment bitmap off-screen. */
const PIPE_SEGMENT_X_SCALE = 100;

/** Gap between the left head and the repeating segment, view pixels. */
const LEFT_SEGMENT_GAP = 30;

/** Overlap between the right head and the repeating segment, view pixels. */
const RIGHT_SEGMENT_OVERLAP = 50;

export class PipeNode extends Node {
  private readonly disposePipeNode: () => void;

  /** Front left head; exposed so end handles can snap to its bounds. */
  public readonly leftPipeFront: Node;

  /** Right head; exposed so end handles can snap to its bounds. */
  public readonly rightPipe: Node;

  /**
   * Layer between the fluid fill and the wall stroke. The flux-meter back ring
   * is parented here so tracers pass in front of it.
   */
  public readonly preParticleLayer = new Node();

  public readonly particleCanvas: ParticleCanvasNode;

  public constructor(
    model: FlowModel,
    pipe: Pipe,
    fluidDensityProperty: NumberProperty,
    modelViewTransform: ModelViewTransform2,
    layoutBounds: Bounds2,
  ) {
    super();

    const leftSection = pipe.crossSections[0] as (typeof pipe.crossSections)[number];
    const rightSection = pipe.crossSections[pipe.crossSections.length - 1] as (typeof pipe.crossSections)[number];

    const leftPipeHead = new Image(pipeLeftFrontUrl);
    const leftPipeSegment = new Image(pipeSegmentUrl, {
      right: leftPipeHead.left + LEFT_SEGMENT_GAP,
      scale: new Vector2(PIPE_SEGMENT_X_SCALE, 1),
    });
    this.leftPipeFront = new Node({
      children: [leftPipeHead, leftPipeSegment],
      x: LEFT_PIPE_X,
    });

    const leftPipeBack = new Image(pipeLeftBackUrl, { x: LEFT_PIPE_X });

    const rightPipeHead = new Image(pipeRightUrl);
    const rightPipeSegment = new Image(pipeSegmentUrl, {
      left: rightPipeHead.right - RIGHT_SEGMENT_OVERLAP,
      scale: new Vector2(PIPE_SEGMENT_X_SCALE, 1),
    });
    this.rightPipe = new Node({
      children: [rightPipeHead, rightPipeSegment],
      x: layoutBounds.maxX - RIGHT_PIPE_LAYOUT_INSET,
    });

    const fluid = new Path(null, {
      stroke: MIDDLE_WALL_COLOR,
      lineWidth: 0,
      fill: getFluidColor(fluidDensityProperty.value).toCSS(),
    });

    const wall = new Path(null, {
      stroke: MIDDLE_WALL_COLOR,
      lineWidth: MIDDLE_WALL_LINE_WIDTH,
    });

    this.particleCanvas = new ParticleCanvasNode(model, modelViewTransform, FLOW_PARTICLE_CANVAS_BOUNDS);

    const updateMiddleShape = () => {
      const shape = buildMiddlePipeShape(pipe.getWall(), modelViewTransform, MIDDLE_MIN_X, MIDDLE_MAX_X);
      fluid.shape = shape;
      wall.shape = shape;
      fluid.fill = getFluidColor(fluidDensityProperty.value).toCSS();
    };

    const updateLeftPipe = () => {
      const layout = getPipeEndLayout(leftSection, modelViewTransform);
      this.leftPipeFront.setScaleMagnitude(PIPE_HEAD_X_SCALE, layout.scaleY);
      this.leftPipeFront.y = layout.viewY;
      leftPipeBack.setScaleMagnitude(PIPE_HEAD_X_SCALE, layout.scaleY);
      leftPipeBack.y = layout.viewY;
    };

    const updateRightPipe = () => {
      const layout = getPipeEndLayout(rightSection, modelViewTransform);
      this.rightPipe.setScaleMagnitude(PIPE_HEAD_X_SCALE, layout.scaleY);
      this.rightPipe.y = layout.viewY;
      this.rightPipe.x = layoutBounds.maxX - RIGHT_PIPE_LAYOUT_INSET;
    };

    const shapeMultilink = Multilink.multilinkAny([pipe.shapeVersionProperty, fluidDensityProperty], () => {
      updateMiddleShape();
      updateLeftPipe();
      updateRightPipe();
    });

    updateMiddleShape();
    updateLeftPipe();
    updateRightPipe();

    this.children = [
      leftPipeBack,
      fluid,
      this.preParticleLayer,
      this.particleCanvas,
      wall,
      this.rightPipe,
      this.leftPipeFront,
    ];

    this.disposePipeNode = () => {
      shapeMultilink.dispose();
    };
  }

  public override dispose(): void {
    this.disposePipeNode();
    super.dispose();
  }
}

function buildMiddlePipeShape(
  wall: readonly WallSample[],
  modelViewTransform: ModelViewTransform2,
  minX: number,
  maxX: number,
): Shape {
  let startIndex = 0;
  let endIndex = 0;
  for (let i = 0; i < wall.length; i++) {
    const sample = wall[i] as WallSample;
    if (sample.x <= minX) {
      startIndex = i;
    }
    if (sample.x <= maxX) {
      endIndex = i;
    }
  }

  const shape = new Shape();
  const firstBottom = wall[startIndex + 1] as WallSample;
  shape.moveTo(modelViewTransform.modelToViewX(firstBottom.x), modelViewTransform.modelToViewY(firstBottom.bottomY));

  for (let i = startIndex + 2; i <= endIndex; i++) {
    const sample = wall[i] as WallSample;
    shape.lineTo(modelViewTransform.modelToViewX(sample.x), modelViewTransform.modelToViewY(sample.bottomY));
  }

  for (let i = endIndex; i > startIndex; i--) {
    const sample = wall[i] as WallSample;
    shape.lineTo(modelViewTransform.modelToViewX(sample.x), modelViewTransform.modelToViewY(sample.topY));
  }

  return shape;
}
