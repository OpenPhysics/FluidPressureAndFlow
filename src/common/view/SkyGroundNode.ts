/**
 * SkyGroundNode.ts
 *
 * The outdoor backdrop every screen sits in: sky above the ground line, earth
 * below it, and a strip of grass along the boundary.
 *
 * The ground line is not decoration. It is the y = 0 of the model, the altitude
 * at which air pressure is one standard atmosphere, and the reference every
 * depth on the screen is measured from. Making it a hard, visible edge is what
 * lets a student see at a glance whether a barometer is in the air or in the
 * earth — and the sim reports nothing at all for the latter.
 *
 * Scenery-phet ships SkyNode and GroundNode, but they take a gradient end-depth
 * in view units and do not know about the grass line, so the gradients are built
 * here directly against the sim's colour profile.
 */

import { Shape } from "scenerystack/kite";
import { LinearGradient, Node, Path, Rectangle } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

/** Thickness of the grass strip, in view pixels. */
const GRASS_HEIGHT = 6;

export type SkyGroundNodeOptions = {
  /**
   * Gaps in the ground where a pool or pipe opens to the air. Each entry is an
   * x-range in view coordinates; the grass and the topsoil are omitted there so
   * the vessel below reads as genuinely open rather than covered over.
   */
  readonly openings?: ReadonlyArray<{ readonly minX: number; readonly maxX: number }>;
};

export class SkyGroundNode extends Node {
  private readonly groundY: number;
  private readonly extent: { minX: number; maxX: number };
  private readonly openingsLayer = new Node();

  /**
   * @param minX - left edge in view coordinates
   * @param maxX - right edge
   * @param minY - top edge (top of the sky)
   * @param maxY - bottom edge (bottom of the earth)
   * @param groundY - view y of the ground line, i.e. of model y = 0
   */
  public constructor(minX: number, maxX: number, minY: number, maxY: number, groundY: number) {
    super();

    this.groundY = groundY;
    this.extent = { minX, maxX };

    const width = maxX - minX;

    const sky = new Rectangle(minX, minY, width, groundY - minY, {
      fill: new LinearGradient(0, minY, 0, groundY)
        .addColorStop(0, FluidPressureAndFlowColors.skyTopColorProperty)
        .addColorStop(1, FluidPressureAndFlowColors.backgroundColorProperty),
    });

    const ground = new Rectangle(minX, groundY, width, maxY - groundY, {
      fill: new LinearGradient(0, groundY, 0, maxY)
        .addColorStop(0, FluidPressureAndFlowColors.groundTopColorProperty)
        .addColorStop(1, FluidPressureAndFlowColors.groundBottomColorProperty),
    });

    this.addChild(sky);
    this.addChild(ground);
    this.addChild(this.openingsLayer);
    this.setOpenings([]);
  }

  /**
   * Redraws the grass so it skips the given openings.
   *
   * Called whenever the scene changes shape — switching pools on the Under
   * Pressure screen moves the openings — rather than rebuilding the whole
   * backdrop, since the sky and the earth behind it never change.
   */
  public setOpenings(openings: ReadonlyArray<{ readonly minX: number; readonly maxX: number }>): void {
    const sorted = [...openings].sort((a, b) => a.minX - b.minX);
    const grass = new Shape();

    let x = this.extent.minX;
    for (const opening of sorted) {
      if (opening.minX > x) {
        grass.rect(x, this.groundY, opening.minX - x, GRASS_HEIGHT);
      }
      x = Math.max(x, opening.maxX);
    }
    if (x < this.extent.maxX) {
      grass.rect(x, this.groundY, this.extent.maxX - x, GRASS_HEIGHT);
    }

    this.openingsLayer.children = [new Path(grass, { fill: FluidPressureAndFlowColors.grassColorProperty })];
  }
}
