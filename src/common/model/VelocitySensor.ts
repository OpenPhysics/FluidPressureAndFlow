/**
 * VelocitySensor.ts
 *
 * A speedometer. Reads a velocity vector in m/s; `null` means the probe is
 * somewhere the sim does not model a flow — outside the pipe, or in still air.
 *
 * The reading is a vector rather than a bare speed because the Flow screen's
 * pipe slopes, and watching the direction turn with the pipe wall is part of
 * what makes the continuity equation land.
 */

import type { Vector2 } from "scenerystack/dot";
import { Sensor } from "./Sensor.js";

export class VelocitySensor extends Sensor<Vector2> {}
