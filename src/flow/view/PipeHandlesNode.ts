/**
 * PipeHandlesNode.ts
 *
 * Grab handles on the pipe wall: bitmap handles on the spline middle, and
 * larger handles at the screen edges that drag the whole end cross-section up
 * and down — matching the PhET HTML5 interaction and artwork.
 */

import { Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, Image, KeyboardDragListener, Node } from "scenerystack/scenery";
import { handleWithBarImage } from "../../common/view/images.js";
import { MAX_PIPE_Y, MIN_PIPE_HEIGHT, MIN_PIPE_Y, type Pipe } from "../model/Pipe.js";
import type { PipeCrossSection } from "../model/PipeCrossSection.js";
import type { PipeNode } from "./PipeNode.js";

/** Scale applied to every handle bitmap. */
const HANDLE_IMAGE_SCALE = 0.32;

/** Horizontal inset of the left main drag handle from the layout edge. */
const LEFT_MAIN_HANDLE_INSET = 10;

/** Horizontal inset of the right main drag handle from the layout edge. */
const RIGHT_MAIN_HANDLE_INSET = 50;

/** Extra touch width on each side of a main handle. */
const MAIN_HANDLE_TOUCH_X_EXPAND = 30;

/** Extra touch height below a main handle. */
const MAIN_HANDLE_TOUCH_Y_EXPAND = 60;

/** Extra touch width on each side of a middle handle. */
const MIDDLE_HANDLE_TOUCH_X_EXPAND = 30;

/** View-pixel gap between a pipe-head rim and its rim handle. */
const RIM_HANDLE_OFFSET = 2;

/** Metres the handle moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 1.5;

/** Model y below which a top handle image is not flipped. */
const HANDLE_FLIP_Y_THRESHOLD = -2;

export type PipeHandlesNodeOptions = {
  readonly layoutBounds: Bounds2;
};

export class PipeHandlesNode extends Node {
  private readonly disposePipeHandlesNode: () => void;

  public constructor(
    pipe: Pipe,
    pipeNode: PipeNode,
    modelViewTransform: ModelViewTransform2,
    accessibleName: TReadOnlyProperty<string>,
    options: PipeHandlesNodeOptions,
  ) {
    super();

    const disposers: Array<() => void> = [];
    const leftSection = pipe.crossSections[0] as PipeCrossSection;
    const rightSection = pipe.crossSections[pipe.crossSections.length - 1] as PipeCrossSection;
    const lastIndex = pipe.crossSections.length - 1;

    const leftMainHandle = createMainHandleImage();
    leftMainHandle.x = options.layoutBounds.minX - LEFT_MAIN_HANDLE_INSET;
    this.addChild(leftMainHandle);
    createMainDragListener(leftMainHandle, leftSection, pipeNode.leftPipeFront, modelViewTransform, disposers);

    const rightMainHandle = createMainHandleImage();
    rightMainHandle.x = options.layoutBounds.maxX - RIGHT_MAIN_HANDLE_INSET;
    this.addChild(rightMainHandle);
    createMainDragListener(rightMainHandle, rightSection, pipeNode.rightPipe, modelViewTransform, disposers);

    for (let index = 0; index < pipe.crossSections.length; index++) {
      const section = pipe.crossSections[index] as PipeCrossSection;
      const isEnd = index === 0 || index === lastIndex;
      const pipeHead = index === 0 ? pipeNode.leftPipeFront : index === lastIndex ? pipeNode.rightPipe : null;

      this.addChild(
        isEnd && pipeHead
          ? createRimHandle(
              section,
              pipeHead,
              modelViewTransform,
              accessibleName,
              disposers,
              pipe.shapeVersionProperty,
              {
                isTop: true,
                moved: section.topYProperty,
                limit: section.bottomYProperty,
              },
            )
          : createMiddleHandle(section, modelViewTransform, accessibleName, disposers, {
              isTop: true,
              moved: section.topYProperty,
              limit: section.bottomYProperty,
            }),
      );

      this.addChild(
        isEnd && pipeHead
          ? createRimHandle(
              section,
              pipeHead,
              modelViewTransform,
              accessibleName,
              disposers,
              pipe.shapeVersionProperty,
              {
                isTop: false,
                moved: section.bottomYProperty,
                limit: section.topYProperty,
              },
            )
          : createMiddleHandle(section, modelViewTransform, accessibleName, disposers, {
              isTop: false,
              moved: section.bottomYProperty,
              limit: section.topYProperty,
            }),
      );
    }

    const syncMainHandleY = () => {
      leftMainHandle.centerY = pipeNode.leftPipeFront.centerY;
      rightMainHandle.centerY = pipeNode.rightPipe.centerY;
    };
    const mainHandleMultilink = Multilink.multilinkAny([pipe.shapeVersionProperty], syncMainHandleY);
    syncMainHandleY();

    this.disposePipeHandlesNode = () => {
      mainHandleMultilink.dispose();
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

function createMainHandleImage(): Image {
  const handle = new Image(handleWithBarImage, {
    cursor: "pointer",
    scale: HANDLE_IMAGE_SCALE,
  });
  const bounds = handle.localBounds;
  handle.touchArea = new Bounds2(
    bounds.minX - MAIN_HANDLE_TOUCH_X_EXPAND,
    bounds.minY + 25,
    bounds.maxX + MAIN_HANDLE_TOUCH_X_EXPAND,
    bounds.maxY + MAIN_HANDLE_TOUCH_Y_EXPAND,
  );
  return handle;
}

function createMainDragListener(
  handle: Image,
  section: PipeCrossSection,
  pipeHeadNode: Node,
  modelViewTransform: ModelViewTransform2,
  disposers: Array<() => void>,
): void {
  let initialTopY = 0;
  let initialBottomY = 0;

  const dragListener = new DragListener({
    transform: modelViewTransform,
    start: () => {
      initialTopY = section.topYProperty.value;
      initialBottomY = section.bottomYProperty.value;
    },
    drag: (_event, listener) => {
      const halfHeight = (initialTopY - initialBottomY) / 2;
      let centerY = (initialTopY + initialBottomY) / 2 + listener.modelDelta.y;
      centerY = Math.max(MIN_PIPE_Y + halfHeight, Math.min(MAX_PIPE_Y - halfHeight, centerY));
      section.topYProperty.value = centerY + halfHeight;
      section.bottomYProperty.value = centerY - halfHeight;
      handle.centerY = pipeHeadNode.centerY;
    },
  });
  handle.addInputListener(dragListener);
  disposers.push(() => dragListener.dispose());
}

function createHandleImage(modelY: number): Image {
  const imageRotation = modelY < HANDLE_FLIP_Y_THRESHOLD ? 0 : Math.PI;
  const imageLeft = modelY < HANDLE_FLIP_Y_THRESHOLD ? -13 : 19;

  const image = new Image(handleWithBarImage, {
    left: imageLeft,
    cursor: "ns-resize",
    scale: HANDLE_IMAGE_SCALE,
    rotation: imageRotation,
  });

  return image;
}

function createMiddleHandle(
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
  const image = createHandleImage(config.moved.value);
  image.touchArea = config.isTop
    ? new Bounds2(
        image.localBounds.minX - MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.minY,
        image.localBounds.maxX + MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.maxY + 40,
      )
    : new Bounds2(
        image.localBounds.minX - MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.minY + 30,
        image.localBounds.maxX + MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.maxY + 60,
      );

  const wrapper = new Node({
    children: [image],
    tagName: "div",
    focusable: true,
    accessibleName: accessibleName,
  });

  attachVerticalDrag(wrapper, section, modelViewTransform, config, disposers);

  const syncFromModel = (y: number) => {
    wrapper.center = modelViewTransform.modelToViewPosition(new Vector2(section.x, y));
    updateHandleImage(image, y);
  };
  config.moved.link(syncFromModel);
  disposers.push(() => config.moved.unlink(syncFromModel));

  return wrapper;
}

function createRimHandle(
  section: PipeCrossSection,
  pipeHead: Node,
  modelViewTransform: ModelViewTransform2,
  accessibleName: TReadOnlyProperty<string>,
  disposers: Array<() => void>,
  shapeVersionProperty: Pipe["shapeVersionProperty"],
  config: {
    readonly isTop: boolean;
    readonly moved: PipeCrossSection["topYProperty"];
    readonly limit: PipeCrossSection["topYProperty"];
  },
): Node {
  const image = createHandleImage(config.moved.value);
  image.touchArea = config.isTop
    ? new Bounds2(
        image.localBounds.minX - MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.minY,
        image.localBounds.maxX + MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.maxY + 40,
      )
    : new Bounds2(
        image.localBounds.minX - MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.minY + 30,
        image.localBounds.maxX + MIDDLE_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.maxY + 60,
      );

  const wrapper = new Node({
    children: [image],
    tagName: "div",
    focusable: true,
    accessibleName: accessibleName,
  });

  attachVerticalDrag(wrapper, section, modelViewTransform, config, disposers);

  const syncRimPosition = () => {
    wrapper.centerX = modelViewTransform.modelToViewX(section.x);
    if (config.isTop) {
      wrapper.bottom = pipeHead.top + RIM_HANDLE_OFFSET;
    } else {
      wrapper.top = pipeHead.bottom - RIM_HANDLE_OFFSET;
    }
    updateHandleImage(image, config.moved.value);
  };

  const rimMultilink = Multilink.multilinkAny(
    [shapeVersionProperty, section.topYProperty, section.bottomYProperty],
    syncRimPosition,
  );
  syncRimPosition();
  disposers.push(() => rimMultilink.dispose());

  return wrapper;
}

function updateHandleImage(image: Image, modelY: number): void {
  image.rotation = modelY < HANDLE_FLIP_Y_THRESHOLD ? 0 : Math.PI;
  image.left = modelY < HANDLE_FLIP_Y_THRESHOLD ? -13 : 19;
}

function attachVerticalDrag(
  wrapper: Node,
  section: PipeCrossSection,
  modelViewTransform: ModelViewTransform2,
  config: {
    readonly isTop: boolean;
    readonly moved: PipeCrossSection["topYProperty"];
    readonly limit: PipeCrossSection["topYProperty"];
  },
  disposers: Array<() => void>,
): void {
  const constrain = (point: Vector2): Vector2 => {
    const y = config.isTop
      ? Math.max(config.limit.value + MIN_PIPE_HEIGHT, Math.min(MAX_PIPE_Y, point.y))
      : Math.max(MIN_PIPE_Y, Math.min(config.limit.value - MIN_PIPE_HEIGHT, point.y));
    return new Vector2(section.x, y);
  };

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
  wrapper.addInputListener(dragListener);

  const keyboardDragListener = new KeyboardDragListener({
    positionProperty: dragPositionProperty,
    transform: modelViewTransform,
    dragBoundsProperty: dragBoundsProperty,
    mapPosition: constrain,
    dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
    shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
  });
  wrapper.addInputListener(keyboardDragListener);

  disposers.push(() => {
    dragPositionProperty.unlink(syncToModel);
    config.limit.unlink(limitListener);
    dragListener.dispose();
    keyboardDragListener.dispose();
  });
}
