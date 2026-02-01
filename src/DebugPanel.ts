// ABOUTME: In-game debug overlay for tuning flight parameters in real-time.
// ABOUTME: Uses Babylon GUI sliders bound to FlightSystem.params.

import { AdvancedDynamicTexture, StackPanel, Slider, TextBlock, Control } from "@babylonjs/gui";
import type { FlightSystem, FlightParams } from "./FlightSystem";

interface SliderConfig {
  key: keyof FlightParams;
  label: string;
  min: number;
  max: number;
}

const SLIDERS: SliderConfig[] = [
  { key: "maxSpeed", label: "Max Speed", min: 50, max: 500 },
  { key: "acceleration", label: "Acceleration", min: 5, max: 100 },
  { key: "turnRate", label: "Turn Rate", min: 0.5, max: 5 },
  { key: "stallThreshold", label: "Stall Threshold", min: 5, max: 60 },
  { key: "altitudeFloor", label: "Alt Floor", min: 0, max: 20 },
];

export class DebugPanel {
  private ui: AdvancedDynamicTexture;

  constructor(private flightSystem: FlightSystem) {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("debugUI");

    const panel = new StackPanel();
    panel.width = "220px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.paddingTop = "10px";
    panel.paddingLeft = "10px";
    this.ui.addControl(panel);

    for (const cfg of SLIDERS) {
      this.addSlider(panel, cfg);
    }
  }

  private addSlider(panel: StackPanel, cfg: SliderConfig): void {
    const label = new TextBlock();
    label.text = `${cfg.label}: ${this.flightSystem.params[cfg.key]}`;
    label.height = "20px";
    label.color = "white";
    label.fontSize = 12;
    label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.addControl(label);

    const slider = new Slider();
    slider.minimum = cfg.min;
    slider.maximum = cfg.max;
    slider.value = this.flightSystem.params[cfg.key];
    slider.height = "20px";
    slider.width = "200px";
    slider.color = "yellow";
    slider.background = "grey";
    slider.onValueChangedObservable.add((value: number) => {
      this.flightSystem.params[cfg.key] = value;
      label.text = `${cfg.label}: ${value.toFixed(1)}`;
    });
    panel.addControl(slider);
  }

  dispose(): void {
    this.ui.dispose();
  }
}
