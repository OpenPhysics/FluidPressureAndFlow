/**
 * MassModel.ts
 *
 * One of the three weights the student stacks on the narrow column of the
 * chamber pool.
 *
 * Position is tracked as the centre of the block's *bottom* edge, because every
 * question the model asks about a mass is about its underside: has it reached
 * the ground, is it resting on the water, is another block sitting on top of it.
 */

import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";

export class MassModel {
  /** Centre of the block's bottom edge, in model coordinates (metres). */
  public readonly positionProperty: Property<Vector2>;

  /** Vertical velocity, m/s. Non-zero only while falling or being pushed by the water. */
  public readonly velocityProperty = new NumberProperty(0, { units: "m/s" });

  /** True while the student is holding this block. */
  public readonly isDraggingProperty = new BooleanProperty(false);

  /** How heavy the block is, kilograms. */
  public readonly mass: number;

  /** Width of the block, metres. */
  public readonly width: number;

  /** Height of the block, metres. */
  public readonly height: number;

  /**
   * @param mass - kilograms
   * @param width - metres
   * @param height - metres
   * @param initialPosition - centre of the bottom edge, metres
   */
  public constructor(mass: number, width: number, height: number, initialPosition: Vector2) {
    this.mass = mass;
    this.width = width;
    this.height = height;
    this.positionProperty = new Property(initialPosition);
  }

  /** Altitude of the block's underside, metres. */
  public getBottomY(): number {
    return this.positionProperty.value.y;
  }

  /** Altitude of the block's top face, metres. */
  public getTopY(): number {
    return this.positionProperty.value.y + this.height;
  }

  /** Moves the block so its underside sits at the given altitude, keeping x. */
  public setBottomY(y: number): void {
    this.positionProperty.value = new Vector2(this.positionProperty.value.x, y);
  }

  /** The block's footprint, for hit-testing against a pool opening. */
  public getBounds(): Bounds2 {
    const position = this.positionProperty.value;
    return new Bounds2(position.x - this.width / 2, position.y, position.x + this.width / 2, position.y + this.height);
  }

  public reset(): void {
    this.positionProperty.reset();
    this.velocityProperty.reset();
    this.isDraggingProperty.reset();
  }
}
