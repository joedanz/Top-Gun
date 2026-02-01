// ABOUTME: Tests for Rocket entity — unguided forward-flying projectile with shorter range than bullets.
// ABOUTME: Verifies mesh creation, forward movement, lifetime, and disposal.

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
      CreateCylinder: vi.fn((_name: string) => createMockMesh("rocket")),
    },
  };
});

import { Rocket } from "./Rocket";
import { Scene } from "@babylonjs/core";

describe("Rocket", () => {
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
  });

  it("creates a mesh in the scene", async () => {
    const { MeshBuilder } = await import("@babylonjs/core");
    new Rocket(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    expect(MeshBuilder.CreateCylinder).toHaveBeenCalled();
  });

  it("starts alive", () => {
    const r = new Rocket(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    expect(r.alive).toBe(true);
  });

  it("moves forward along direction each update", () => {
    const r = new Rocket(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    r.update(0.016);
    // Yaw=0 means forward along Z
    expect(r.mesh.position.z).toBeGreaterThan(0);
  });

  it("travels slower than bullets but faster than aircraft", () => {
    const r = new Rocket(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    r.update(1.0);
    // Rocket speed ~350, so after 1s should move ~350 units along Z
    expect(r.mesh.position.z).toBeGreaterThan(200);
    expect(r.mesh.position.z).toBeLessThan(500);
  });

  it("dies after exceeding lifetime", () => {
    const r = new Rocket(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    r.update(4); // rockets have shorter lifetime than bullets
    expect(r.alive).toBe(false);
  });

  it("disposes mesh when it dies", () => {
    const r = new Rocket(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    r.update(4);
    expect(r.mesh.dispose).toHaveBeenCalled();
  });

  it("has higher damage than a bullet", () => {
    const r = new Rocket(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    expect(r.damage).toBeGreaterThan(10); // bullets do 10
  });
});
