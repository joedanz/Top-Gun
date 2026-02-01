// ABOUTME: HUD element showing the boss's health bar during boss missions.
// ABOUTME: Displays boss name and a colored health bar that changes color as health decreases.

import { AdvancedDynamicTexture, TextBlock, Rectangle, Control } from "@babylonjs/gui";

const BAR_WIDTH = 400;
const BAR_HEIGHT = 20;

export class BossHealthBar {
  private container: Rectangle;
  private fill: Rectangle;
  private nameText: TextBlock;
  private healthRatio = 1;
  private bossName = "";
  private ui: { addControl: (c: unknown) => void };

  constructor() {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("bossHealthUI") as unknown as { addControl: (c: unknown) => void };

    this.container = new Rectangle();
    this.container.width = `${BAR_WIDTH + 4}px`;
    this.container.height = `${BAR_HEIGHT + 4}px`;
    this.container.color = "white";
    this.container.background = "rgba(0, 0, 0, 0.6)";
    this.container.thickness = 2;
    this.container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.container.isVisible = false;

    this.fill = new Rectangle();
    this.fill.width = `${BAR_WIDTH}px`;
    this.fill.height = `${BAR_HEIGHT}px`;
    this.fill.color = "";
    this.fill.background = "#ff3333";
    this.fill.thickness = 0;
    this.fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.container.addControl(this.fill);

    this.nameText = new TextBlock();
    this.nameText.text = "";
    this.nameText.color = "white";
    this.nameText.fontSize = 16;
    this.nameText.height = "24px";
    this.nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

    this.ui.addControl(this.nameText);
    this.ui.addControl(this.container);
  }

  show(name: string): void {
    this.bossName = name;
    this.nameText.text = name;
    this.container.isVisible = true;
    this.nameText.isVisible = true;
  }

  hide(): void {
    this.container.isVisible = false;
    this.nameText.isVisible = false;
  }

  isVisible(): boolean {
    return this.container.isVisible;
  }

  update(ratio: number): void {
    this.healthRatio = Math.max(0, Math.min(1, ratio));
    this.fill.width = `${Math.round(this.healthRatio * BAR_WIDTH)}px`;

    // Color changes based on health
    if (this.healthRatio > 0.5) {
      this.fill.background = "#ff3333";
    } else if (this.healthRatio > 0.25) {
      this.fill.background = "#ff8800";
    } else {
      this.fill.background = "#ff0000";
    }
  }

  getHealthRatio(): number {
    return this.healthRatio;
  }

  getBossName(): string {
    return this.bossName;
  }
}
