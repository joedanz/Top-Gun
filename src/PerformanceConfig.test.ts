// ABOUTME: Tests for PerformanceConfig — scene-level performance optimizations.
// ABOUTME: Verifies frustum culling, auto-clear, and LOD configuration.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/core", () => {
  return {
    Vector3: class {
      x = 0; y = 0; z = 0;
      constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    },
  };
});

import { applyPerformanceConfig } from "./PerformanceConfig";

describe("applyPerformanceConfig", () => {
  let scene: {
    autoClear: boolean;
    blockMaterialDirtyMechanism: boolean;
    skipPointerMovePicking: boolean;
    renderTargetsEnabled: boolean;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    scene = {
      autoClear: true,
      blockMaterialDirtyMechanism: false,
      skipPointerMovePicking: false,
      renderTargetsEnabled: true,
    };
  });

  it("disables autoClear for performance (skybox covers background)", () => {
    applyPerformanceConfig(scene as never);
    expect(scene.autoClear).toBe(false);
  });

  it("enables blockMaterialDirtyMechanism to skip unnecessary material updates", () => {
    applyPerformanceConfig(scene as never);
    expect(scene.blockMaterialDirtyMechanism).toBe(true);
  });

  it("disables pointer move picking for flight game (no mouse hover needed)", () => {
    applyPerformanceConfig(scene as never);
    expect(scene.skipPointerMovePicking).toBe(true);
  });
});
