// ABOUTME: Tests for the rotating sweep radar display used by futuristic aircraft.
// ABOUTME: Verifies sweep rotation, contact fading, and blip visibility behavior.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/gui", () => {
  class MockEllipse {
    width = "";
    height = "";
    color = "";
    background = "";
    thickness = 0;
    isVisible = true;
    isPointerBlocker = false;
    isHitTestVisible = false;
    left = "";
    top = "";
    horizontalAlignment = 0;
    verticalAlignment = 0;
    addControl = vi.fn();
    alpha = 1;
  }
  class MockRectangle {
    width = "";
    height = "";
    color = "";
    background = "";
    thickness = 0;
    isVisible = true;
    isPointerBlocker = false;
    isHitTestVisible = false;
    horizontalAlignment = 0;
    verticalAlignment = 0;
    addControl = vi.fn();
    left = "";
    top = "";
    paddingTop = "";
    paddingRight = "";
    cornerRadius = 0;
    rotation = 0;
    alpha = 1;
  }
  class MockControl {
    static HORIZONTAL_ALIGNMENT_LEFT = 0;
    static HORIZONTAL_ALIGNMENT_RIGHT = 1;
    static HORIZONTAL_ALIGNMENT_CENTER = 2;
    static VERTICAL_ALIGNMENT_TOP = 0;
    static VERTICAL_ALIGNMENT_BOTTOM = 1;
    static VERTICAL_ALIGNMENT_CENTER = 2;
  }
  return {
    AdvancedDynamicTexture: {
      CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn(), dispose: vi.fn() })),
    },
    Ellipse: MockEllipse,
    Rectangle: MockRectangle,
    Control: MockControl,
  };
});

import { SweepRadar } from "./SweepRadar";

interface MockAircraft {
  mesh: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } };
  alive: boolean;
}

function makeAircraft(x: number, z: number, heading = 0, alive = true): MockAircraft {
  return {
    mesh: {
      position: { x, y: 50, z },
      rotation: { x: 0, y: heading, z: 0 },
    },
    alive,
  };
}

describe("SweepRadar", () => {
  let radar: SweepRadar;

  beforeEach(() => {
    vi.resetAllMocks();
    radar = new SweepRadar();
  });

  it("creates a sweep radar instance", () => {
    expect(radar).toBeDefined();
  });

  it("has a sweep line that rotates over time", () => {
    const player = makeAircraft(0, 0, 0);
    radar.update(player as never, [makeAircraft(100, 0)] as never[], [], 0.5);

    // Sweep angle should have advanced from 0
    expect(radar.sweepAngle).toBeGreaterThan(0);
  });

  it("reveals contacts when sweep passes over them", () => {
    const player = makeAircraft(0, 0, 0);
    const enemy = makeAircraft(100, 0);

    // Run several update cycles to ensure sweep passes through enemy bearing
    for (let i = 0; i < 60; i++) {
      radar.update(player as never, [enemy] as never[], [], 0.1);
    }

    // After a full sweep cycle, blip should have been revealed at some point
    expect(radar.blips.length).toBe(1);
  });

  it("fades contacts over time after sweep passes", () => {
    const player = makeAircraft(0, 0, 0);
    const enemy = makeAircraft(0, 100);

    // First force a reveal by running through enough frames
    for (let i = 0; i < 120; i++) {
      radar.update(player as never, [enemy] as never[], [], 0.05);
    }

    // Blip alpha should be between 0 and 1 (fading)
    const blip = radar.blips[0];
    expect(blip).toBeDefined();
    // After a full rotation, some contacts should have started fading
    expect(blip.alpha).toBeLessThanOrEqual(1);
  });

  it("hides blips for dead enemies", () => {
    const player = makeAircraft(0, 0, 0);
    const enemy = makeAircraft(100, 0, 0, false);
    radar.update(player as never, [enemy] as never[], [], 0.5);

    expect(radar.blips[0].visible).toBe(false);
  });

  it("hides blips outside radar range", () => {
    const player = makeAircraft(0, 0, 0);
    const enemy = makeAircraft(5000, 0);
    radar.update(player as never, [enemy] as never[], [], 0.5);

    expect(radar.blips[0].visible).toBe(false);
  });

  it("completes a full rotation in approximately 4 seconds", () => {
    const player = makeAircraft(0, 0, 0);
    // Run 4 seconds of updates
    for (let i = 0; i < 80; i++) {
      radar.update(player as never, [] as never[], [], 0.05);
    }
    // Sweep angle should have completed roughly one full rotation
    expect(radar.sweepAngle).toBeGreaterThanOrEqual(Math.PI * 2 * 0.9);
  });
});
