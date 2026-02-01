// ABOUTME: Tests for FormationSystem — verifies wing pair and diamond formation behaviors.
// ABOUTME: Tests formation keeping, engagement breaks, and reformation logic.

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

import { FormationSystem, Formation, FormationType } from "./FormationSystem";
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
    alive: true,
  };
}

describe("FormationSystem", () => {
  let system: FormationSystem;

  beforeEach(() => {
    vi.resetAllMocks();
    system = new FormationSystem();
  });

  describe("formation creation", () => {
    it("creates a wing pair formation with a leader and one wingman", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 });
      const wingman = makeAircraft({ x: 30, y: 50, z: -20 });

      const formation = system.createFormation(
        "wing",
        leader as never,
        [wingman as never],
      );

      expect(formation.type).toBe("wing");
      expect(formation.leader).toBe(leader);
      expect(formation.wingmen).toHaveLength(1);
      expect(formation.wingmen[0]).toBe(wingman);
    });

    it("creates a diamond formation with a leader and three wingmen", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 });
      const w1 = makeAircraft({ x: 30, y: 50, z: -20 });
      const w2 = makeAircraft({ x: -30, y: 50, z: -20 });
      const w3 = makeAircraft({ x: 0, y: 50, z: -40 });

      const formation = system.createFormation(
        "diamond",
        leader as never,
        [w1 as never, w2 as never, w3 as never],
      );

      expect(formation.type).toBe("diamond");
      expect(formation.wingmen).toHaveLength(3);
    });
  });

  describe("formation keeping", () => {
    it("wingmen steer toward their formation offset when disengaged", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 }, 0);
      const wingman = makeAircraft({ x: 100, y: 50, z: 100 }, 0); // far from offset position

      const formation = system.createFormation(
        "wing",
        leader as never,
        [wingman as never],
      );

      // Player is far away — formation should hold
      const player = makeAircraft({ x: 0, y: 50, z: 2000 });
      system.update(formation, player as never, 0.016);

      // Wingman should have non-zero yaw (steering toward formation position)
      expect(wingman.input.yaw).not.toBe(0);
      // Should be in formation mode (throttle managed by formation)
      expect(wingman.input.throttle).toBeGreaterThan(0);
    });

    it("leader flies normally (formation does not override leader input)", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 }, 0);
      const wingman = makeAircraft({ x: 30, y: 50, z: -20 }, 0);

      const formation = system.createFormation(
        "wing",
        leader as never,
        [wingman as never],
      );

      const player = makeAircraft({ x: 0, y: 50, z: 2000 });
      system.update(formation, player as never, 0.016);

      // Leader's input should not be modified by FormationSystem
      expect(leader.input.yaw).toBe(0);
      expect(leader.input.pitch).toBe(0);
    });
  });

  describe("engagement", () => {
    it("breaks formation when player is within engagement range", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 }, 0);
      const wingman = makeAircraft({ x: 30, y: 50, z: -20 }, 0);

      const formation = system.createFormation(
        "wing",
        leader as never,
        [wingman as never],
      );

      // Player is close
      const player = makeAircraft({ x: 0, y: 50, z: 200 });
      system.update(formation, player as never, 0.016);

      expect(formation.engaged).toBe(true);
    });

    it("does not break formation when player is far away", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 }, 0);
      const wingman = makeAircraft({ x: 30, y: 50, z: -20 }, 0);

      const formation = system.createFormation(
        "wing",
        leader as never,
        [wingman as never],
      );

      const player = makeAircraft({ x: 0, y: 50, z: 2000 });
      system.update(formation, player as never, 0.016);

      expect(formation.engaged).toBe(false);
    });
  });

  describe("reformation", () => {
    it("reforms when player leaves engagement range", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 }, 0);
      const wingman = makeAircraft({ x: 30, y: 50, z: -20 }, 0);

      const formation = system.createFormation(
        "wing",
        leader as never,
        [wingman as never],
      );

      // Engage
      const closePlayer = makeAircraft({ x: 0, y: 50, z: 200 });
      system.update(formation, closePlayer as never, 0.016);
      expect(formation.engaged).toBe(true);

      // Move player far away
      const farPlayer = makeAircraft({ x: 0, y: 50, z: 2000 });
      system.update(formation, farPlayer as never, 0.016);
      expect(formation.engaged).toBe(false);
    });
  });

  describe("dead wingmen", () => {
    it("skips dead wingmen when computing formation offsets", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 }, 0);
      const wingman = makeAircraft({ x: 30, y: 50, z: -20 }, 0);
      wingman.alive = false;

      const formation = system.createFormation(
        "wing",
        leader as never,
        [wingman as never],
      );

      const player = makeAircraft({ x: 0, y: 50, z: 2000 });
      // Should not throw
      system.update(formation, player as never, 0.016);

      // Dead wingman's input should not be modified
      expect(wingman.input.yaw).toBe(0);
    });
  });

  describe("diamond offsets", () => {
    it("assigns distinct offsets for each wingman in diamond formation", () => {
      const leader = makeAircraft({ x: 0, y: 50, z: 0 }, 0);
      const w1 = makeAircraft({ x: 200, y: 50, z: 200 }, 0);
      const w2 = makeAircraft({ x: -200, y: 50, z: 200 }, 0);
      const w3 = makeAircraft({ x: 0, y: 50, z: 200 }, 0);

      const formation = system.createFormation(
        "diamond",
        leader as never,
        [w1 as never, w2 as never, w3 as never],
      );

      const player = makeAircraft({ x: 0, y: 50, z: 2000 });
      system.update(formation, player as never, 0.016);

      // Each wingman should be steering differently (different yaw values)
      // At minimum, they shouldn't all be identical since they have different targets
      const yaws = [w1.input.yaw, w2.input.yaw, w3.input.yaw];
      const allSame = yaws.every((y) => y === yaws[0]);
      expect(allSame).toBe(false);
    });
  });
});
