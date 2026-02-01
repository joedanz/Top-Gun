// ABOUTME: Tests for WeaponSystem — verifies projectile spawning and rate of fire limiting.
// ABOUTME: Uses mocked Babylon.js since jsdom has no WebGL.

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDispose = vi.fn();

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    Scene: MockScene,
    MeshBuilder: {
      CreateCylinder: vi.fn(() => ({
        name: "projectile",
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        dispose: mockDispose,
      })),
    },
  };
});

import { WeaponSystem } from "./WeaponSystem";
import { Scene } from "@babylonjs/core";

describe("WeaponSystem", () => {
  let scene: Scene;
  let mockAircraft: { mesh: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }; input: { fire: boolean } };

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
    mockAircraft = {
      mesh: {
        position: { x: 0, y: 10, z: 0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0 },
      },
      input: { fire: false },
    };
  });

  it("spawns a projectile when fire is true", () => {
    const ws = new WeaponSystem(scene);
    mockAircraft.input.fire = true;
    ws.update(mockAircraft as never, 0.016);
    expect(ws.projectiles.length).toBe(1);
  });

  it("does not spawn when fire is false", () => {
    const ws = new WeaponSystem(scene);
    ws.update(mockAircraft as never, 0.016);
    expect(ws.projectiles.length).toBe(0);
  });

  it("enforces rate of fire cooldown", () => {
    const ws = new WeaponSystem(scene);
    mockAircraft.input.fire = true;
    ws.update(mockAircraft as never, 0.016);
    ws.update(mockAircraft as never, 0.016); // too soon
    expect(ws.projectiles.length).toBe(1);
  });

  it("allows firing again after cooldown expires", () => {
    const ws = new WeaponSystem(scene);
    mockAircraft.input.fire = true;
    ws.update(mockAircraft as never, 0.016);
    ws.update(mockAircraft as never, 0.2); // enough time for cooldown
    expect(ws.projectiles.length).toBe(2);
  });

  it("updates existing projectiles each frame", () => {
    const ws = new WeaponSystem(scene);
    mockAircraft.input.fire = true;
    ws.update(mockAircraft as never, 0.016);
    const p = ws.projectiles[0];
    const initialZ = p.mesh.position.z;
    mockAircraft.input.fire = false;
    ws.update(mockAircraft as never, 0.1);
    expect(p.mesh.position.z).not.toBe(initialZ);
  });

  it("decrements ammo on each shot", () => {
    const ws = new WeaponSystem(scene);
    const initialAmmo = ws.ammo;
    mockAircraft.input.fire = true;
    ws.update(mockAircraft as never, 0.016);
    expect(ws.ammo).toBe(initialAmmo - 1);
  });

  it("does not fire when ammo is depleted", () => {
    const ws = new WeaponSystem(scene, 1);
    mockAircraft.input.fire = true;
    ws.update(mockAircraft as never, 0.016); // uses last round
    expect(ws.ammo).toBe(0);
    ws.update(mockAircraft as never, 0.2); // cooldown passed but no ammo
    expect(ws.projectiles.length).toBe(1); // no new projectile
  });

  it("removes dead projectiles from the list", () => {
    const ws = new WeaponSystem(scene);
    mockAircraft.input.fire = true;
    ws.update(mockAircraft as never, 0.016);
    expect(ws.projectiles.length).toBe(1);
    // Advance enough time to kill the projectile
    mockAircraft.input.fire = false;
    ws.update(mockAircraft as never, 5);
    expect(ws.projectiles.length).toBe(0);
  });
});
