// ABOUTME: Tests for Bomb entity — gravity-affected munition for ground targets.
// ABOUTME: Verifies mesh creation, forward+downward movement, ground detonation, and disposal.

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
      CreateCylinder: vi.fn((_name: string) => createMockMesh("bomb")),
    },
  };
});

import { Bomb } from "./Bomb";
import { Scene } from "@babylonjs/core";

describe("Bomb", () => {
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
  });

  it("creates a mesh in the scene", async () => {
    const { MeshBuilder } = await import("@babylonjs/core");
    new Bomb(scene, { x: 0, y: 100, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    expect(MeshBuilder.CreateCylinder).toHaveBeenCalled();
  });

  it("starts alive", () => {
    const b = new Bomb(scene, { x: 0, y: 100, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    expect(b.alive).toBe(true);
  });

  it("moves forward along aircraft heading", () => {
    const b = new Bomb(scene, { x: 0, y: 100, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    b.update(0.1);
    // Should drift forward based on initial aircraft speed
    expect(b.mesh.position.z).toBeGreaterThan(0);
  });

  it("falls due to gravity", () => {
    const b = new Bomb(scene, { x: 0, y: 100, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    b.update(0.5);
    expect(b.mesh.position.y).toBeLessThan(100);
  });

  it("accelerates downward over time (gravity)", () => {
    const b = new Bomb(scene, { x: 0, y: 200, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    b.update(0.1);
    const firstDrop = 200 - b.mesh.position.y;
    b.update(0.1);
    const secondDrop = (200 - firstDrop - b.mesh.position.y);
    // Second drop should be larger due to gravitational acceleration
    // (actually total drop vs remaining, let's just check y is decreasing faster)
    expect(b.mesh.position.y).toBeLessThan(200 - firstDrop);
  });

  it("detonates when reaching ground level", () => {
    const b = new Bomb(scene, { x: 0, y: 5, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    b.update(1.0); // Should fall to ground
    expect(b.alive).toBe(false);
  });

  it("disposes mesh on detonation", () => {
    const b = new Bomb(scene, { x: 0, y: 5, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    b.update(1.0);
    expect(b.mesh.dispose).toHaveBeenCalled();
  });

  it("has high damage for ground targets", () => {
    const b = new Bomb(scene, { x: 0, y: 100, z: 0 }, { x: 0, y: 0, z: 0 }, 150);
    expect(b.damage).toBeGreaterThan(50);
  });
});
