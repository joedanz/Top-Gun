// ABOUTME: Applies scene-level performance optimizations for the Babylon.js engine.
// ABOUTME: Disables unnecessary features like autoClear, pointer picking, and material dirty tracking.

import type { Scene } from "@babylonjs/core";

export function applyPerformanceConfig(scene: Scene): void {
  // Skybox covers the entire background, so clearing is redundant
  scene.autoClear = false;

  // Materials don't change after initialization in this game
  scene.blockMaterialDirtyMechanism = true;

  // Flight game doesn't use mouse hover picking
  scene.skipPointerMovePicking = true;
}
