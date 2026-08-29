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
import {
  GAUGE_RADIUS,
  TIP_HALF_WIDTH as GAUGE_TIP_HALF_WIDTH,
  TIP_HEIGHT as GAUGE_TIP_HEIGHT,
  READOUT_BACKGROUND_CORNER_RADIUS,
  READOUT_BACKGROUND_HEIGHT,
  READOUT_BACKGROUND_WIDTH_RATIO,
  READOUT_OVERLAP_WITH_GAUGE,
  TIP_OVERLAP_WITH_READOUT,
} from "./BarometerNode.js";
import {
  BODY_HEIGHT as SPEEDOMETER_HEIGHT,
  TIP_HALF_WIDTH as SPEEDOMETER_TIP_HALF_WIDTH,
  TIP_HEIGHT as SPEEDOMETER_TIP_HEIGHT,
  BODY_WIDTH as SPEEDOMETER_WIDTH,
} from "./VelocitySensorNode.js";

/** The dash a readout shows when there is nothing to read. */
const NO_READING = "\u2014";

const CAPTION_FONT = "12px sans-serif";
const READOUT_FONT = "bold 12px sans-serif";

// \u2500\u2500 Barometer icon layout, relative to GAUGE_RADIUS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const CAPTION_MAX_WIDTH_RATIO = 1.6;
const CAPTION_Y_OFFSET_RATIO = 0.35;
const NEEDLE_TIP_X_RATIO = 0.3;
const NEEDLE_TIP_Y_RATIO = 0.25;

// \u2500\u2500 Speedometer icon layout, view pixels \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const SPEEDOMETER_BODY_CORNER_RADIUS = 5;
const SPEEDOMETER_CAPTION_HORIZONTAL_INSET = 8;
const SPEEDOMETER_CAPTION_TOP_INSET = 3;
const SPEEDOMETER_READOUT_WIDTH_INSET = 10;
const SPEEDOMETER_READOUT_BOTTOM_INSET = 22;
const SPEEDOMETER_TIP_OVERLAP_WITH_BODY = 2;

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
    maxWidth: GAUGE_RADIUS * CAPTION_MAX_WIDTH_RATIO,
    centerX: 0,
    centerY: -GAUGE_RADIUS * CAPTION_Y_OFFSET_RATIO,
  });

  // Parked a little left of vertical, so the dial reads as an instrument at rest
  // rather than as a blank face.
  const needle = new Line(0, 0, -GAUGE_RADIUS * NEEDLE_TIP_X_RATIO, -GAUGE_RADIUS * NEEDLE_TIP_Y_RATIO, {
    stroke: FluidPressureAndFlowColors.accentColorProperty,
    lineWidth: 2,
  });

  const readout = createReadout(
    GAUGE_RADIUS * READOUT_BACKGROUND_WIDTH_RATIO,
    face.bottom - READOUT_OVERLAP_WITH_GAUGE,
    0,
  );

  const tip = new Path(
    new Shape().moveTo(-GAUGE_TIP_HALF_WIDTH, 0).lineTo(GAUGE_TIP_HALF_WIDTH, 0).lineTo(0, GAUGE_TIP_HEIGHT).close(),
    {
      fill: FluidPressureAndFlowColors.gaugeRimColorProperty,
      top: readout.bottom - TIP_OVERLAP_WITH_READOUT,
      centerX: 0,
    },
  );

  return new Node({ children: [tip, face, caption, needle, readout] });
}

/** The speedometer as it sits in the tray: body, caption, empty readout, pointer. */
export function createSpeedometerIcon(labelProperty: TReadOnlyProperty<string>): Node {
  const body = new Rectangle(
    0,
    0,
    SPEEDOMETER_WIDTH,
    SPEEDOMETER_HEIGHT,
    SPEEDOMETER_BODY_CORNER_RADIUS,
    SPEEDOMETER_BODY_CORNER_RADIUS,
    {
      fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: 2,
    },
  );

  const caption = new Text(labelProperty, {
    font: CAPTION_FONT,
    fill: FluidPressureAndFlowColors.controlSurfaceColorProperty,
    maxWidth: SPEEDOMETER_WIDTH - SPEEDOMETER_CAPTION_HORIZONTAL_INSET,
    centerX: body.centerX,
    top: body.top + SPEEDOMETER_CAPTION_TOP_INSET,
  });

  const readout = createReadout(
    SPEEDOMETER_WIDTH - SPEEDOMETER_READOUT_WIDTH_INSET,
    body.bottom - SPEEDOMETER_READOUT_BOTTOM_INSET,
    body.centerX,
  );

  const tip = new Path(
    new Shape()
      .moveTo(-SPEEDOMETER_TIP_HALF_WIDTH, 0)
      .lineTo(SPEEDOMETER_TIP_HALF_WIDTH, 0)
      .lineTo(0, SPEEDOMETER_TIP_HEIGHT)
      .close(),
    {
      fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
      top: body.bottom - SPEEDOMETER_TIP_OVERLAP_WITH_BODY,
      centerX: body.centerX,
    },
  );

  return new Node({ children: [tip, body, caption, readout] });
}

/** A readout window showing a dash, of the given width, with its top at `top`. */
function createReadout(width: number, top: number, centerX: number): Node {
  const background = new Rectangle(
    0,
    0,
    width,
    READOUT_BACKGROUND_HEIGHT,
    READOUT_BACKGROUND_CORNER_RADIUS,
    READOUT_BACKGROUND_CORNER_RADIUS,
    {
      fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: 2,
      centerX: centerX,
      top: top,
    },
  );
  const dash = new Text(NO_READING, {
    font: READOUT_FONT,
    fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
    center: background.center,
  });
  return new Node({ children: [background, dash] });
}
