// ABOUTME: Tests for the 2D top-down radar minimap display.
// ABOUTME: Verifies relative enemy positioning, scaling, and visibility.

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

import { Radar } from "./Radar";

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

describe("Radar", () => {
  let radar: Radar;

  beforeEach(() => {
    vi.resetAllMocks();
    radar = new Radar();
  });

  it("creates a radar instance", () => {
    expect(radar).toBeDefined();
  });

  it("has a configurable radar range", () => {
    expect(radar.range).toBeGreaterThan(0);
  });

  it("shows player dot at center", () => {
    expect(radar.playerDot).toBeDefined();
  });

  it("computes relative positions of enemies", () => {
    const player = makeAircraft(0, 0, 0);
    const enemies = [makeAircraft(100, 0)];
    radar.update(player as never, enemies as never[], []);

    // Enemy at +100x from player, heading 0, should appear to the right on radar
    expect(radar.blips.length).toBe(1);
    expect(radar.blips[0].visible).toBe(true);
  });

  it("hides blips for dead enemies", () => {
    const player = makeAircraft(0, 0, 0);
    const enemies = [makeAircraft(100, 0, 0, false)];
    radar.update(player as never, enemies as never[], []);

    expect(radar.blips[0].visible).toBe(false);
  });

  it("hides blips for enemies outside radar range", () => {
    const player = makeAircraft(0, 0, 0);
    const enemies = [makeAircraft(5000, 0)]; // Way outside default range
    radar.update(player as never, enemies as never[], []);

    expect(radar.blips[0].visible).toBe(false);
  });

  it("rotates blip positions by player heading", () => {
    const player = makeAircraft(0, 0, Math.PI / 2); // Facing east
    const enemy = makeAircraft(100, 0); // Enemy at +X (east)
    radar.update(player as never, [enemy] as never[], []);

    // Enemy is directly ahead — should appear at top of radar (negative Y)
    const blip = radar.blips[0];
    expect(blip.screenY).toBeLessThan(0);
    expect(Math.abs(blip.screenX)).toBeLessThan(5);
  });

  it("shows friendlies as green blips", () => {
    const player = makeAircraft(0, 0);
    const friendly = makeAircraft(50, 0);
    radar.update(player as never, [], [friendly] as never[]);

    expect(radar.friendlyBlips.length).toBe(1);
    expect(radar.friendlyBlips[0].visible).toBe(true);
  });

  it("scales blip distance proportional to radar range", () => {
    const player = makeAircraft(0, 0, 0);
    const nearEnemy = makeAircraft(0, 100); // 100 units ahead
    const farEnemy = makeAircraft(0, 500); // 500 units ahead
    radar.update(player as never, [nearEnemy, farEnemy] as never[], []);

    // Both should be visible (within range)
    // Far enemy should have larger screenY magnitude
    const nearBlip = radar.blips[0];
    const farBlip = radar.blips[1];
    expect(Math.abs(farBlip.screenY)).toBeGreaterThan(Math.abs(nearBlip.screenY));
  });
});
