/**
 * WaterDrop.ts
 *
 * One blob of water in flight — either falling from the faucet into the tank, or
 * leaving the hole and arcing away.
 *
 * Drops are spheres of a definite volume rather than an abstract stream, because
 * the volume is doing real work: the tank loses exactly what the drops carry
 * away, so a student watching the level fall is watching conservation, not an
 * animation that happens to run alongside it.
 */

import { Vector2 } from "scenerystack/dot";

export class WaterDrop {
  /** Centre of the drop, model coordinates (metres). */
  public position: Vector2;

  /** Velocity, m/s. */
  public velocity: Vector2;

  /** Volume of fluid this drop carries, m³. */
  public readonly volume: number;

  public constructor(position: Vector2, velocity: Vector2, volume: number) {
    this.position = position;
    this.velocity = velocity;
    this.volume = volume;
  }

  /** Radius of the drop drawn as a sphere of its volume, metres. */
  public getRadius(): number {
    return Math.cbrt((3 * this.volume) / (4 * Math.PI));
  }

  /** Advances the drop one step of ballistic flight. */
  public step(dt: number, gravity: number): void {
    this.velocity = new Vector2(this.velocity.x, this.velocity.y - gravity * dt);
    this.position = this.position.plus(this.velocity.timesScalar(dt));
  }
}
