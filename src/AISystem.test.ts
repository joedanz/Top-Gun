// ABOUTME: Tests for AISystem — verifies pursuit, firing, and evasive AI behaviors.
// ABOUTME: Uses mock aircraft with controlled positions to test AI decision-making.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    Scene: MockScene,
    MeshBuilder: {
      CreateCylinder: vi.fn((_name: string) => ({
        name: "aircraft",
        position: { x: 0, y: 50, z: 0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0 },
        scaling: { x: 1, y: 1, z: 1 },
        material: null,
      })),
    },
    StandardMaterial: class {
      diffuseColor = { r: 0, g: 0, b: 0 };
    },
    Color3: class {
      r: number;
      g: number;
      b: number;
      constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
      }
      static Red() {
        return new this(1, 0, 0);
      }
    },
  };
});

import { AISystem } from "./AISystem";
import { AIInput } from "./AIInput";

function makeAircraft(
  pos: { x: number; y: number; z: number },
  rotY = 0,
  speed = 100,
) {
  const input = new AIInput();
  return {
    mesh: {
      position: { ...pos },
      rotation: { x: Math.PI / 2, y: rotY, z: 0 },
      material: null,
    },
    speed,
    input,
  };
}

describe("AISystem", () => {
  let system: AISystem;

  beforeEach(() => {
    vi.resetAllMocks();
    system = new AISystem();
  });

  describe("pursuit", () => {
    it("sets positive throttle to maintain speed", () => {
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      system.update(enemy as never, player as never, 0.016, false);

      expect(enemy.input.throttle).toBeGreaterThan(0);
    });

    it("yaws toward player when player is to the right", () => {
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 }, 0); // facing +Z
      const player = makeAircraft({ x: 100, y: 50, z: 0 }); // player to the right

      system.update(enemy as never, player as never, 0.016, false);

      // Enemy should yaw to turn toward the player
      expect(enemy.input.yaw).not.toBe(0);
    });

    it("adjusts pitch when player is above", () => {
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 150, z: 100 });

      system.update(enemy as never, player as never, 0.016, false);

      // Enemy should pitch to climb toward player
      expect(enemy.input.pitch).not.toBe(0);
    });
  });

  describe("firing", () => {
    it("fires when player is in front and within range", () => {
      // Enemy at origin facing +Z, player directly ahead and close
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 }, 0, 100);
      const player = makeAircraft({ x: 0, y: 50, z: 80 });

      system.update(enemy as never, player as never, 0.016, false);

      expect(enemy.input.fire).toBe(true);
    });

    it("does not fire when player is behind", () => {
      // Enemy facing +Z, player behind at -Z
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 }, 0, 100);
      const player = makeAircraft({ x: 0, y: 50, z: -100 });

      system.update(enemy as never, player as never, 0.016, false);

      expect(enemy.input.fire).toBe(false);
    });

    it("does not fire when player is out of range", () => {
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 }, 0, 100);
      const player = makeAircraft({ x: 0, y: 50, z: 1000 });

      system.update(enemy as never, player as never, 0.016, false);

      expect(enemy.input.fire).toBe(false);
    });
  });

  describe("evasion", () => {
    it("takes evasive action when under fire", () => {
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      system.update(enemy as never, player as never, 0.016, true);

      // Under fire, enemy should take evasive action (break turn sets yaw)
      expect(Math.abs(enemy.input.yaw)).toBeGreaterThan(0);
    });

    it("does not evade when not under fire", () => {
      // Normal pursuit — roll should be 0 (or small) when not evading
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      system.update(enemy as never, player as never, 0.016, false);

      // Not evading — roll comes from pursuit only, should be ~0 when target is straight ahead
      expect(Math.abs(enemy.input.roll)).toBeLessThan(0.5);
    });
  });

  describe("evasive maneuvers", () => {
    it("executes break turn at low difficulty when under fire", () => {
      const system = new AISystem(1); // difficulty 1 = low
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      // Seed deterministic random for testing
      vi.spyOn(Math, "random").mockReturnValue(0.1);

      system.update(enemy as never, player as never, 0.016, true);

      // Break turn: hard yaw + pull up
      expect(Math.abs(enemy.input.yaw)).toBeGreaterThanOrEqual(0.8);
      expect(enemy.input.pitch).toBeLessThan(0);
    });

    it("executes barrel roll at medium difficulty when under fire", () => {
      const system = new AISystem(2); // difficulty 2 = medium
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      // Random value that selects barrel roll (medium difficulty has break + barrel roll)
      vi.spyOn(Math, "random").mockReturnValue(0.6);

      system.update(enemy as never, player as never, 0.016, true);

      // Barrel roll: max roll + some pitch
      expect(Math.abs(enemy.input.roll)).toBe(1);
    });

    it("executes split-S at high difficulty when under fire", () => {
      const system = new AISystem(3); // difficulty 3 = high
      const enemy = makeAircraft({ x: 0, y: 80, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      // Random value that selects split-S (high difficulty has all 3 maneuvers)
      vi.spyOn(Math, "random").mockReturnValue(0.9);

      system.update(enemy as never, player as never, 0.016, true);

      // Split-S: roll to invert + pull (positive pitch for nose-down when inverted)
      expect(Math.abs(enemy.input.roll)).toBe(1);
      expect(enemy.input.pitch).toBeGreaterThan(0);
    });

    it("continues a maneuver across multiple frames until duration expires", () => {
      const system = new AISystem(2);
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      vi.spyOn(Math, "random").mockReturnValue(0.1);

      // First frame: starts maneuver
      system.update(enemy as never, player as never, 0.016, true);
      const firstRoll = enemy.input.roll;

      // Second frame: still under fire, maneuver should continue (not re-roll)
      system.update(enemy as never, player as never, 0.016, true);
      expect(enemy.input.roll).toBe(firstRoll);
    });

    it("returns to pursuit after maneuver duration expires", () => {
      const system = new AISystem(2);
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      vi.spyOn(Math, "random").mockReturnValue(0.1);

      // Start maneuver
      system.update(enemy as never, player as never, 0.016, true);

      // Advance time past maneuver duration (2 seconds should be enough)
      system.update(enemy as never, player as never, 2.0, false);

      // Next update without fire — should be normal pursuit, roll ~0
      system.update(enemy as never, player as never, 0.016, false);
      expect(Math.abs(enemy.input.roll)).toBeLessThan(0.5);
    });

    it("defaults to difficulty 1 when not specified", () => {
      const system = new AISystem();
      const enemy = makeAircraft({ x: 0, y: 50, z: 0 });
      const player = makeAircraft({ x: 0, y: 50, z: 100 });

      vi.spyOn(Math, "random").mockReturnValue(0.1);

      // Should still evade (break turn at default difficulty 1)
      system.update(enemy as never, player as never, 0.016, true);
      expect(Math.abs(enemy.input.yaw)).toBeGreaterThanOrEqual(0.8);
    });

    it("does not use split-S at low altitude", () => {
      const system = new AISystem(3);
      const enemy = makeAircraft({ x: 0, y: 20, z: 0 }); // low altitude
      const player = makeAircraft({ x: 0, y: 20, z: 100 });

      // Value that would normally select split-S
      vi.spyOn(Math, "random").mockReturnValue(0.9);

      system.update(enemy as never, player as never, 0.016, true);

      // At low altitude, split-S should be avoided (would fly into ground)
      // Should fall back to break turn or barrel roll
      expect(enemy.input.pitch).toBeLessThanOrEqual(0);
    });
  });

  describe("difficulty in mission data", () => {
    it("accepts difficulty parameter in constructor", () => {
      const system1 = new AISystem(1);
      const system3 = new AISystem(3);
      expect(system1).toBeDefined();
      expect(system3).toBeDefined();
    });
  });
});
