/**
 * PipeHandlesNode.ts
 *
 * The grab handles on the pipe wall: one on the ceiling and one on the floor at
 * each of the seven cross-sections.
 *
 * Two handles per section rather than one, because the two ends of the lesson are
 * different. Moving both together raises or lowers the pipe, which changes the
 * `ρgy` term; moving one alone changes the cross-section, which changes the
 * `½ρv²` term. A single handle would conflate them.
 *
 * Each handle is clamped so the pipe can neither leave the ground nor be pinched
 * below the minimum height — see {@link Pipe} for why that floor exists.
 */

import { Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, DragListener, KeyboardDragListener, Node } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { MAX_PIPE_Y, MIN_PIPE_HEIGHT, MIN_PIPE_Y, type Pipe } from "../model/Pipe.js";
import type { PipeCrossSection } from "../model/PipeCrossSection.js";

/** Radius of a grab handle, view pixels. */
const HANDLE_RADIUS = 9;

/** Metres the handle moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 1.5;

export class PipeHandlesNode extends Node {
  private readonly disposePipeHandlesNode: () => void;

  public constructor(pipe: Pipe, modelViewTransform: ModelViewTransform2, accessibleName: TReadOnlyProperty<string>) {
    super();

    const disposers: Array<() => void> = [];

    for (const section of pipe.crossSections) {
      this.addChild(
        createHandle(section, modelViewTransform, accessibleName, disposers, {
          isTop: true,
          moved: section.topYProperty,
          limit: section.bottomYProperty,
        }),
      );
      this.addChild(
        createHandle(section, modelViewTransform, accessibleName, disposers, {
          isTop: false,
          moved: section.bottomYProperty,
          limit: section.topYProperty,
        }),
      );
    }

    this.disposePipeHandlesNode = () => {
      for (const dispose of disposers) {
        dispose();
      }
    };
  }

  public override dispose(): void {
    this.disposePipeHandlesNode();
    super.dispose();
  }
}

/**
 * One handle. Its drag Property is a Vector2 because the drag listeners work in
 * two dimensions; the x is pinned to the cross-section's own x on every change,
 * which is what keeps the sections from sliding past one another.
 */
function createHandle(
  section: PipeCrossSection,
  modelViewTransform: ModelViewTransform2,
  accessibleName: TReadOnlyProperty<string>,
  disposers: Array<() => void>,
  config: {
    readonly isTop: boolean;
    readonly moved: PipeCrossSection["topYProperty"];
    readonly limit: PipeCrossSection["topYProperty"];
  },
): Node {
  const handle = new Circle(HANDLE_RADIUS, {
    fill: FluidPressureAndFlowColors.accentColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 2,
    cursor: "ns-resize",
    tagName: "div",
    focusable: true,
    accessibleName: accessibleName,
  });

  /**
   * The ceiling may not come within MIN_PIPE_HEIGHT of the floor, nor rise above
   * ground; the floor is the mirror of that. The x is pinned to the
   * cross-section's own, which is what keeps sections from sliding past one
   * another.
   *
   * Applied through the listeners' `mapPosition` rather than by writing a
   * corrected value back afterwards — a Property that is set from inside its own
   * listener re-enters, which axon asserts on.
   */
  const constrain = (point: Vector2): Vector2 => {
    const y = config.isTop
      ? Math.max(config.limit.value + MIN_PIPE_HEIGHT, Math.min(MAX_PIPE_Y, point.y))
      : Math.max(MIN_PIPE_Y, Math.min(config.limit.value - MIN_PIPE_HEIGHT, point.y));
    return new Vector2(section.x, y);
  };

  // The drag listeners work in two dimensions, so the handle needs a Vector2
  // Property alongside the scalar the model holds. The two mirror each other;
  // `isSyncing` keeps a write to one from bouncing back through the other.
  const dragPositionProperty = new Property(new Vector2(section.x, config.moved.value));
  let isSyncing = false;

  const syncToModel = (point: Vector2) => {
    if (isSyncing) {
      return;
    }
    isSyncing = true;
    config.moved.value = point.y;
    isSyncing = false;
  };
  dragPositionProperty.link(syncToModel);

  const syncFromModel = (y: number) => {
    handle.center = modelViewTransform.modelToViewPosition(new Vector2(section.x, y));
    if (isSyncing) {
      return;
    }
    isSyncing = true;
    dragPositionProperty.value = new Vector2(section.x, y);
    isSyncing = false;
  };
  config.moved.link(syncFromModel);

  // The wall this handle is attached to can move underneath it: pushing the
  // floor up squeezes the ceiling ahead of it.
  const limitListener = () => {
    const constrained = constrain(new Vector2(section.x, config.moved.value));
    if (constrained.y !== config.moved.value) {
      config.moved.value = constrained.y;
    }
  };
  config.limit.link(limitListener);

  const dragBoundsProperty = new Property(new Bounds2(section.x, MIN_PIPE_Y, section.x, MAX_PIPE_Y));

  const dragListener = new DragListener({
    positionProperty: dragPositionProperty,
    transform: modelViewTransform,
    dragBoundsProperty: dragBoundsProperty,
    mapPosition: constrain,
  });
  handle.addInputListener(dragListener);

  const keyboardDragListener = new KeyboardDragListener({
    positionProperty: dragPositionProperty,
    transform: modelViewTransform,
    dragBoundsProperty: dragBoundsProperty,
    mapPosition: constrain,
    dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
    shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
  });
  handle.addInputListener(keyboardDragListener);

  disposers.push(() => {
    config.moved.unlink(syncFromModel);
    dragPositionProperty.unlink(syncToModel);
    config.limit.unlink(limitListener);
    dragListener.dispose();
    keyboardDragListener.dispose();
  });

  return handle;
}
