/**
 * Barometer.ts
 *
 * A pressure sensor. Reads in pascals; `null` means "neither fluid nor air
 * here", which happens underground outside a pool and outside the pipe on the
 * Flow screen.
 */

import { Sensor } from "./Sensor.js";

export class Barometer extends Sensor<number> {}
