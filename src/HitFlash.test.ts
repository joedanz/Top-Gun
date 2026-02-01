// ABOUTME: Tests for HitFlash — validates red vignette overlay on damage.
// ABOUTME: Ensures flash triggers, fades over time, and handles re-triggers.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/gui", () => {
  class MockRectangle {
    width = "";
    height = "";
    color = "";
    background = "";
    alpha = 0;
    thickness = 0;
    isPointerBlocker = false;
    isHitTestVisible = false;
  }
  class MockAdvancedDynamicTexture {
    addControl = vi.fn();
    static CreateFullscreenUI = vi.fn(() => new MockAdvancedDynamicTexture());
  }
  return {
    Rectangle: MockRectangle,
    AdvancedDynamicTexture: MockAdvancedDynamicTexture,
  };
});

import { HitFlash } from "./HitFlash";

describe("HitFlash", () => {
  let flash: HitFlash;

  beforeEach(() => {
    vi.resetAllMocks();
    flash = new HitFlash({} as never);
  });

  it("starts with zero alpha (invisible)", () => {
    expect(flash.alpha).toBe(0);
  });

  it("sets alpha above zero when triggered", () => {
    flash.trigger(1.0);
    expect(flash.alpha).toBeGreaterThan(0);
  });

  it("fades back to zero over time", () => {
    flash.trigger(1.0);
    for (let i = 0; i < 120; i++) {
      flash.update(1 / 60);
    }
    expect(flash.alpha).toBeLessThan(0.01);
  });

  it("stronger intensity produces higher initial alpha", () => {
    const flashLight = new HitFlash({} as never);
    const flashHeavy = new HitFlash({} as never);

    flashLight.trigger(0.2);
    flashHeavy.trigger(1.0);

    expect(flashHeavy.alpha).toBeGreaterThan(flashLight.alpha);
  });

  it("re-triggering while fading resets alpha", () => {
    flash.trigger(1.0);
    // Let it fade a bit
    for (let i = 0; i < 30; i++) {
      flash.update(1 / 60);
    }
    const fadedAlpha = flash.alpha;

    flash.trigger(1.0);
    expect(flash.alpha).toBeGreaterThan(fadedAlpha);
  });
});
