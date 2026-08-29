/**
 * GridInjectorNode.ts
 *
 * The plunger that releases a grid of dark tracers at the mouth of the pipe.
 *
 * A grid shows what a single dot cannot: it stretches lengthwise where the fluid
 * speeds up and squeezes across where the pipe narrows, so the student can see
 * the whole velocity field deform at once rather than inferring it from one dot
 * at a time.
 *
 * The button disables itself for a few seconds after firing. Two grids in the
 * pipe at once is just a cloud of dots, and the shape is the whole point.
 */

import type { NumberProperty } from "scenerystack/axon";
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Circle, Node, Rectangle } from "scenerystack/scenery";
import { RoundPushButton } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

/** Radius of the plunger head, view pixels. */
const PLUNGER_RADIUS = 16;

export class GridInjectorNode extends Node {
  private readonly disposeGridInjectorNode: () => void;

  public constructor(cooldownProperty: NumberProperty, inject: () => void, accessibleName: TReadOnlyProperty<string>) {
    super();

    const isReadyProperty = new DerivedProperty([cooldownProperty], (cooldown) => cooldown <= 0);

    const button = new RoundPushButton({
      content: new Circle(PLUNGER_RADIUS, { fill: FluidPressureAndFlowColors.gridTracerColorProperty }),
      listener: inject,
      enabledProperty: isReadyProperty,
      baseColor: FluidPressureAndFlowColors.panelBackgroundColorProperty,
      accessibleName: accessibleName,
      xMargin: 6,
      yMargin: 6,
    });

    // A short stem down to the pipe mouth, so the plunger reads as connected to
    // the thing it injects into rather than floating above it.
    const stem = new Rectangle(0, 0, 8, 26, {
      fill: FluidPressureAndFlowColors.panelBorderColorProperty,
      centerX: button.centerX,
      top: button.bottom - 4,
    });

    this.children = [stem, button];

    this.disposeGridInjectorNode = () => {
      isReadyProperty.dispose();
      button.dispose();
    };
  }

  public override dispose(): void {
    this.disposeGridInjectorNode();
    super.dispose();
  }
}
