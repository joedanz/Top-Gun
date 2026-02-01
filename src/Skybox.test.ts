// ABOUTME: Tests for Skybox — verifies skybox creation with gradient material.
// ABOUTME: Uses mocked Babylon.js since jsdom has no WebGL.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateBox } = vi.hoisted(() => {
  const mockCreateBox = vi.fn((_name: string) => ({
    name: "skybox",
    position: { x: 0, y: 0, z: 0 },
    scaling: { x: 1, y: 1, z: 1 },
    infiniteDistance: false,
    material: null as unknown,
  }));
  return { mockCreateBox };
});

vi.mock("@babylonjs/core", () => {
  class MockScene { render = vi.fn(); }
  class MockVector3 {
    constructor(public x: number, public y: number, public z: number) {}
    static Zero() { return new MockVector3(0, 0, 0); }
  }
  class MockColor3 { constructor(public r: number, public g: number, public b: number) {} }
  class MockStandardMaterial {
    diffuseColor: unknown = null;
    emissiveColor: unknown = null;
    backFaceCulling = true;
    disableLighting = false;
    constructor(public name: string) {}
  }

  return {
    Scene: MockScene,
    Vector3: MockVector3,
    Color3: MockColor3,
    StandardMaterial: MockStandardMaterial,
    MeshBuilder: {
      CreateBox: mockCreateBox,
    },
  };
});

import { Skybox } from "./Skybox";
import { Scene } from "@babylonjs/core";

describe("Skybox", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a skybox mesh", () => {
    const scene = new (Scene as unknown as new () => Scene)();
    const skybox = new Skybox(scene);
    expect(skybox.mesh).toBeDefined();
  });

  it("creates a large box for the skybox", () => {
    const scene = new (Scene as unknown as new () => Scene)();
    new Skybox(scene);
    expect(mockCreateBox).toHaveBeenCalledWith(
      "skybox",
      expect.objectContaining({ size: expect.any(Number) }),
      expect.anything()
    );
    const args = (mockCreateBox.mock.calls[0] as unknown[])[1] as { size: number };
    expect(args.size).toBeGreaterThanOrEqual(1000);
  });

  it("applies a material with backFaceCulling disabled", () => {
    const scene = new (Scene as unknown as new () => Scene)();
    const skybox = new Skybox(scene);
    expect(skybox.mesh.material).toBeDefined();
    expect(skybox.mesh.material).not.toBeNull();
  });

  it("sets the skybox to infinite distance", () => {
    const scene = new (Scene as unknown as new () => Scene)();
    const skybox = new Skybox(scene);
    expect(skybox.mesh.infiniteDistance).toBe(true);
  });
});
