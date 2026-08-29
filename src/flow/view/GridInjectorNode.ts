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

import { DerivedProperty, Multilink, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Image, Node } from "scenerystack/scenery";
import { RoundPushButton } from "scenerystack/sun";
import { injectorBulbImage } from "../../common/view/images.js";
import type { Pipe } from "../model/Pipe.js";

/** Radius of the plunger head, view pixels. */
const PLUNGER_RADIUS = 25;

/** Model x where the injector sits, from the HTML5 reference. */
const INJECTOR_MODEL_X = -6;

/** View-pixel offset from the pipe mouth to the bulb artwork. */
const INJECTOR_X_OFFSET = 50;

/** View-pixel offset above the pipe ceiling to the bulb artwork. */
const INJECTOR_Y_OFFSET = 150;

const BULB_SCALE = 0.35;

export class GridInjectorNode extends Node {
  private readonly disposeGridInjectorNode: () => void;

  public constructor(
    cooldownProperty: NumberProperty,
    inject: () => void,
    pipe: Pipe,
    modelViewTransform: ModelViewTransform2,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    super();

    const isReadyProperty = new DerivedProperty([cooldownProperty], (cooldown) => cooldown <= 0);

    const bulb = new Image(injectorBulbImage, { scale: BULB_SCALE });

    const button = new RoundPushButton({
      content: new Circle(PLUNGER_RADIUS, { fill: "red" }),
      listener: inject,
      enabledProperty: isReadyProperty,
      baseColor: "red",
      stroke: "red",
      accessibleName: accessibleName,
      centerX: bulb.centerX,
      top: bulb.top + 31,
      touchAreaDilation: 10,
    });

    this.children = [bulb, button];

    const reposition = () => {
      const section = pipe.getCrossSectionAt(INJECTOR_MODEL_X);
      this.setTranslation(
        modelViewTransform.modelToViewX(INJECTOR_MODEL_X) - INJECTOR_X_OFFSET,
        modelViewTransform.modelToViewY(section.topY) - INJECTOR_Y_OFFSET,
      );
    };

    const positionMultilink = Multilink.multilinkAny([pipe.shapeVersionProperty], reposition);
    reposition();

    this.disposeGridInjectorNode = () => {
      isReadyProperty.dispose();
      positionMultilink.dispose();
      button.dispose();
    };
  }

  public override dispose(): void {
    this.disposeGridInjectorNode();
    super.dispose();
  }
}
