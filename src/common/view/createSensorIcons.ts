/**
 * createSensorIcons.ts
 *
 * Static pictures of the instruments, for the toolbox tray.
 *
 * These are drawings, not live instruments: a tray icon has no reading to show
 * and no position to track, and making it a real BarometerNode would mean a
 * second gauge listening to the model for nothing. They exist only to be
 * recognisable enough that the student knows what they are about to drag out.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

/** Radius of the tray-sized dial, view pixels. */
const ICON_RADIUS = 15;

/** A dial with a needle and a pointed tip — the barometer in miniature. */
export function createBarometerIcon(): Node {
  const face = new Circle(ICON_RADIUS, {
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 2,
  });

  // Parked a little left of vertical, so the icon reads as a gauge showing
  // something rather than as a blank dial.
  const needle = new Line(0, 0, -ICON_RADIUS * 0.45, -ICON_RADIUS * 0.6, {
    stroke: FluidPressureAndFlowColors.accentColorProperty,
    lineWidth: 2,
  });

  const tip = new Path(new Shape().moveTo(-4, 0).lineTo(4, 0).lineTo(0, 8).close(), {
    fill: FluidPressureAndFlowColors.gaugeRimColorProperty,
    top: face.bottom - 3,
    centerX: 0,
  });

  return new Node({ children: [tip, face, needle] });
}

/** A rounded readout body with a pointer below it — the speedometer in miniature. */
export function createSpeedometerIcon(): Node {
  const body = new Rectangle(0, 0, 34, 22, 4, 4, {
    fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 2,
  });

  const window = new Rectangle(0, 0, 24, 10, 2, 2, {
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    center: body.center,
  });

  const tip = new Path(new Shape().moveTo(-5, 0).lineTo(5, 0).lineTo(0, 8).close(), {
    fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
    top: body.bottom - 1,
    centerX: body.centerX,
  });

  return new Node({ children: [body, window, tip] });
}
