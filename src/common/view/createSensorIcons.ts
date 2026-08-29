/**
 * createSensorIcons.ts
 *
 * Stowed pictures of the instruments, for the toolbox tray.
 *
 * These are drawings, not live instruments: a stowed instrument has no reading to
 * show and no position to track, and making it a real BarometerNode would mean a
 * second gauge listening to the model for nothing.
 *
 * They are drawn at the instrument's true size, with its caption and an empty
 * readout, rather than shrunk to a thumbnail. The tray is the only place a student
 * sees the tool before committing to a drag, and a miniature makes them guess: an
 * instrument that comes out of the tray twice the size of its icon reads as a
 * different object. Matching sizes makes the drag a lift rather than a
 * transformation.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

/** Kept in step with `GAUGE_RADIUS` in BarometerNode. */
const GAUGE_RADIUS = 34;

/** Kept in step with `BODY_WIDTH` / `BODY_HEIGHT` in VelocitySensorNode. */
const SPEEDOMETER_SIZE = { width: 76, height: 44 };

/** The dash a readout shows when there is nothing to read. */
const NO_READING = "\u2014";

const CAPTION_FONT = "12px sans-serif";
const READOUT_FONT = "bold 12px sans-serif";

/** The barometer as it sits in the tray: dial, caption, empty readout, tip. */
export function createBarometerIcon(labelProperty: TReadOnlyProperty<string>): Node {
  const face = new Circle(GAUGE_RADIUS, {
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 2,
  });

  const caption = new Text(labelProperty, {
    font: CAPTION_FONT,
    fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
    maxWidth: GAUGE_RADIUS * 1.6,
    centerX: 0,
    centerY: -GAUGE_RADIUS * 0.35,
  });

  // Parked a little left of vertical, so the dial reads as an instrument at rest
  // rather than as a blank face.
  const needle = new Line(0, 0, -GAUGE_RADIUS * 0.3, -GAUGE_RADIUS * 0.25, {
    stroke: FluidPressureAndFlowColors.accentColorProperty,
    lineWidth: 2,
  });

  const readout = createReadout(GAUGE_RADIUS * 2.1, face.bottom - 10, 0);

  const tip = new Path(new Shape().moveTo(-7, 0).lineTo(7, 0).lineTo(0, 12).close(), {
    fill: FluidPressureAndFlowColors.gaugeRimColorProperty,
    top: readout.bottom - 2,
    centerX: 0,
  });

  return new Node({ children: [tip, face, caption, needle, readout] });
}

/** The speedometer as it sits in the tray: body, caption, empty readout, pointer. */
export function createSpeedometerIcon(labelProperty: TReadOnlyProperty<string>): Node {
  const body = new Rectangle(0, 0, SPEEDOMETER_SIZE.width, SPEEDOMETER_SIZE.height, 5, 5, {
    fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 2,
  });

  const caption = new Text(labelProperty, {
    font: CAPTION_FONT,
    fill: FluidPressureAndFlowColors.controlSurfaceColorProperty,
    maxWidth: SPEEDOMETER_SIZE.width - 8,
    centerX: body.centerX,
    top: body.top + 3,
  });

  const readout = createReadout(SPEEDOMETER_SIZE.width - 10, body.bottom - 22, body.centerX);

  const tip = new Path(new Shape().moveTo(-8, 0).lineTo(8, 0).lineTo(0, 12).close(), {
    fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
    top: body.bottom - 2,
    centerX: body.centerX,
  });

  return new Node({ children: [tip, body, caption, readout] });
}

/** A readout window showing a dash, of the given width, with its top at `top`. */
function createReadout(width: number, top: number, centerX: number): Node {
  const background = new Rectangle(0, 0, width, 19, 3, 3, {
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 2,
    centerX: centerX,
    top: top,
  });
  const dash = new Text(NO_READING, {
    font: READOUT_FONT,
    fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
    center: background.center,
  });
  return new Node({ children: [background, dash] });
}
