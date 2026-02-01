// ABOUTME: Tests for MissionLoader that parses mission JSON and spawns entities.
// ABOUTME: Verifies player/enemy positioning and objective manager creation.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/core", () => {
  return {
    MeshBuilder: {
      CreateCylinder: vi.fn(() => ({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: null,
        dispose: vi.fn(),
      })),
      CreateBox: vi.fn(() => ({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: null,
        dispose: vi.fn(),
      })),
    },
    StandardMaterial: class {
      diffuseColor = { r: 0, g: 0, b: 0 };
    },
    Color3: class {
      constructor(
        public r: number,
        public g: number,
        public b: number,
      ) {}
    },
    Scene: class {},
    Vector3: class {
      constructor(
        public x: number,
        public y: number,
        public z: number,
      ) {}
      static Zero() {
        return { x: 0, y: 0, z: 0 };
      }
    },
    ParticleSystem: class {
      emitter = null;
      minSize = 0;
      maxSize = 0;
      minLifeTime = 0;
      maxLifeTime = 0;
      emitRate = 0;
      color1 = null;
      color2 = null;
      colorDead = null;
      minEmitPower = 0;
      maxEmitPower = 0;
      direction1 = null;
      direction2 = null;
      targetStopDuration = 0;
      disposeOnStop = false;
      start = vi.fn();
    },
    Color4: class {
      constructor(
        public r: number,
        public g: number,
        public b: number,
        public a: number,
      ) {}
    },
    Texture: class {},
  };
});

import { MissionLoader } from "./MissionLoader";
import type { MissionData } from "./MissionData";

const testMission: MissionData = {
  id: "test-01",
  title: "Test Mission",
  description: "A test mission",
  theater: "pacific",
  playerStart: {
    position: { x: 0, y: 50, z: 0 },
    heading: 0,
  },
  enemies: [
    { position: { x: 100, y: 50, z: 200 } },
    { position: { x: -100, y: 60, z: 300 }, color: { r: 1, g: 0.5, b: 0 } },
  ],
  objectives: [{ type: "destroy_enemies", description: "Destroy 2 enemies", count: 2 }],
};

describe("MissionLoader", () => {
  let scene: never;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = {} as never;
  });

  it("creates player aircraft at the specified start position", () => {
    const result = MissionLoader.load(testMission, scene);
    expect(result.player.mesh.position.x).toBe(0);
    expect(result.player.mesh.position.y).toBe(50);
    expect(result.player.mesh.position.z).toBe(0);
  });

  it("sets player heading from mission data", () => {
    const mission = { ...testMission, playerStart: { position: { x: 0, y: 50, z: 0 }, heading: Math.PI / 2 } };
    const result = MissionLoader.load(mission, scene);
    expect(result.player.mesh.rotation.y).toBe(Math.PI / 2);
  });

  it("spawns the correct number of enemies", () => {
    const result = MissionLoader.load(testMission, scene);
    expect(result.enemies).toHaveLength(2);
  });

  it("positions enemies at specified coordinates", () => {
    const result = MissionLoader.load(testMission, scene);
    expect(result.enemies[0].mesh.position.x).toBe(100);
    expect(result.enemies[0].mesh.position.y).toBe(50);
    expect(result.enemies[0].mesh.position.z).toBe(200);
  });

  it("creates an ObjectiveManager from mission objectives", () => {
    const result = MissionLoader.load(testMission, scene);
    expect(result.objectiveManager).toBeDefined();
    expect(result.objectiveManager.allComplete()).toBe(false);
  });

  it("provides input manager for player", () => {
    const result = MissionLoader.load(testMission, scene);
    expect(result.inputManager).toBeDefined();
  });

  it("returns empty groundTargets when mission has none", () => {
    const result = MissionLoader.load(testMission, scene);
    expect(result.groundTargets).toHaveLength(0);
  });

  it("spawns ground targets from mission data", () => {
    const mission: MissionData = {
      ...testMission,
      groundTargets: [
        { type: "sam", position: { x: 50, y: 0, z: 100 } },
        { type: "bunker", position: { x: -50, y: 0, z: 200 } },
      ],
    };
    const result = MissionLoader.load(mission, scene);
    expect(result.groundTargets).toHaveLength(2);
    expect(result.groundTargets[0].type).toBe("sam");
    expect(result.groundTargets[0].mesh.position.x).toBe(50);
    expect(result.groundTargets[1].type).toBe("bunker");
  });
});
