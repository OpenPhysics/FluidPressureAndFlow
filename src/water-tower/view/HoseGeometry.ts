/**
 * HoseGeometry.ts
 *
 * Key points along the hose centreline, computed together so the view can
 * build the same U-shaped path PhET's Java port used. Ported from
 * edu.colorado.phet.fluidpressureandflow.watertower.view.HoseGeometry.
 */

import { clamp, Vector2 } from "scenerystack/dot";
import { LineStyles, Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";

/** Length of the nozzle beyond the last bend, metres — matches {@link HoseNode}. */
export const HOSE_NOZZLE_LENGTH = 2.4;

export type HoseGeometryPoints = {
  readonly startPoint: Vector2;
  readonly nozzleInput: Vector2;
  readonly prePoint: Vector2;
  readonly rightOfTower: Vector2;
  readonly bottomLeft: Vector2;
};

export function getHoseGeometryPoints(
  attachment: Vector2,
  holeSize: number,
  outlet: Vector2,
  angle: number,
): HoseGeometryPoints {
  const nozzleInput = outlet.plus(Vector2.createPolar(HOSE_NOZZLE_LENGTH, angle + Math.PI));
  const delta = nozzleInput.minus(outlet);
  const prePoint = nozzleInput.plus(delta);
  const startPoint = new Vector2(attachment.x, attachment.y + holeSize / 2);
  const rightOfTower = new Vector2(startPoint.x + 2, startPoint.y);
  const bottomLeft = new Vector2(rightOfTower.x, prePoint.y);
  return { startPoint, nozzleInput, prePoint, rightOfTower, bottomLeft };
}

/** Midpoint of the vertical segment — where the height drag handle sits. */
export function getHoseHeightHandlePoint(geometry: HoseGeometryPoints): Vector2 {
  return geometry.bottomLeft.plus(geometry.prePoint).times(0.5);
}

/** Centreline path in model coordinates, following PhET's piecewise/quad logic. */
export function createHoseCenterlineShape(
  attachment: Vector2,
  holeSize: number,
  outlet: Vector2,
  angle: number,
): Shape {
  const { startPoint, nozzleInput, prePoint, rightOfTower, bottomLeft } = getHoseGeometryPoints(
    attachment,
    holeSize,
    outlet,
    angle,
  );

  const shape = new Shape();
  shape.moveToPoint(startPoint);

  const curveAmount = clamp(bottomLeft.y - rightOfTower.y, -1, 1);
  if (Math.abs(curveAmount) < 0.75) {
    shape.lineToPoint(bottomLeft);
  } else {
    shape.lineToPoint(rightOfTower.plusXY(-1, 0));
    shape.quadraticCurveToPoint(rightOfTower, rightOfTower.plusXY(0, curveAmount));
    shape.lineToPoint(bottomLeft.plusXY(0, -curveAmount));
    shape.quadraticCurveToPoint(bottomLeft, bottomLeft.plusXY(1, 0));
  }

  shape.lineToPoint(prePoint.plusXY(-1, 0));
  shape.quadraticCurveToPoint(prePoint, nozzleInput);
  return shape;
}

/** View-space filled hose shape: a stroked centreline turned into a thick band. */
export function createHoseViewShape(
  attachment: Vector2,
  holeSize: number,
  outlet: Vector2,
  angle: number,
  modelViewTransform: ModelViewTransform2,
  hoseViewWidth: number,
): Shape {
  const centerline = createHoseCenterlineShape(attachment, holeSize, outlet, angle);
  const viewCenterline = modelViewTransform.modelToViewShape(centerline);
  return viewCenterline.getStrokedShape(
    new LineStyles({ lineWidth: hoseViewWidth, lineCap: "butt", lineJoin: "miter" }),
  );
}
