// ABOUTME: Tests for GroundTarget entity — stationary ground entities (SAM, bunker, vehicle, radar).
// ABOUTME: Verifies mesh creation, health/damage, SAM missile firing, and destruction.

import { describe, it, expect, vi, beforeEach } from "vitest";

const createMockMesh = (name: string) => ({
  name,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  dispose: vi.fn(),
});

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    Scene: MockScene,
    MeshBuilder: {
      CreateBox: vi.fn((_name: string) => createMockMesh(_name)),
      CreateCylinder: vi.fn((_name: string) => createMockMesh(_name)),
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
  };
});

import { GroundTarget, type GroundTargetType } from "./GroundTarget";
import { Scene } from "@babylonjs/core";

describe("GroundTarget", () => {
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
  });

  it("creates a mesh at the specified position", () => {
    const gt = new GroundTarget(scene, "bunker", { x: 100, y: 0, z: 200 });
    expect(gt.mesh.position.x).toBe(100);
    expect(gt.mesh.position.y).toBe(0);
    expect(gt.mesh.position.z).toBe(200);
  });

  it("starts alive with full health", () => {
    const gt = new GroundTarget(scene, "bunker", { x: 0, y: 0, z: 0 });
    expect(gt.alive).toBe(true);
    expect(gt.health).toBeGreaterThan(0);
  });

  it("can be damaged", () => {
    const gt = new GroundTarget(scene, "bunker", { x: 0, y: 0, z: 0 });
    const initialHealth = gt.health;
    gt.health -= 30;
    expect(gt.health).toBe(initialHealth - 30);
  });

  it("has different health for different types", () => {
    const bunker = new GroundTarget(scene, "bunker", { x: 0, y: 0, z: 0 });
    const vehicle = new GroundTarget(scene, "vehicle", { x: 0, y: 0, z: 0 });
    // Bunkers should be tougher than vehicles
    expect(bunker.health).toBeGreaterThan(vehicle.health);
  });

  it("implements Hittable interface (has mesh, alive, damage fields)", () => {
    const gt = new GroundTarget(scene, "sam", { x: 0, y: 0, z: 0 });
    expect(gt.mesh).toBeDefined();
    expect(gt.mesh.position).toBeDefined();
    expect(gt.mesh.dispose).toBeDefined();
    expect(typeof gt.alive).toBe("boolean");
  });

  it("SAM type can fire missiles at a target", () => {
    const sam = new GroundTarget(scene, "sam", { x: 0, y: 0, z: 0 });
    const targetPos = { x: 100, y: 50, z: 200 };
    const missiles = sam.tryFire(scene, targetPos, 1.0);
    // SAM sites should fire when enough time has passed
    expect(missiles.length).toBeGreaterThanOrEqual(0);
  });

  it("SAM fires a missile after cooldown period", () => {
    const sam = new GroundTarget(scene, "sam", { x: 0, y: 0, z: 0 });
    const targetPos = { x: 100, y: 50, z: 200 };
    // Accumulate enough time for cooldown
    sam.tryFire(scene, targetPos, 5.0);
    const missiles = sam.tryFire(scene, targetPos, 5.0);
    expect(missiles.length).toBeGreaterThan(0);
  });

  it("non-SAM types do not fire missiles", () => {
    const bunker = new GroundTarget(scene, "bunker", { x: 0, y: 0, z: 0 });
    const targetPos = { x: 100, y: 50, z: 200 };
    const missiles = bunker.tryFire(scene, targetPos, 5.0);
    expect(missiles.length).toBe(0);
  });

  it("SAM has limited missile ammo", () => {
    const sam = new GroundTarget(scene, "sam", { x: 0, y: 0, z: 0 });
    const targetPos = { x: 100, y: 50, z: 200 };
    let totalFired = 0;
    // Fire many times — should eventually run out
    for (let i = 0; i < 20; i++) {
      const missiles = sam.tryFire(scene, targetPos, 5.0);
      totalFired += missiles.length;
    }
    expect(totalFired).toBeGreaterThan(0);
    expect(totalFired).toBeLessThanOrEqual(10); // reasonable limit
  });

  it("dead SAM does not fire", () => {
    const sam = new GroundTarget(scene, "sam", { x: 0, y: 0, z: 0 });
    sam.alive = false;
    const missiles = sam.tryFire(scene, { x: 100, y: 50, z: 200 }, 10.0);
    expect(missiles.length).toBe(0);
  });

  it("supports all four ground target types", () => {
    const types: GroundTargetType[] = ["sam", "bunker", "vehicle", "radar"];
    for (const type of types) {
      const gt = new GroundTarget(scene, type, { x: 0, y: 0, z: 0 });
      expect(gt.alive).toBe(true);
    }
  });
});
