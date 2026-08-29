/**
 * FPAFRulerNode.ts
 *
 * A vertical ruler the student drags around to measure depths and heights.
 *
 * It is vertical because every distance that matters in this sim is vertical:
 * depth below a surface, height of a tank, the head driving a jet. It is dragged
 * rather than fixed to the pool because the same ruler has to serve a pool three
 * metres deep and a water tower twenty metres tall.
 *
 * The ruler re-graduates itself when the unit system changes — a metric ruler
 * showing a depth in feet would be worse than useless.
 */

import { type EnumerationProperty, Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, Font, KeyboardDragListener, Node } from "scenerystack/scenery";
import { RulerNode } from "scenerystack/scenery-phet";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { toDisplayValue, type UnitLabelGroups, type UnitSystem } from "../model/units.js";

/** Width of the ruler body, view pixels. */
const RULER_WIDTH = 42;

/** Font for the ruler's numbers and its unit label. */
const TICK_FONT = new Font({ size: 11, family: "sans-serif" });

/**
 * Graduations to try, in display units, coarsest-fitting wins. A ruler marked
 * every foot is ideal; one marked every five is still useful; one whose labels
 * overlap is not.
 */
const TICK_INTERVALS = [1, 2, 5, 10];

/** Least spacing between major ticks that keeps their labels legible, view pixels. */
const MIN_MAJOR_TICK_SPACING = 34;

/** Metres the ruler moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 3;

export class FPAFRulerNode extends Node {
  private readonly disposeFPAFRulerNode: () => void;

  /**
   * @param positionProperty - the ruler's zero mark, in model coordinates
   * @param lengthInMeters - how much of the world the ruler spans
   * @param unitSystemProperty - which units to graduate in
   * @param unitLabelGroups - localized unit abbreviations
   * @param modelViewTransform - model → view
   * @param dragBounds - where the zero mark may go, model coordinates
   * @param accessibleName - name announced for the ruler
   */
  public constructor(
    positionProperty: Property<Vector2>,
    lengthInMeters: number,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    modelViewTransform: ModelViewTransform2,
    dragBounds: Bounds2,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    super({
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: accessibleName,
    });

    const viewLength = -modelViewTransform.modelToViewDeltaY(lengthInMeters);

    // Rebuilt rather than relabelled on a unit change: the graduation changes
    // too, since four metres and thirteen feet are not the same ruler.
    const rebuild = () => {
      const system = unitSystemProperty.value;
      const unitsProperty = system.labels(unitLabelGroups).distanceStringProperty;
      const totalInUnits = toDisplayValue(system.distance, lengthInMeters);

      // Pick the coarsest graduation that still fits: 4 m reads naturally at one
      // tick per metre, but the same ruler is 13 ft, and thirteen labels in that
      // space collide with each other and with the units label.
      const interval =
        TICK_INTERVALS.find((candidate) => (viewLength * candidate) / totalInUnits >= MIN_MAJOR_TICK_SPACING) ??
        (TICK_INTERVALS[TICK_INTERVALS.length - 1] as number);

      const majorTickCount = Math.max(2, Math.floor(totalInUnits / interval) + 1);
      const majorTickSpacing = (viewLength * interval) / totalInUnits;
      const labels = Array.from({ length: majorTickCount }, (_, i) => (i === 0 ? "" : String(i * interval)));

      const ruler = new RulerNode(viewLength, RULER_WIDTH, majorTickSpacing, labels, unitsProperty, {
        backgroundFill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
        backgroundStroke: FluidPressureAndFlowColors.panelBorderColorProperty,
        majorTickStroke: FluidPressureAndFlowColors.textColorProperty,
        minorTickStroke: FluidPressureAndFlowColors.textColorProperty,
        majorTickFont: TICK_FONT,
        unitsFont: TICK_FONT,
        insetsWidth: 0,
        minorTicksPerMajorTick: 4,
        tickMarksOnBottom: false,
        // Second tick from the zero end, where there is always room; the last
        // tick may sit hard against the end of a ruler that does not divide
        // evenly into whole units.
        unitsMajorTickIndex: 1,
      });

      // Built horizontally, then stood on end so its zero mark is at the top and
      // the numbers read downward — the direction depth is measured in.
      ruler.rotate(Math.PI / 2);

      const previous = this.children[0];
      this.children = [ruler];
      previous?.dispose();
    };

    const rebuildMultilink = Multilink.multilinkAny(
      [
        unitSystemProperty,
        unitLabelGroups.metric.distanceStringProperty,
        unitLabelGroups.english.distanceStringProperty,
      ],
      rebuild,
    );

    const updatePosition = (position: Vector2) => {
      this.leftTop = modelViewTransform.modelToViewPosition(position);
    };
    positionProperty.link(updatePosition);

    const dragBoundsProperty = new Property(dragBounds);

    const dragListener = new DragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      start: () => this.moveToFront(),
    });
    this.addInputListener(dragListener);

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / 4,
      start: () => this.moveToFront(),
    });
    this.addInputListener(keyboardDragListener);

    this.disposeFPAFRulerNode = () => {
      rebuildMultilink.dispose();
      positionProperty.unlink(updatePosition);
      dragListener.dispose();
      keyboardDragListener.dispose();
    };
  }

  public override dispose(): void {
    this.disposeFPAFRulerNode();
    super.dispose();
  }
}
