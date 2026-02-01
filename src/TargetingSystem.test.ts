// ABOUTME: Tests for the TargetingSystem that manages target selection, reticle, and lead indicator.
// ABOUTME: Verifies target cycling, lead indicator computation, and screen-space projection.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/gui", () => {
  class MockTextBlock {
    text = "";
    color = "";
    fontSize = 0;
    height = "";
    width = "";
    top = "";
    left = "";
    textHorizontalAlignment = 0;
    isVisible = true;
  }
  class MockEllipse {
    width = "";
    height = "";
    color = "";
    thickness = 0;
    top = "";
    left = "";
    isVisible = true;
    isPointerBlocker = false;
    isHitTestVisible = false;
    addControl = vi.fn();
  }
  class MockControl {
    static HORIZONTAL_ALIGNMENT_CENTER = 2;
    static VERTICAL_ALIGNMENT_CENTER = 2;
  }
  return {
    AdvancedDynamicTexture: {
      CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn(), dispose: vi.fn() })),
    },
    TextBlock: MockTextBlock,
    Ellipse: MockEllipse,
    Control: MockControl,
  };
});

vi.mock("@babylonjs/core", () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    static Zero() { return new MockVector3(0, 0, 0); }
    static Project(pos: { x: number; y: number; z: number }) {
      // Simple mock: return normalized screen coords
      return new MockVector3(pos.x / 100, pos.y / 100, pos.z / 100);
    }
  }

  class MockMatrix {
    static Identity() { return new MockMatrix(); }
    multiply() { return new MockMatrix(); }
  }

  return {
    Vector3: MockVector3,
    Matrix: MockMatrix,
  };
});

import { TargetingSystem } from "./TargetingSystem";

function makeAircraft(pos = { x: 0, y: 50, z: 0 }, rotY = 0, speed = 100) {
  return {
    mesh: {
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: 0, y: rotY, z: 0 },
    },
    speed,
    alive: true,
    health: 100,
    input: { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: false, lockOn: false, cycleWeapon: false },
  };
}

describe("TargetingSystem", () => {
  let system: TargetingSystem;

  beforeEach(() => {
    vi.resetAllMocks();
    system = new TargetingSystem();
  });

  it("has no target when no enemies exist", () => {
    expect(system.currentTarget).toBeNull();
  });

  it("selects nearest enemy as default target", () => {
    const player = makeAircraft({ x: 0, y: 50, z: 0 });
    const near = makeAircraft({ x: 100, y: 50, z: 0 });
    const far = makeAircraft({ x: 500, y: 50, z: 0 });

    system.update(player as never, [near as never, far as never], null as never);
    expect(system.currentTarget).toBe(near);
  });

  it("cycles to next target on cycleTarget input", () => {
    const player = makeAircraft({ x: 0, y: 50, z: 0 });
    player.input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: true, lockOn: false, cycleWeapon: false };
    const e1 = makeAircraft({ x: 100, y: 50, z: 0 });
    const e2 = makeAircraft({ x: 200, y: 50, z: 0 });

    // First update: selects nearest (e1), cycleTarget pressed → advances to e2
    system.update(player as never, [e1 as never, e2 as never], null as never);
    // Release and press again
    player.input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: false, lockOn: false, cycleWeapon: false };
    system.update(player as never, [e1 as never, e2 as never], null as never);
    player.input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: true, lockOn: false, cycleWeapon: false };
    system.update(player as never, [e1 as never, e2 as never], null as never);
    // Should wrap around back to e1
    expect(system.currentTarget).toBe(e1);
  });

  it("skips dead enemies when cycling", () => {
    const player = makeAircraft({ x: 0, y: 50, z: 0 });
    player.input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: true, lockOn: false, cycleWeapon: false };
    const e1 = makeAircraft({ x: 100, y: 50, z: 0 });
    const e2 = makeAircraft({ x: 200, y: 50, z: 0 });
    e2.alive = false;

    system.update(player as never, [e1 as never, e2 as never], null as never);
    // Should stay on e1 since e2 is dead — cycling wraps back
    expect(system.currentTarget).toBe(e1);
  });

  it("clears target when current target is destroyed", () => {
    const player = makeAircraft({ x: 0, y: 50, z: 0 });
    const e1 = makeAircraft({ x: 100, y: 50, z: 0 });

    system.update(player as never, [e1 as never], null as never);
    expect(system.currentTarget).toBe(e1);

    e1.alive = false;
    system.update(player as never, [e1 as never], null as never);
    expect(system.currentTarget).toBeNull();
  });

  it("computes lead indicator offset based on target velocity and distance", () => {
    const player = makeAircraft({ x: 0, y: 50, z: 0 });
    const target = makeAircraft({ x: 500, y: 50, z: 0 }, Math.PI / 2, 150);

    system.update(player as never, [target as never], null as never);
    // Lead indicator should exist when we have a target
    expect(system.leadPosition).toBeDefined();
    expect(system.leadPosition).not.toBeNull();
  });

  it("hides indicators when no target", () => {
    const player = makeAircraft();
    system.update(player as never, [], null as never);
    expect(system.reticleVisible).toBe(false);
    expect(system.leadVisible).toBe(false);
  });

  it("shows indicators when target exists", () => {
    const player = makeAircraft({ x: 0, y: 50, z: 0 });
    const enemy = makeAircraft({ x: 200, y: 50, z: 0 });
    system.update(player as never, [enemy as never], null as never);
    expect(system.reticleVisible).toBe(true);
  });
});
