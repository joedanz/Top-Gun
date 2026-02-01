// ABOUTME: Tests that Terrain and Skybox support Arctic theater color palettes.
// ABOUTME: Verifies snow/ice terrain color and cold-palette skybox for Arctic missions.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateGround, mockCreateBox } = vi.hoisted(() => {
  const mockCreateGround = vi.fn((_name: string) => ({
    name: "terrain",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scaling: { x: 1, y: 1, z: 1 },
    receiveShadows: false,
    material: null as unknown,
    infiniteDistance: false,
  }));
  const mockCreateBox = vi.fn((_name: string) => ({
    name: "skybox",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scaling: { x: 1, y: 1, z: 1 },
    material: null as unknown,
    infiniteDistance: false,
  }));
  return { mockCreateGround, mockCreateBox };
});

vi.mock("@babylonjs/core", () => {
  class MockScene { render = vi.fn(); }
  class MockVector3 {
    constructor(public x: number, public y: number, public z: number) {}
    static Zero() { return new MockVector3(0, 0, 0); }
  }
  class MockColor3 {
    constructor(public r: number, public g: number, public b: number) {}
  }
  class MockTexture { uScale = 1; vScale = 1; constructor(public url: string) {} }
  class MockStandardMaterial {
    diffuseColor: unknown = null;
    diffuseTexture: unknown = null;
    specularColor: unknown = null;
    emissiveColor: unknown = null;
    backFaceCulling = true;
    disableLighting = false;
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
      CreateBox: mockCreateBox,
    },
  };
});

import { Terrain } from "./Terrain";
import { Skybox } from "./Skybox";
import { Scene, Color3 } from "@babylonjs/core";

function makeScene(): Scene {
  return new (Scene as unknown as new () => Scene)();
}

describe("Arctic Terrain Palette", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates terrain with snow/ice colors when theater is arctic", () => {
    const scene = makeScene();
    const terrain = new Terrain(scene, "arctic");
    const material = terrain.mesh.material as unknown as { diffuseColor: { r: number; g: number; b: number } };
    // Arctic terrain should be whitish/icy (high r, g, b values)
    expect(material.diffuseColor.r).toBeGreaterThan(0.7);
    expect(material.diffuseColor.g).toBeGreaterThan(0.7);
    expect(material.diffuseColor.b).toBeGreaterThan(0.7);
  });

  it("creates default green terrain when no theater specified", () => {
    const scene = makeScene();
    const terrain = new Terrain(scene);
    const material = terrain.mesh.material as unknown as { diffuseColor: { r: number; g: number; b: number } };
    // Default terrain is greenish
    expect(material.diffuseColor.g).toBeGreaterThan(material.diffuseColor.r);
  });
});

describe("Arctic Skybox Palette", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates skybox with cold palette when theater is arctic", () => {
    const scene = makeScene();
    const skybox = new Skybox(scene, "arctic");
    const material = skybox.mesh.material as unknown as { emissiveColor: { r: number; g: number; b: number } };
    // Arctic skybox should be cold blue-grey
    expect(material.emissiveColor.b).toBeGreaterThan(material.emissiveColor.r);
  });

  it("creates default skybox when no theater specified", () => {
    const scene = makeScene();
    const skybox = new Skybox(scene);
    const material = skybox.mesh.material as unknown as { emissiveColor: { r: number; g: number; b: number } };
    // Default sky is blue-ish
    expect(material.emissiveColor).toBeDefined();
  });
});
