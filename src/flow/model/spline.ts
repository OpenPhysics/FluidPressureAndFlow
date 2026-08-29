/**
 * spline.ts
 *
 * A natural cubic spline through a set of knots, evaluated as y(x).
 *
 * The pipe on the Flow screen is defined by seven cross-sections the student
 * drags up and down. Joining them with straight lines would put a corner at
 * every handle, and a corner in the wall is a discontinuity in the
 * cross-sectional area — which means a discontinuity in the speed, which means
 * particles that teleport. A cubic spline gives a wall with continuous curvature,
 * so the velocity field it implies is smooth too.
 *
 * "Natural" means the second derivative is zero at both ends, so the pipe leaves
 * the last handle straight rather than flaring.
 *
 * This replaces upstream's dependency on a bundled copy of numeric.js, which was
 * a global rather than a module and was duplicated across two PhET repos
 * (phetsims/fluid-pressure-and-flow#206).
 */

/** A spline fitted to a fixed set of knots. Immutable; refit when the knots move. */
export class CubicSpline {
  private readonly xs: readonly number[];
  private readonly ys: readonly number[];

  /** Second derivatives at each knot, from the tridiagonal solve. */
  private readonly secondDerivatives: readonly number[];

  /**
   * @param xs - knot abscissae, strictly increasing
   * @param ys - knot ordinates, same length as xs
   */
  public constructor(xs: readonly number[], ys: readonly number[]) {
    if (xs.length !== ys.length) {
      throw new Error("spline needs one y for every x");
    }
    if (xs.length < 2) {
      throw new Error("spline needs at least two knots");
    }

    this.xs = xs;
    this.ys = ys;
    this.secondDerivatives = CubicSpline.solveSecondDerivatives(xs, ys);
  }

  /**
   * Solves the tridiagonal system for the second derivative at each knot.
   *
   * Standard Thomas algorithm on the natural-spline system: continuity of the
   * first derivative at each interior knot gives one equation per interior knot,
   * and the natural end conditions pin the two ends to zero.
   */
  private static solveSecondDerivatives(xs: readonly number[], ys: readonly number[]): number[] {
    const n = xs.length;
    const secondDerivatives = new Array<number>(n).fill(0);
    const u = new Array<number>(n).fill(0);

    for (let i = 1; i < n - 1; i++) {
      const xPrev = xs[i - 1] as number;
      const xThis = xs[i] as number;
      const xNext = xs[i + 1] as number;
      const yPrev = ys[i - 1] as number;
      const yThis = ys[i] as number;
      const yNext = ys[i + 1] as number;

      const sigma = (xThis - xPrev) / (xNext - xPrev);
      const p = sigma * (secondDerivatives[i - 1] as number) + 2;
      secondDerivatives[i] = (sigma - 1) / p;
      const slopeDifference = (yNext - yThis) / (xNext - xThis) - (yThis - yPrev) / (xThis - xPrev);
      u[i] = (6 * slopeDifference) / (xNext - xPrev) - (sigma * (u[i - 1] as number)) / p;
    }

    for (let i = n - 2; i >= 0; i--) {
      secondDerivatives[i] = (secondDerivatives[i] as number) * (secondDerivatives[i + 1] as number) + (u[i] as number);
    }
    return secondDerivatives;
  }

  /**
   * The spline's value at x. Outside the knot range the value is clamped to the
   * nearest end knot, which is what the pipe wants: nothing sensible lives
   * beyond the last cross-section.
   */
  public evaluate(x: number): number {
    const n = this.xs.length;
    const first = this.xs[0] as number;
    const last = this.xs[n - 1] as number;
    if (x <= first) {
      return this.ys[0] as number;
    }
    if (x >= last) {
      return this.ys[n - 1] as number;
    }

    // Binary search for the interval containing x.
    let low = 0;
    let high = n - 1;
    while (high - low > 1) {
      const mid = (high + low) >> 1;
      if ((this.xs[mid] as number) > x) {
        high = mid;
      } else {
        low = mid;
      }
    }

    const xLow = this.xs[low] as number;
    const xHigh = this.xs[high] as number;
    const h = xHigh - xLow;
    const a = (xHigh - x) / h;
    const b = (x - xLow) / h;
    const dLow = this.secondDerivatives[low] as number;
    const dHigh = this.secondDerivatives[high] as number;

    return (
      a * (this.ys[low] as number) +
      b * (this.ys[high] as number) +
      (((a * a * a - a) * dLow + (b * b * b - b) * dHigh) * h * h) / 6
    );
  }
}
