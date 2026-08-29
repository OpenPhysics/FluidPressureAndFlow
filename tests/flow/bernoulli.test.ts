/**
 * bernoulli.test.ts
 *
 * The Flow screen's second learning goal: `P + ½ρv² + ρgy` is the same all along
 * a streamline, so pressure falls where the fluid speeds up and where it climbs.
 *
 * Also pins the negative-pressure clamp. Bernoulli can be driven below zero in a
 * narrow, fast pipe, which is not a pressure but a sign the model has left its
 * domain; the sim reports zero rather than a negative number, and that choice
 * should not be undone by accident.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { EARTH_GRAVITY } from "../../src/FluidPressureAndFlowConstants.js";
import { FlowModel } from "../../src/flow/model/FlowModel.js";

/** `P + ½ρv² + ρgy` at a point inside the pipe. */
function totalHead(model: FlowModel, x: number): number | null {
  const y = model.pipe.fractionToY(x, 0.5);
  const pressure = model.getPressureAt(x, y);
  const velocity = model.getVelocityAt(x, y);
  if (pressure === null || velocity === null) {
    return null;
  }
  const density = model.fluidDensityProperty.value;
  return pressure + 0.5 * density * velocity.magnitudeSquared + density * EARTH_GRAVITY * y;
}

describe("Bernoulli's equation on the Flow screen", () => {
  let model: FlowModel;

  beforeEach(() => {
    model = new FlowModel();
  });

  it("keeps the total head constant along the pipe when it is deformed", () => {
    const middle = model.pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    middle.topYProperty.value = -2.1;

    const reference = totalHead(model, -4);
    expect(reference).not.toBeNull();
    for (const x of [-2, 0, 2, 4]) {
      expect(totalHead(model, x) as number).toBeCloseTo(reference as number, 3);
    }
  });

  it("reads a lower pressure where the pipe is constricted", () => {
    const wideY = model.pipe.fractionToY(-4, 0.5);
    const middle = model.pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    middle.topYProperty.value = -2.1;

    const narrowY = model.pipe.fractionToY(0, 0.5);
    const widePressure = model.getPressureAt(-4, wideY) as number;
    const narrowPressure = model.getPressureAt(0, narrowY) as number;
    expect(narrowPressure).toBeLessThan(widePressure);
  });

  it("reads a lower pressure higher up the pipe at the same speed", () => {
    // Raise the whole pipe: the area, and so the speed, is unchanged.
    for (const section of model.pipe.crossSections) {
      section.topYProperty.value = -1;
      section.bottomYProperty.value = -3;
    }
    const lowPressure = model.getPressureAt(0, model.pipe.fractionToY(0, 0.5)) as number;

    for (const section of model.pipe.crossSections) {
      section.topYProperty.value = 0;
      section.bottomYProperty.value = -2;
    }
    const highPressure = model.getPressureAt(0, model.pipe.fractionToY(0, 0.5)) as number;

    expect(highPressure).toBeLessThan(lowPressure);
  });

  it("drops pressure downstream when friction is enabled", () => {
    model.pipe.isFrictionEnabledProperty.value = true;
    const inlet = model.getPressureAt(-5, model.pipe.fractionToY(-5, 0.5));
    const outlet = model.getPressureAt(5, model.pipe.fractionToY(5, 0.5));
    expect(inlet).not.toBeNull();
    expect(outlet).not.toBeNull();
    expect(outlet as number).toBeLessThan(inlet as number);
  });

  it("never reports a negative pressure, even at the highest flow through the narrowest pipe", () => {
    model.pipe.flowRateProperty.value = 10;
    for (const section of model.pipe.crossSections) {
      section.topYProperty.value = -2;
      section.bottomYProperty.value = -3;
    }
    for (const x of [-5, -2, 0, 2, 5]) {
      const pressure = model.getPressureAt(x, model.pipe.fractionToY(x, 0.5));
      if (pressure !== null) {
        expect(pressure).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("reports nothing outside the pipe and underground", () => {
    expect(model.getPressureAt(0, -6)).toBeNull();
    expect(model.getVelocityAt(0, -6)).toBeNull();
  });

  it("reports air pressure above the ground", () => {
    expect(model.getPressureAt(0, 2)).toBeCloseTo(model.getAirPressure(2), 6);
  });

  it("declines to report a pressure right against the wall", () => {
    const section = model.pipe.getCrossSectionAt(0);
    expect(model.getPressureAt(0, section.topY - 0.01)).toBeNull();
    expect(model.getPressureAt(0, section.bottomY + 0.01)).toBeNull();
  });
});

describe("Flow screen tracers", () => {
  let model: FlowModel;

  beforeEach(() => {
    model = new FlowModel();
  });

  it("drips tracers into the pipe as time passes", () => {
    for (let i = 0; i < 30; i++) {
      model.stepOnce(1 / 60);
    }
    expect(model.particles.length).toBeGreaterThan(0);
  });

  it("drips none when the dots are switched off", () => {
    model.areDotsVisibleProperty.value = false;
    for (let i = 0; i < 30; i++) {
      model.stepOnce(1 / 60);
    }
    expect(model.particles.length).toBe(0);
  });

  it("carries tracers downstream and removes them at the far end", () => {
    model.areDotsVisibleProperty.value = false;
    model.injectGrid();
    const startX = (model.particles[0] as { x: number }).x;

    model.stepOnce(1 / 60);
    expect((model.particles[0] as { x: number }).x).toBeGreaterThan(startX);

    for (let i = 0; i < 2000; i++) {
      model.stepOnce(1 / 60);
    }
    expect(model.particles.length).toBe(0);
  });

  it("keeps tracers inside the pipe as the wall closes around them", () => {
    model.areDotsVisibleProperty.value = false;
    model.injectGrid();
    const middle = model.pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    middle.topYProperty.value = -2.1;

    for (let i = 0; i < 200; i++) {
      model.stepOnce(1 / 60);
      for (const particle of model.particles) {
        const section = model.pipe.getCrossSectionAt(particle.x);
        const y = particle.getY(model.pipe);
        expect(y).toBeGreaterThanOrEqual(section.bottomY - 1e-9);
        expect(y).toBeLessThanOrEqual(section.topY + 1e-9);
      }
    }
  });

  it("locks the grid injector out until its cooldown expires", () => {
    model.areDotsVisibleProperty.value = false;
    model.injectGrid();
    const count = model.particles.length;
    model.injectGrid();
    expect(model.particles.length).toBe(count);
  });
});
