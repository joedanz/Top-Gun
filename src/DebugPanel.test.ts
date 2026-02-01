// ABOUTME: Tests for the debug parameter tuning panel.
// ABOUTME: Verifies creation and that sliders bind to FlightSystem params.

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAddControl = vi.fn();
const mockSliderObservable = { add: vi.fn() };

vi.mock("@babylonjs/gui", () => {
  class MockAdvancedDynamicTexture {
    addControl = mockAddControl;
    dispose = vi.fn();
    static CreateFullscreenUI = vi.fn(() => new MockAdvancedDynamicTexture());
  }

  class MockStackPanel {
    width = "";
    horizontalAlignment = 0;
    verticalAlignment = 0;
    paddingTop = "";
    paddingLeft = "";
    addControl = vi.fn();
  }

  class MockSlider {
    minimum = 0;
    maximum = 100;
    value = 0;
    height = "";
    width = "";
    color = "";
    background = "";
    onValueChangedObservable = mockSliderObservable;
  }

  class MockTextBlock {
    text = "";
    height = "";
    color = "";
    fontSize = 0;
    textHorizontalAlignment = 0;
  }

  class MockControl {
    static HORIZONTAL_ALIGNMENT_LEFT = 0;
    static VERTICAL_ALIGNMENT_TOP = 0;
  }

  return {
    AdvancedDynamicTexture: MockAdvancedDynamicTexture,
    StackPanel: MockStackPanel,
    Slider: MockSlider,
    TextBlock: MockTextBlock,
    Control: MockControl,
  };
});

vi.mock("@babylonjs/core", () => ({
  Scene: class {},
  Vector3: class {
    constructor(public x = 0, public y = 0, public z = 0) {}
    static Zero() { return new this(0, 0, 0); }
  },
  MeshBuilder: {
    CreateCylinder: vi.fn(() => ({
      name: "aircraft",
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scaling: { x: 1, y: 1, z: 1 },
    })),
  },
}));

import { DebugPanel } from "./DebugPanel";
import { FlightSystem } from "./FlightSystem";

describe("DebugPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a fullscreen UI", async () => {
    const { AdvancedDynamicTexture } = await import("@babylonjs/gui");
    const system = new FlightSystem();
    new DebugPanel(system);
    expect(AdvancedDynamicTexture.CreateFullscreenUI).toHaveBeenCalled();
  });

  it("adds a panel to the UI", () => {
    const system = new FlightSystem();
    new DebugPanel(system);
    expect(mockAddControl).toHaveBeenCalled();
  });

  it("registers slider change callbacks", () => {
    const system = new FlightSystem();
    new DebugPanel(system);
    // 5 sliders should each register a callback
    expect(mockSliderObservable.add).toHaveBeenCalledTimes(5);
  });

  it("slider callback updates flight params", () => {
    const system = new FlightSystem();
    new DebugPanel(system);
    // Get the first slider callback and invoke it
    const callback = mockSliderObservable.add.mock.calls[0][0];
    callback(300);
    expect(system.params.maxSpeed).toBe(300);
  });
});
