/**
 * ParticleCanvasNode.ts
 *
 * Draws the tracer dots.
 *
 * Canvas rather than a Node per particle: there can be several hundred dots in
 * the pipe at once, all of them moving every frame, and a scene graph node
 * apiece means several hundred transform updates and repaints per frame. Upstream
 * has a long-standing performance complaint about exactly this
 * (phetsims/fluid-pressure-and-flow#140, #254). One canvas repaint is cheaper and
 * scales flat with the particle count.
 *
 * The injected grid is drawn after the drip so a black grid cell is never hidden
 * behind a red dot — the grid is the thing being read, and it only works if it is
 * legible as a grid.
 */

import type { Bounds2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CanvasNode } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import type { FlowModel } from "../model/FlowModel.js";

export class ParticleCanvasNode extends CanvasNode {
  private readonly model: FlowModel;
  private readonly modelViewTransform: ModelViewTransform2;

  public constructor(model: FlowModel, modelViewTransform: ModelViewTransform2, canvasBounds: Bounds2) {
    super({ canvasBounds: canvasBounds });
    this.model = model;
    this.modelViewTransform = modelViewTransform;
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    // Two passes rather than one sort: the ordering only ever has two levels, and
    // sorting several hundred particles every frame to express that would cost
    // more than the second pass does.
    // Read the profile colours here rather than holding them: a canvas fillStyle
    // is a string, so the value has to be resolved at paint time anyway, and the
    // repaint that follows a profile switch picks up the new one for free.
    this.paintParticles(context, false, FluidPressureAndFlowColors.tracerDotColorProperty.value.toCSS());
    this.paintParticles(context, true, FluidPressureAndFlowColors.gridTracerColorProperty.value.toCSS());
  }

  private paintParticles(context: CanvasRenderingContext2D, gridParticles: boolean, color: string): void {
    context.fillStyle = color;
    for (const particle of this.model.particles) {
      if (particle.isGridParticle !== gridParticles) {
        continue;
      }
      const y = particle.getY(this.model.pipe);
      const center = this.modelViewTransform.modelToViewXY(particle.x, y);
      const radius = this.modelViewTransform.modelToViewDeltaX(particle.radius);
      context.beginPath();
      context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      context.fill();
    }
  }
}
