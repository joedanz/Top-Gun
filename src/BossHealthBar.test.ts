// ABOUTME: Tests for BossHealthBar — verifies health bar display and visibility toggling.
// ABOUTME: Boss health bar appears during boss missions and reflects boss health.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/gui", () => {
  class MockStackPanel {
    width = "";
    height = "";
    horizontalAlignment = 0;
    verticalAlignment = 0;
    paddingTop = "";
    isVisible = true;
    addControl = vi.fn();
  }
  class MockTextBlock {
    text = "";
    color = "";
    fontSize = 0;
    height = "";
    textHorizontalAlignment = 0;
  }
  class MockRectangle {
    width = "";
    height = "";
    color = "";
    background = "";
    thickness = 0;
    horizontalAlignment = 0;
    verticalAlignment = 0;
    isVisible = true;
    addControl = vi.fn();
  }
  class MockControl {
    static HORIZONTAL_ALIGNMENT_LEFT = 0;
    static HORIZONTAL_ALIGNMENT_CENTER = 1;
    static VERTICAL_ALIGNMENT_TOP = 0;
  }
  return {
    AdvancedDynamicTexture: {
      CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn(), dispose: vi.fn() })),
    },
    StackPanel: MockStackPanel,
    TextBlock: MockTextBlock,
    Rectangle: MockRectangle,
    Control: MockControl,
  };
});

import { BossHealthBar } from "./BossHealthBar";

describe("BossHealthBar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a health bar", () => {
    const bar = new BossHealthBar();
    expect(bar).toBeDefined();
  });

  it("is hidden by default", () => {
    const bar = new BossHealthBar();
    expect(bar.isVisible()).toBe(false);
  });

  it("shows the health bar when activated with a name", () => {
    const bar = new BossHealthBar();
    bar.show("Typhoon");
    expect(bar.isVisible()).toBe(true);
  });

  it("hides when hide is called", () => {
    const bar = new BossHealthBar();
    bar.show("Typhoon");
    bar.hide();
    expect(bar.isVisible()).toBe(false);
  });

  it("updates the health ratio", () => {
    const bar = new BossHealthBar();
    bar.show("Typhoon");
    bar.update(0.5);
    // Health fill width should be 50% of container
    expect(bar.getHealthRatio()).toBeCloseTo(0.5);
  });

  it("clamps health ratio to 0-1", () => {
    const bar = new BossHealthBar();
    bar.show("Typhoon");
    bar.update(-0.5);
    expect(bar.getHealthRatio()).toBe(0);
    bar.update(1.5);
    expect(bar.getHealthRatio()).toBe(1);
  });

  it("displays the boss name", () => {
    const bar = new BossHealthBar();
    bar.show("Iron Eagle");
    expect(bar.getBossName()).toBe("Iron Eagle");
  });
});
