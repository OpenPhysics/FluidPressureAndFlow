/**
 * SluiceControlPanel.ts
 *
 * A two-option switch for opening and closing the sluice gate at the base of
 * the tank. Each option is a miniature of the tower — closed with the gate
 * covering the hole, open with water leaving — so a student can match the
 * control to what they see in the play area.
 *
 * PhET's HTML5 port used an ABSwitch here; this panel follows that pattern.
 */

import type { BooleanProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { type Node, Path, Rectangle } from "scenerystack/scenery";
import { ABSwitch } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import { getFluidColor } from "../../common/model/fluidColor.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_CORNER_RADIUS, WATER_DENSITY } from "../../FluidPressureAndFlowConstants.js";

const OPTION_WIDTH = 48;
const OPTION_HEIGHT = 36;
const TANK_SIZE = OPTION_WIDTH * 0.33;
const LEG_WIDTH = 1;
const LEG_SPLAY = 4;

export type SluiceControlPanelAccessibleNames = {
  readonly sluiceControlStringProperty: TReadOnlyProperty<string>;
  readonly sluiceClosedStringProperty: TReadOnlyProperty<string>;
  readonly sluiceOpenStringProperty: TReadOnlyProperty<string>;
};

export class SluiceControlPanel extends FluidPressureAndFlowPanel {
  public constructor(isHoleOpenProperty: BooleanProperty, accessibleNames: SluiceControlPanelAccessibleNames) {
    const closedOption = createOption(false);
    const openOption = createOption(true);

    super(
      new ABSwitch(isHoleOpenProperty, false, closedOption, true, openOption, {
        tandem: Tandem.OPT_OUT,
        valueAAccessibleName: accessibleNames.sluiceClosedStringProperty,
        valueBAccessibleName: accessibleNames.sluiceOpenStringProperty,
      }),
      { accessibleName: accessibleNames.sluiceControlStringProperty },
    );
  }
}

function createOption(isOpen: boolean): Node {
  const frame = new Rectangle(0, 0, OPTION_WIDTH, OPTION_HEIGHT, PANEL_CORNER_RADIUS, PANEL_CORNER_RADIUS, {
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: 1,
    fill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
    tandem: Tandem.OPT_OUT,
  });

  const tankLeft = frame.centerX - TANK_SIZE / 2;
  const tankBottom = frame.bottom - 6;
  const tankTop = tankBottom - TANK_SIZE;
  const legs = createLegs(tankLeft, tankBottom, TANK_SIZE);
  const tank = new Rectangle(tankLeft, tankTop, TANK_SIZE, TANK_SIZE, {
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: 1,
    fill: getFluidColor(WATER_DENSITY).toCSS(),
  });

  frame.addChild(legs);
  frame.addChild(tank);

  if (isOpen) {
    const flow = new Path(new Shape().moveTo(0, 0).quadraticCurveTo(10, 0, 13, 15), {
      left: tank.right - 3,
      top: tank.bottom - 6,
      lineWidth: 4,
      stroke: getFluidColor(WATER_DENSITY).toCSS(),
    });
    frame.addChild(flow);
  }

  return frame;
}

function createLegs(tankLeft: number, tankBottom: number, tankSize: number): Path {
  const legShape = new Shape();
  const topLeft = tankLeft;
  const topRight = tankLeft + tankSize;
  const bottomLeft = topLeft - LEG_SPLAY;
  const bottomRight = topRight + LEG_SPLAY;
  const groundY = tankBottom + 4;

  legShape.moveTo(topLeft, tankBottom);
  legShape.lineTo(bottomLeft, groundY);
  legShape.moveTo(topRight, tankBottom);
  legShape.lineTo(bottomRight, groundY);

  // Cross-bracing between the legs, as in PhET's WaterTowerLegsNode.
  const beam = (leftY: number, rightY: number) => {
    const leftX = topLeft + ((bottomLeft - topLeft) * (leftY - tankBottom)) / (groundY - tankBottom);
    const rightX = topRight + ((bottomRight - topRight) * (rightY - tankBottom)) / (groundY - tankBottom);
    legShape.moveTo(leftX, leftY);
    legShape.lineTo(rightX, rightY);
  };
  beam(tankBottom + (groundY - tankBottom) * 0.9, tankBottom + (groundY - tankBottom) * 0.7);
  beam(tankBottom + (groundY - tankBottom) * 0.7, tankBottom + (groundY - tankBottom) * 0.9);
  beam(tankBottom + (groundY - tankBottom) * 0.5, tankBottom + (groundY - tankBottom) * 0.3);
  beam(tankBottom + (groundY - tankBottom) * 0.3, tankBottom + (groundY - tankBottom) * 0.5);

  return new Path(legShape, {
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: LEG_WIDTH,
  });
}
