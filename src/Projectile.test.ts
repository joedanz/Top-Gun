// ABOUTME: Tests for Projectile entity — verifies mesh creation, movement, and lifetime.
// ABOUTME: Uses mocked Babylon.js since jsdom has no WebGL.

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
      CreateCylinder: vi.fn((_name: string) => createMockMesh("projectile")),
    },
  };
});

import { Projectile } from "./Projectile";
import { Scene } from "@babylonjs/core";

describe("Projectile", () => {
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
  });

  it("creates a mesh in the scene", async () => {
    const { MeshBuilder } = await import("@babylonjs/core");
    new Projectile(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    expect(MeshBuilder.CreateCylinder).toHaveBeenCalled();
  });

  it("starts alive", () => {
    const p = new Projectile(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    expect(p.alive).toBe(true);
  });

  it("moves forward along the direction each update", () => {
    const p = new Projectile(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    p.update(0.016);
    expect(p.mesh.position.z).toBeGreaterThan(0);
  });

  it("dies after exceeding lifetime", () => {
    const p = new Projectile(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    p.update(5); // 5 seconds exceeds default lifetime
    expect(p.alive).toBe(false);
  });

  it("disposes mesh when it dies", () => {
    const p = new Projectile(scene, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
    p.update(5);
    expect(p.mesh.dispose).toHaveBeenCalled();
  });
});
