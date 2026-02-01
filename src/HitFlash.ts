// ABOUTME: Red screen-edge vignette overlay that flashes on taking damage.
// ABOUTME: Uses Babylon GUI rectangle with fading alpha for visual feedback.

import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";
import type { Scene } from "@babylonjs/core";

const FADE_RATE = 4;
const MAX_ALPHA = 0.6;

export class HitFlash {
  alpha = 0;
  private rect: Rectangle;

  constructor(scene: Scene) {
    const ui = AdvancedDynamicTexture.CreateFullscreenUI("hitFlashUI", true, scene);
    this.rect = new Rectangle("hitFlash");
    this.rect.width = "100%";
    this.rect.height = "100%";
    this.rect.color = "transparent";
    this.rect.background = "rgba(255, 0, 0, 1)";
    this.rect.alpha = 0;
    this.rect.thickness = 0;
    this.rect.isPointerBlocker = false;
    this.rect.isHitTestVisible = false;
    ui.addControl(this.rect);
  }

  trigger(intensity: number): void {
    this.alpha = Math.min(intensity * MAX_ALPHA, MAX_ALPHA);
    this.rect.alpha = this.alpha;
  }

  update(dt: number): void {
    if (this.alpha < 0.001) {
      this.alpha = 0;
      this.rect.alpha = 0;
      return;
    }
    this.alpha *= Math.exp(-FADE_RATE * dt);
    this.rect.alpha = this.alpha;
  }
}
