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

      // Under fire, enemy should have non-zero roll (evasive turn)
      expect(enemy.input.roll).not.toBe(0);
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
});
