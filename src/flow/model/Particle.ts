/**
 * Particle.ts
 *
 * A marker carried along by the fluid: either one of the red dots dripped in
 * continuously, or one cell of the black grid the student can inject.
 *
 * Particles carry no mass and exert no influence — they are tracers, not fluid.
 * Their whole job is to make the velocity field visible, which is what turns
 * "the pipe narrows, so the fluid speeds up" from a claim into an observation.
 *
 * The vertical position is stored as a *fraction* of the way up the pipe, not as
 * a y. A particle carried into a constriction must be squeezed toward the
 * centreline along with the streamlines; keeping the fraction fixed and deriving
 * y from it does that automatically, whereas tracking y would let particles pass
 * through the wall as the pipe closes around them.
 */

import type { Pipe } from "./Pipe.js";

export class Particle {
  /** Distance along the pipe, metres. */
  public x: number;

  /** Height as a fraction of the pipe's local height: 0 at the floor, 1 at the ceiling. */
  public readonly fractionToTop: number;

  /** Drawn radius, metres. */
  public readonly radius: number;

  /** True for the injected grid, false for the continuous drip. */
  public readonly isGridParticle: boolean;

  public constructor(x: number, fractionToTop: number, radius: number, isGridParticle: boolean) {
    this.x = x;
    this.fractionToTop = fractionToTop;
    this.radius = radius;
    this.isGridParticle = isGridParticle;
  }

  /** Current altitude, metres, derived from the pipe's shape at this x. */
  public getY(pipe: Pipe): number {
    return pipe.fractionToY(this.x, this.fractionToTop);
  }
}
