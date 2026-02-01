// ABOUTME: Tests for Terrain — verifies ground plane creation with large dimensions and texture.
// ABOUTME: Uses mocked Babylon.js since jsdom has no WebGL.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateGround } = vi.hoisted(() => {
  const mockCreateGround = vi.fn((_name: string) => ({
    name: "terrain",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scaling: { x: 1, y: 1, z: 1 },
    receiveShadows: false,
    material: null as unknown,
  }));
  return { mockCreateGround };
});

vi.mock("@babylonjs/core", () => {
  class MockScene { render = vi.fn(); }
  class MockVector3 {
    constructor(public x: number, public y: number, public z: number) {}
    static Zero() { return new MockVector3(0, 0, 0); }
  }
  class MockColor3 { constructor(public r: number, public g: number, public b: number) {} }
  class MockTexture { uScale = 1; vScale = 1; constructor(public url: string) {} }
  class MockStandardMaterial {
    diffuseColor: unknown = null;
    diffuseTexture: unknown = null;
    specularColor: unknown = null;
    constructor(public name: string) {}
  }

  return {
    Scene: MockScene,
    Vector3: MockVector3,
    Color3: MockColor3,
    Texture: MockTexture,
    StandardMaterial: MockStandardMaterial,
    MeshBuilder: {
      CreateGround: mockCreateGround,
    },
  };
});

import { Terrain } from "./Terrain";
import { Scene } from "@babylonjs/core";

describe("Terrain", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a ground mesh", () => {
    const scene = new (Scene as unknown as new () => Scene)();
    const terrain = new Terrain(scene);
    expect(terrain.mesh).toBeDefined();
  });

  it("creates a large terrain (at least 2000 units wide)", () => {
    const scene = new (Scene as unknown as new () => Scene)();
    new Terrain(scene);
    expect(mockCreateGround).toHaveBeenCalledWith(
      "terrain",
      expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
      }),
      expect.anything()
    );
    const args = (mockCreateGround.mock.calls[0] as unknown[])[1] as { width: number; height: number };
    expect(args.width).toBeGreaterThanOrEqual(2000);
    expect(args.height).toBeGreaterThanOrEqual(2000);
  });

  it("applies a material with texture to the terrain", () => {
    const scene = new (Scene as unknown as new () => Scene)();
    const terrain = new Terrain(scene);
    expect(terrain.mesh.material).toBeDefined();
    expect(terrain.mesh.material).not.toBeNull();
  });
});
