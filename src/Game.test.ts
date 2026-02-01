// ABOUTME: Tests for the Game class — verifies scene setup, ground plane, and movable cube.
// ABOUTME: Uses mocked Babylon.js engine since jsdom has no WebGL.

import { describe, it, expect, vi } from "vitest";

const createMockMesh = (name: string) => ({
  name,
  position: { x: 0, y: 0, z: 0 },
  scaling: { x: 1, y: 1, z: 1 },
  receiveShadows: false,
});

// Mock Babylon.js modules since jsdom doesn't support WebGL
vi.mock("@babylonjs/core", () => {
  class MockEngine {
    runRenderLoop = vi.fn();
    resize = vi.fn();
    getDeltaTime = vi.fn(() => 16);
  }

  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  class MockFreeCamera {
    setTarget = vi.fn();
    attachControl = vi.fn();
    position = { x: 0, y: 5, z: -10 };
  }

  class MockHemisphericLight {
    intensity = 1;
  }

  class MockVector3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static Zero() {
      return new MockVector3(0, 0, 0);
    }
  }

  class MockColor4 {
    constructor(
      public r: number,
      public g: number,
      public b: number,
      public a: number
    ) {}
  }

  return {
    Engine: MockEngine,
    Scene: MockScene,
    FreeCamera: MockFreeCamera,
    HemisphericLight: MockHemisphericLight,
    Vector3: MockVector3,
    Color4: MockColor4,
    MeshBuilder: {
      CreateGround: vi.fn((_name: string) => createMockMesh("ground")),
      CreateBox: vi.fn((_name: string) => createMockMesh("cube")),
    },
  };
});

import { Game } from "./Game";

describe("Game", () => {
  it("creates an engine and scene", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.engine).toBeDefined();
    expect(game.scene).toBeDefined();
  });

  it("creates a ground plane", async () => {
    const { MeshBuilder } = await import("@babylonjs/core");
    const canvas = document.createElement("canvas");
    new Game(canvas);
    expect(MeshBuilder.CreateGround).toHaveBeenCalledWith(
      "ground",
      expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }),
      expect.anything()
    );
  });

  it("creates a movable cube above the ground", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.cube).toBeDefined();
    expect(game.cube.position.y).toBe(1);
  });
});

describe("Cube movement", () => {
  it("moves forward on W key", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    const initialZ = game.cube.position.z;
    game.handleKey("w", 1 / 60);
    expect(game.cube.position.z).toBeGreaterThan(initialZ);
  });

  it("moves backward on S key", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    const initialZ = game.cube.position.z;
    game.handleKey("s", 1 / 60);
    expect(game.cube.position.z).toBeLessThan(initialZ);
  });

  it("moves left on A key", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    const initialX = game.cube.position.x;
    game.handleKey("a", 1 / 60);
    expect(game.cube.position.x).toBeLessThan(initialX);
  });

  it("moves right on D key", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    const initialX = game.cube.position.x;
    game.handleKey("d", 1 / 60);
    expect(game.cube.position.x).toBeGreaterThan(initialX);
  });
});
