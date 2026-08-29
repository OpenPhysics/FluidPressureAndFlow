/**
 * PoolFaucetsNode.ts
 *
 * The tap above a pool and the drain below it, together with the columns of
 * water running out of each.
 *
 * Filling and draining is how a student changes the depth, and depth is the
 * whole screen. Making that a tap rather than a slider matters: a slider labelled
 * "water level" would give away the answer, whereas a tap makes the level
 * something the student watches rise while the barometer climbs with it.
 *
 * The falling column is drawn, not simulated. Its only job is to say "water is
 * moving, in this direction, at about this rate", and a real free-surface flow
 * would cost far more than that is worth.
 */

import type { NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { DerivedProperty, Multilink } from "scenerystack/axon";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Rectangle } from "scenerystack/scenery";
import { FaucetNode } from "scenerystack/scenery-phet";
import { getFluidColor } from "../../common/model/fluidColor.js";
import { MAX_POOL_HEIGHT } from "../../FluidPressureAndFlowConstants.js";
import type { PoolWithFaucetsModel } from "../model/PoolWithFaucetsModel.js";

/**
 * Length of the supply pipe feeding the fill tap, view pixels. Long enough to
 * run off the left of the screen, so the water reads as coming from the mains
 * rather than from a floating spout.
 */
const SUPPLY_PIPE_LENGTH = 900;

/**
 * Length of the drain's pipe. Just long enough to read as a stub emerging from
 * the pool wall: it is anchored by its spout, so any extra length runs back
 * *into* the pool, drawing a pipe across the water the student is measuring.
 */
// FaucetNode needs enough room for its 112px spout offset. At the displayed
// scale this remains a compact, 73px drain-pipe stub.
const DRAIN_PIPE_LENGTH = 120;

/** How wide the falling column of water is drawn, view pixels. */
const STREAM_WIDTH = 15;

/** Scale applied to the whole faucet assembly, to fit the pool. */
const FAUCET_SCALE = 0.61;

export type PoolFaucetsNodeOptions = {
  /** Model x the fill tap pours into. */
  readonly inputFaucetX: number;
  /** Model x the drain empties from. */
  readonly drainFaucetX: number;
  /** Accessible name for the fill tap. */
  readonly inputAccessibleName: TReadOnlyProperty<string>;
  /** Accessible name for the drain. */
  readonly drainAccessibleName: TReadOnlyProperty<string>;
};

export class PoolFaucetsNode extends Node {
  private readonly disposePoolFaucetsNode: () => void;

  public constructor(
    pool: PoolWithFaucetsModel,
    fluidDensityProperty: NumberProperty,
    modelViewTransform: ModelViewTransform2,
    options: PoolFaucetsNodeOptions,
  ) {
    super();

    const fluidColorProperty = new DerivedProperty([fluidDensityProperty], (density) => getFluidColor(density).toCSS());

    // ── Fill tap, standing above the ground beside the pool ───────────────────
    const inputFaucet = new FaucetNode(1, pool.inputFaucet.flowRateProperty, pool.inputFaucet.isEnabledProperty, {
      horizontalPipeLength: SUPPLY_PIPE_LENGTH,
      verticalPipeLength: 20,
      scale: FAUCET_SCALE,
      closeOnRelease: false,
      accessibleName: options.inputAccessibleName,
    });
    const inputSpoutX = modelViewTransform.modelToViewX(options.inputFaucetX);
    inputFaucet.right = inputSpoutX + 25;
    inputFaucet.bottom = modelViewTransform.modelToViewY(0) - 32;

    // The column from the spout down to the water surface, so it always lands on
    // the water rather than passing through it or stopping short.
    const inputStream = new Rectangle(0, 0, STREAM_WIDTH, 0, { fill: fluidColorProperty });
    const inputStreamMultilink = Multilink.multilinkAny(
      [pool.inputFaucet.flowRateProperty, pool.waterLevelProperty],
      () => {
        const flowRate = pool.inputFaucet.flowRateProperty.value;
        inputStream.visible = flowRate > 0;
        if (flowRate <= 0) {
          return;
        }
        const top = inputFaucet.bottom - 2;
        const bottom = modelViewTransform.modelToViewY(pool.getWaterSurfaceY());
        inputStream.setRect(0, 0, STREAM_WIDTH * flowRate, Math.max(0, bottom - top));
        inputStream.centerX = inputSpoutX;
        inputStream.top = top;
      },
    );

    // ── Drain, below the floor of the pool ────────────────────────────────────
    const drainFaucet = new FaucetNode(1, pool.drainFaucet.flowRateProperty, pool.drainFaucet.isEnabledProperty, {
      horizontalPipeLength: DRAIN_PIPE_LENGTH,
      verticalPipeLength: 16,
      scale: FAUCET_SCALE,
      closeOnRelease: false,
      accessibleName: options.drainAccessibleName,
    });
    // FaucetNode draws its supply pipe to the left of the spout, so anchoring by
    // the node's right edge is what puts the spout where it was asked to go.
    const drainSpoutX = modelViewTransform.modelToViewX(options.drainFaucetX);
    drainFaucet.right = drainSpoutX + 25;
    // Anchored by its spout just under the pool floor, so the drain reads as taking
    // water from the bottom of the pool however deep the pool is drawn — and so the
    // assembly cannot run off the bottom of the screen.
    drainFaucet.bottom = modelViewTransform.modelToViewY(-MAX_POOL_HEIGHT) + 37;

    // Water leaving the drain runs off the bottom of the screen; the column is
    // drawn long enough to reach it from wherever the pool floor sits.
    const drainStream = new Rectangle(0, 0, STREAM_WIDTH, 0, { fill: fluidColorProperty });
    const drainStreamMultilink = Multilink.multilinkAny([pool.drainFaucet.flowRateProperty], () => {
      const flowRate = pool.drainFaucet.flowRateProperty.value;
      drainStream.visible = flowRate > 0;
      if (flowRate <= 0) {
        return;
      }
      drainStream.setRect(0, 0, STREAM_WIDTH * flowRate, 490);
      drainStream.centerX = drainSpoutX;
      drainStream.top = drainFaucet.bottom - 2;
    });

    this.children = [inputStream, inputFaucet, drainStream, drainFaucet];

    this.disposePoolFaucetsNode = () => {
      inputStreamMultilink.dispose();
      drainStreamMultilink.dispose();
      fluidColorProperty.dispose();
      inputFaucet.dispose();
      drainFaucet.dispose();
    };
  }

  public override dispose(): void {
    this.disposePoolFaucetsNode();
    super.dispose();
  }
}
