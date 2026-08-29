/**
 * MysteryPoolControlsNode.ts
 *
 * The mystery-pool puzzle controls: which quantity is hidden, and which of the
 * three fluids or planets is in play. Matches the published PhET layout — radio
 * buttons below the units panel, comboboxes overlaid on the disabled slider.
 */

import type { EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { DerivedProperty } from "scenerystack/axon";
import { Text, VBox } from "scenerystack/scenery";
import { AquaRadioButton, ComboBox } from "scenerystack/sun";
import {
  FLAT_BUTTON_APPEARANCE_OPTIONS,
  FLUID_PRESSURE_AND_FLOW_COMBO_BOX_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/FluidPressureAndFlowButtonOptions.js";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { type MysteryPoolModel, MysteryQuantity } from "../model/MysteryPoolModel.js";
import { PoolScene } from "../model/PoolScene.js";

const LABEL_FONT = "12px sans-serif";
const COMBO_LABEL_MAX_WIDTH = 70;

export type MysteryPoolLabelProperties = {
  readonly mysteryFluidStringProperty: TReadOnlyProperty<string>;
  readonly mysteryPlanetStringProperty: TReadOnlyProperty<string>;
  readonly fluidAStringProperty: TReadOnlyProperty<string>;
  readonly fluidBStringProperty: TReadOnlyProperty<string>;
  readonly fluidCStringProperty: TReadOnlyProperty<string>;
  readonly planetAStringProperty: TReadOnlyProperty<string>;
  readonly planetBStringProperty: TReadOnlyProperty<string>;
  readonly planetCStringProperty: TReadOnlyProperty<string>;
};

export class MysteryPoolControlsNode {
  public readonly choicePanel: FluidPressureAndFlowPanel;
  public readonly fluidComboBox: ComboBox<number>;
  public readonly planetComboBox: ComboBox<number>;

  private readonly disposeMysteryPoolControlsNode: () => void;

  public constructor(
    mysteryPool: MysteryPoolModel,
    sceneProperty: EnumerationProperty<PoolScene>,
    listParent: import("scenerystack/scenery").Node,
    labels: MysteryPoolLabelProperties,
    mysteryChooserAccessibleName: TReadOnlyProperty<string>,
    panelWidth: number,
  ) {
    const textOptions = {
      font: LABEL_FONT,
      fill: LIGHT_SURFACE_TEXT_FILL,
      maxWidth: panelWidth * 0.8,
    };

    const mysteryFluidRadio = new AquaRadioButton(
      mysteryPool.mysteryQuantityProperty,
      MysteryQuantity.FLUID_DENSITY,
      new Text(labels.mysteryFluidStringProperty, textOptions),
      { ...FLAT_BUTTON_APPEARANCE_OPTIONS, radius: 6 },
    );
    const mysteryPlanetRadio = new AquaRadioButton(
      mysteryPool.mysteryQuantityProperty,
      MysteryQuantity.GRAVITY,
      new Text(labels.mysteryPlanetStringProperty, textOptions),
      { ...FLAT_BUTTON_APPEARANCE_OPTIONS, radius: 6 },
    );

    const choicePanel = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: 5,
        children: [mysteryFluidRadio, mysteryPlanetRadio],
      }),
      { minWidth: panelWidth },
    );
    choicePanel.tagName = "div";
    choicePanel.accessibleName = mysteryChooserAccessibleName;

    const comboTextOptions = {
      font: LABEL_FONT,
      fill: LIGHT_SURFACE_TEXT_FILL,
      maxWidth: COMBO_LABEL_MAX_WIDTH,
    };

    const fluidComboBox = new ComboBox(
      mysteryPool.fluidChoiceProperty,
      [
        { value: 0, createNode: () => new Text(labels.fluidAStringProperty, comboTextOptions) },
        { value: 1, createNode: () => new Text(labels.fluidBStringProperty, comboTextOptions) },
        { value: 2, createNode: () => new Text(labels.fluidCStringProperty, comboTextOptions) },
      ],
      listParent,
      {
        ...FLUID_PRESSURE_AND_FLOW_COMBO_BOX_OPTIONS,
        highlightFill: FluidPressureAndFlowColors.controlSurfaceColorProperty,
      },
    );

    const planetComboBox = new ComboBox(
      mysteryPool.planetChoiceProperty,
      [
        { value: 0, createNode: () => new Text(labels.planetAStringProperty, comboTextOptions) },
        { value: 1, createNode: () => new Text(labels.planetBStringProperty, comboTextOptions) },
        { value: 2, createNode: () => new Text(labels.planetCStringProperty, comboTextOptions) },
      ],
      listParent,
      {
        ...FLUID_PRESSURE_AND_FLOW_COMBO_BOX_OPTIONS,
        highlightFill: FluidPressureAndFlowColors.controlSurfaceColorProperty,
      },
    );

    const fluidComboVisibleProperty = new DerivedProperty(
      [mysteryPool.mysteryQuantityProperty, sceneProperty],
      (quantity, scene) => scene === PoolScene.MYSTERY && quantity === MysteryQuantity.FLUID_DENSITY,
    );
    const planetComboVisibleProperty = new DerivedProperty(
      [mysteryPool.mysteryQuantityProperty, sceneProperty],
      (quantity, scene) => scene === PoolScene.MYSTERY && quantity === MysteryQuantity.GRAVITY,
    );

    const updateFluidComboVisible = (visible: boolean) => {
      fluidComboBox.visible = visible;
    };
    const updatePlanetComboVisible = (visible: boolean) => {
      planetComboBox.visible = visible;
    };
    fluidComboVisibleProperty.link(updateFluidComboVisible);
    planetComboVisibleProperty.link(updatePlanetComboVisible);
    updateFluidComboVisible(fluidComboVisibleProperty.value);
    updatePlanetComboVisible(planetComboVisibleProperty.value);

    const updateChoicePanelVisible = (scene: PoolScene) => {
      choicePanel.visible = scene === PoolScene.MYSTERY;
    };
    sceneProperty.link(updateChoicePanelVisible);
    updateChoicePanelVisible(sceneProperty.value);

    this.choicePanel = choicePanel;
    this.fluidComboBox = fluidComboBox;
    this.planetComboBox = planetComboBox;

    this.disposeMysteryPoolControlsNode = () => {
      sceneProperty.unlink(updateChoicePanelVisible);
      fluidComboVisibleProperty.unlink(updateFluidComboVisible);
      planetComboVisibleProperty.unlink(updatePlanetComboVisible);
      fluidComboVisibleProperty.dispose();
      planetComboVisibleProperty.dispose();
      fluidComboBox.dispose();
      planetComboBox.dispose();
    };
  }

  public dispose(): void {
    this.disposeMysteryPoolControlsNode();
  }
}
