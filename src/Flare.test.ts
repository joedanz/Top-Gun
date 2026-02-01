// ABOUTME: Tests for the Flare countermeasure entity.
// ABOUTME: Verifies creation, backward drift, lifetime expiry, and disposal.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateSphere, mockParticleSystem } = vi.hoisted(() => {
  class MockMeshInner {
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    dispose = vi.fn();
  }
  return {
    mockCreateSphere: vi.fn(() => new MockMeshInner()),
    mockParticleSystem: vi.fn(),
    MockMeshInner,
  };
});

class MockMesh {
  position = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0 };
  dispose = vi.fn();
}

vi.mock("@babylonjs/core", () => ({
  MeshBuilder: { CreateSphere: mockCreateSphere },
  ParticleSystem: class {
    emitter: unknown = null;
    minSize = 0;
    maxSize = 0;
    minLifeTime = 0;
    maxLifeTime = 0;
    emitRate = 0;
    color1: unknown = null;
    color2: unknown = null;
    colorDead: unknown = null;
    minEmitPower = 0;
    maxEmitPower = 0;
    direction1: unknown = null;
    direction2: unknown = null;
    targetStopDuration = 0;
    disposeOnStop = false;
    start = vi.fn();
    stop = vi.fn();
    dispose = vi.fn();
    constructor() {
      mockParticleSystem();
    }
  },
  Vector3: class {
    constructor(
      public x = 0,
      public y = 0,
      public z = 0,
    ) {}
  },
  Color4: class {
    constructor(
      public r = 0,
      public g = 0,
      public b = 0,
      public a = 0,
    ) {}
  },
}));

import { Flare } from "./Flare";
import type { Scene } from "@babylonjs/core";

describe("Flare", () => {
  const mockScene = {} as Scene;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSphere.mockReturnValue(new MockMesh());
  });

  it("creates a mesh at the given position", () => {
    const flare = new Flare(mockScene, { x: 10, y: 20, z: 30 }, 0);
    expect(flare.mesh.position.x).toBe(10);
    expect(flare.mesh.position.y).toBe(20);
    expect(flare.mesh.position.z).toBe(30);
    expect(flare.alive).toBe(true);
  });

  it("drifts backward over time", () => {
    const flare = new Flare(mockScene, { x: 0, y: 50, z: 0 }, 0);
    const startY = flare.mesh.position.y;
    flare.update(0.1);
    // Flare should drift downward (gravity/drag)
    expect(flare.mesh.position.y).toBeLessThan(startY);
  });

  it("expires after lifetime", () => {
    const flare = new Flare(mockScene, { x: 0, y: 50, z: 0 }, 0);
    // Flares last about 3 seconds
    flare.update(1);
    flare.update(1);
    flare.update(1);
    expect(flare.alive).toBe(false);
  });

  it("disposes mesh when expired", () => {
    const flare = new Flare(mockScene, { x: 0, y: 50, z: 0 }, 0);
    flare.update(4);
    expect(flare.mesh.dispose).toHaveBeenCalled();
  });

  it("creates a particle system for visual effect", () => {
    new Flare(mockScene, { x: 0, y: 50, z: 0 }, 0);
    expect(mockParticleSystem).toHaveBeenCalled();
  });
});
