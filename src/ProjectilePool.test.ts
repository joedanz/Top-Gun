// ABOUTME: Tests for ProjectilePool — object pooling for projectile meshes.
// ABOUTME: Verifies mesh reuse, pool growth, and reset behavior.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateCylinder } = vi.hoisted(() => {
  const mockCreateCylinder = vi.fn();
  return { mockCreateCylinder };
});

vi.mock("@babylonjs/core", () => {
  class MockVector3 {
    x = 0;
    y = 0;
    z = 0;
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  }

  return {
    MeshBuilder: {
      CreateCylinder: mockCreateCylinder,
    },
    Vector3: MockVector3,
  };
});

import { ProjectilePool } from "./ProjectilePool";

function makeMesh() {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    setEnabled: vi.fn(),
    isEnabled: vi.fn().mockReturnValue(true),
    dispose: vi.fn(),
  };
}

describe("ProjectilePool", () => {
  let scene: unknown;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCreateCylinder.mockImplementation(() => makeMesh());
    scene = {};
  });

  it("acquires a projectile mesh without creating new ones after preallocate", () => {
    const pool = new ProjectilePool(scene as never, 10);
    const createCount = mockCreateCylinder.mock.calls.length;

    const entry = pool.acquire();
    expect(entry).toBeDefined();
    // Should NOT have called CreateCylinder again — reusing from pool
    expect(mockCreateCylinder.mock.calls.length).toBe(createCount);
  });

  it("preallocates meshes on construction", () => {
    new ProjectilePool(scene as never, 5);
    expect(mockCreateCylinder).toHaveBeenCalledTimes(5);
  });

  it("returns mesh to pool on release", () => {
    const pool = new ProjectilePool(scene as never, 2);
    const entry = pool.acquire();
    expect(pool.availableCount).toBe(1);

    pool.release(entry);
    expect(pool.availableCount).toBe(2);
  });

  it("disables mesh when released", () => {
    const pool = new ProjectilePool(scene as never, 2);
    const entry = pool.acquire();
    pool.release(entry);
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("enables mesh when acquired", () => {
    const pool = new ProjectilePool(scene as never, 2);
    const entry = pool.acquire();
    expect(entry.setEnabled).toHaveBeenCalledWith(true);
  });

  it("grows the pool when all meshes are in use", () => {
    const pool = new ProjectilePool(scene as never, 1);
    pool.acquire(); // takes the one preallocated
    const createCountBefore = mockCreateCylinder.mock.calls.length;

    const entry2 = pool.acquire(); // should grow pool
    expect(entry2).toBeDefined();
    expect(mockCreateCylinder.mock.calls.length).toBeGreaterThan(createCountBefore);
  });

  it("disposes all meshes on dispose", () => {
    const pool = new ProjectilePool(scene as never, 3);
    const entry1 = pool.acquire();
    pool.dispose();
    expect(entry1.dispose).toHaveBeenCalled();
  });
});
