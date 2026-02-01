// ABOUTME: Tests for AssetLoader — verifies GLTF model loading and mesh replacement on Aircraft.
// ABOUTME: Validates catalog integration, fallback behavior, and transparent mesh swapping.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockImportMeshAsync, mockMeshes, mockLoadResult } = vi.hoisted(() => {
  const mockMeshes = [
    {
      name: "__root__",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scaling: { x: 1, y: 1, z: 1 },
      getChildMeshes: vi.fn(() => []),
      setParent: vi.fn(),
      dispose: vi.fn(),
      isVisible: true,
    },
  ];

  const mockLoadResult = { meshes: mockMeshes };
  const mockImportMeshAsync = vi.fn(() => Promise.resolve(mockLoadResult));

  return { mockImportMeshAsync, mockMeshes, mockLoadResult };
});

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    Scene: MockScene,
    SceneLoader: {
      ImportMeshAsync: mockImportMeshAsync,
    },
  };
});

vi.mock("@babylonjs/loaders/glTF", () => ({}));

import { AssetLoader } from "./AssetLoader";
import { Scene } from "@babylonjs/core";

describe("AssetLoader", () => {
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    mockImportMeshAsync.mockResolvedValue(mockLoadResult);
  });

  it("loads a GLTF model from a given path", async () => {
    scene = new (Scene as unknown as new () => Scene)();
    const loader = new AssetLoader(scene);
    const mesh = await loader.load("models/f-14.glb");
    expect(mockImportMeshAsync).toHaveBeenCalledWith("", "models/f-14.glb", "", scene);
    expect(mesh).toBe(mockMeshes[0]);
  });

  it("returns null when loading fails", async () => {
    scene = new (Scene as unknown as new () => Scene)();
    mockImportMeshAsync.mockRejectedValue(new Error("404"));
    const loader = new AssetLoader(scene);
    const mesh = await loader.load("models/missing.glb");
    expect(mesh).toBeNull();
  });

  it("caches loaded models by path", async () => {
    scene = new (Scene as unknown as new () => Scene)();
    const loader = new AssetLoader(scene);
    await loader.load("models/f-14.glb");
    await loader.load("models/f-14.glb");
    expect(mockImportMeshAsync).toHaveBeenCalledTimes(1);
  });

  it("preloads multiple models from aircraft catalog", async () => {
    scene = new (Scene as unknown as new () => Scene)();
    const loader = new AssetLoader(scene);
    const catalog = [
      { id: "f-14", modelPath: "models/f-14.glb" },
      { id: "fa-18", modelPath: "models/fa-18.glb" },
    ];
    await loader.preloadFromCatalog(catalog);
    expect(mockImportMeshAsync).toHaveBeenCalledTimes(2);
  });

  it("skips catalog entries without modelPath", async () => {
    scene = new (Scene as unknown as new () => Scene)();
    const loader = new AssetLoader(scene);
    const catalog = [
      { id: "f-14", modelPath: "models/f-14.glb" },
      { id: "p-51" },
    ];
    await loader.preloadFromCatalog(catalog);
    expect(mockImportMeshAsync).toHaveBeenCalledTimes(1);
  });

  it("replaces aircraft placeholder mesh with loaded model", async () => {
    scene = new (Scene as unknown as new () => Scene)();
    const loader = new AssetLoader(scene);

    const oldMesh = {
      position: { x: 50, y: 30, z: 100 },
      rotation: { x: 0.5, y: 1.2, z: 0 },
      scaling: { x: 1, y: 1, z: 1 },
      dispose: vi.fn(),
      isVisible: true,
    };

    const aircraft = { mesh: oldMesh } as any;

    await loader.applyModel(aircraft, "models/f-14.glb");

    // Old mesh should be disposed
    expect(oldMesh.dispose).toHaveBeenCalled();
    // Aircraft mesh replaced with loaded root
    expect(aircraft.mesh).toBe(mockMeshes[0]);
    // Position preserved from old mesh
    expect(aircraft.mesh.position.x).toBe(50);
    expect(aircraft.mesh.position.y).toBe(30);
    expect(aircraft.mesh.position.z).toBe(100);
  });

  it("keeps placeholder mesh when model fails to load", async () => {
    scene = new (Scene as unknown as new () => Scene)();
    mockImportMeshAsync.mockRejectedValue(new Error("404"));
    const loader = new AssetLoader(scene);

    const oldMesh = {
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scaling: { x: 1, y: 1, z: 1 },
      dispose: vi.fn(),
      isVisible: true,
    };

    const aircraft = { mesh: oldMesh } as any;

    await loader.applyModel(aircraft, "models/missing.glb");

    // Old mesh should NOT be disposed
    expect(oldMesh.dispose).not.toHaveBeenCalled();
    // Aircraft still uses placeholder
    expect(aircraft.mesh).toBe(oldMesh);
  });
});
