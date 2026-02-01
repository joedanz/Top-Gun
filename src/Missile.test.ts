// ABOUTME: Tests for Missile entity — verifies homing behavior, lifetime, and turning limits.
// ABOUTME: Uses mocked Babylon.js since jsdom has no WebGL.

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDispose = vi.fn();

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
  }

  return {
    Scene: MockScene,
    MeshBuilder: {
      CreateCylinder: vi.fn(() => ({
        name: "missile",
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        dispose: mockDispose,
      })),
    },
  };
});

import { Missile } from "./Missile";
import { Scene } from "@babylonjs/core";

describe("Missile", () => {
  let scene: Scene;
  let target: { mesh: { position: { x: number; y: number; z: number } }; alive: boolean };

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
    target = {
      mesh: { position: { x: 100, y: 10, z: 100 } },
      alive: true,
    };
  });

  it("creates a mesh at the given position", () => {
    const m = new Missile(scene, { x: 5, y: 10, z: 15 }, { x: 0, y: 0, z: 0 }, target as never);
    expect(m.mesh.position.x).toBe(5);
    expect(m.mesh.position.y).toBe(10);
    expect(m.mesh.position.z).toBe(15);
  });

  it("moves toward its target", () => {
    const m = new Missile(scene, { x: 0, y: 10, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, target as never);
    const initialX = m.mesh.position.x;
    const initialZ = m.mesh.position.z;
    m.update(0.1);
    // Should have moved closer to target at (100, 10, 100)
    const dx = m.mesh.position.x - initialX;
    const dz = m.mesh.position.z - initialZ;
    expect(dx > 0 || dz > 0).toBe(true);
  });

  it("has limited turning ability (cannot instantly face target)", () => {
    // Target behind the missile — missile faces forward (Z+), target at Z-
    const behindTarget = { mesh: { position: { x: 0, y: 10, z: -100 } }, alive: true };
    const m = new Missile(scene, { x: 0, y: 10, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, behindTarget as never);
    m.update(0.016); // one frame
    // After one frame, missile should NOT have reversed direction — turn rate is limited
    // Missile started facing Z+, so it should still be moving mostly in Z+ direction
    expect(m.mesh.position.z).toBeGreaterThan(0);
  });

  it("expires after max lifetime", () => {
    const m = new Missile(scene, { x: 0, y: 10, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, target as never);
    expect(m.alive).toBe(true);
    m.update(10); // long enough to expire
    expect(m.alive).toBe(false);
  });

  it("disposes mesh on expiry", () => {
    const m = new Missile(scene, { x: 0, y: 10, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, target as never);
    m.update(10);
    expect(mockDispose).toHaveBeenCalled();
  });

  it("stops tracking if target dies", () => {
    const m = new Missile(scene, { x: 0, y: 10, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, target as never);
    target.alive = false;
    const z1 = m.mesh.position.z;
    m.update(0.1);
    // Should still move forward but in a straight line (no tracking)
    expect(m.mesh.position.z).toBeGreaterThan(z1);
    expect(m.alive).toBe(true);
  });
});
