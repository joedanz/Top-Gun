// ABOUTME: Tests for MissileLockSystem — verifies lock-on state machine and missile launching.
// ABOUTME: Uses mocked Babylon.js since jsdom has no WebGL.

import { describe, it, expect, vi, beforeEach } from "vitest";

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
        dispose: vi.fn(),
      })),
    },
  };
});

vi.mock("@babylonjs/gui", () => {
  class MockEllipse { width = ""; height = ""; color = ""; thickness = 0; isVisible = false; isPointerBlocker = false; isHitTestVisible = false; background = ""; addControl = vi.fn(); }
  class MockTextBlock { text = ""; color = ""; fontSize = 0; }
  return {
    AdvancedDynamicTexture: { CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn() })) },
    Ellipse: MockEllipse,
    TextBlock: MockTextBlock,
  };
});

import { MissileLockSystem, LockState } from "./MissileLockSystem";
import { Scene } from "@babylonjs/core";

describe("MissileLockSystem", () => {
  let scene: Scene;
  let player: { mesh: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }; input: { lockOn: boolean; fire: boolean; cycleTarget: boolean; cycleWeapon: boolean; deployCountermeasure: boolean } };
  let enemy: { mesh: { position: { x: number; y: number; z: number } }; alive: boolean };

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
    player = {
      mesh: {
        position: { x: 0, y: 10, z: 0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0 },
      },
      input: { lockOn: false, fire: false, cycleTarget: false, cycleWeapon: false, deployCountermeasure: false },
    };
    enemy = {
      mesh: { position: { x: 0, y: 10, z: 50 } },
      alive: true,
    };
  });

  it("starts in idle state", () => {
    const sys = new MissileLockSystem(scene);
    expect(sys.state).toBe(LockState.Idle);
  });

  it("begins locking when lockOn is held and target is in cone", () => {
    const sys = new MissileLockSystem(scene);
    player.input.lockOn = true;
    sys.update(player as never, enemy as never, 0.1);
    expect(sys.state).toBe(LockState.Locking);
  });

  it("does not lock when no target", () => {
    const sys = new MissileLockSystem(scene);
    player.input.lockOn = true;
    sys.update(player as never, null, 0.1);
    expect(sys.state).toBe(LockState.Idle);
  });

  it("achieves lock after holding long enough", () => {
    const sys = new MissileLockSystem(scene);
    player.input.lockOn = true;
    // Lock time is ~2 seconds
    for (let i = 0; i < 25; i++) {
      sys.update(player as never, enemy as never, 0.1);
    }
    expect(sys.state).toBe(LockState.Locked);
  });

  it("resets lock progress when lockOn is released", () => {
    const sys = new MissileLockSystem(scene);
    player.input.lockOn = true;
    sys.update(player as never, enemy as never, 1.0);
    expect(sys.state).toBe(LockState.Locking);
    player.input.lockOn = false;
    sys.update(player as never, enemy as never, 0.1);
    expect(sys.state).toBe(LockState.Idle);
    expect(sys.lockProgress).toBe(0);
  });

  it("fires a missile when locked and fire is pressed", () => {
    const sys = new MissileLockSystem(scene);
    player.input.lockOn = true;
    for (let i = 0; i < 25; i++) {
      sys.update(player as never, enemy as never, 0.1);
    }
    expect(sys.state).toBe(LockState.Locked);
    player.input.fire = true;
    sys.update(player as never, enemy as never, 0.016);
    expect(sys.missiles.length).toBe(1);
  });

  it("has limited missile ammo", () => {
    const sys = new MissileLockSystem(scene, 2);
    // Lock and fire twice
    for (let salvo = 0; salvo < 3; salvo++) {
      player.input.lockOn = true;
      player.input.fire = false;
      for (let i = 0; i < 25; i++) {
        sys.update(player as never, enemy as never, 0.1);
      }
      player.input.fire = true;
      sys.update(player as never, enemy as never, 0.016);
      player.input.lockOn = false;
      player.input.fire = false;
      sys.update(player as never, enemy as never, 0.016);
    }
    // Only 2 missiles should have been fired
    expect(sys.missiles.length).toBe(2);
    expect(sys.ammo).toBe(0);
  });

  it("updates existing missiles each frame", () => {
    const sys = new MissileLockSystem(scene);
    player.input.lockOn = true;
    for (let i = 0; i < 25; i++) {
      sys.update(player as never, enemy as never, 0.1);
    }
    player.input.fire = true;
    sys.update(player as never, enemy as never, 0.016);
    const missile = sys.missiles[0];
    const initialZ = missile.mesh.position.z;
    player.input.fire = false;
    player.input.lockOn = false;
    sys.update(player as never, enemy as never, 0.1);
    expect(missile.mesh.position.z).not.toBe(initialZ);
  });

  it("does not begin lock when target is outside lock cone", () => {
    const sys = new MissileLockSystem(scene);
    // Place enemy behind the player
    enemy.mesh.position = { x: 0, y: 10, z: -50 };
    player.input.lockOn = true;
    sys.update(player as never, enemy as never, 0.1);
    expect(sys.state).toBe(LockState.Idle);
  });

  it("removes expired missiles", () => {
    const sys = new MissileLockSystem(scene);
    player.input.lockOn = true;
    for (let i = 0; i < 25; i++) {
      sys.update(player as never, enemy as never, 0.1);
    }
    player.input.fire = true;
    sys.update(player as never, enemy as never, 0.016);
    expect(sys.missiles.length).toBe(1);
    // Expire the missile
    player.input.fire = false;
    player.input.lockOn = false;
    sys.update(player as never, enemy as never, 15);
    expect(sys.missiles.length).toBe(0);
  });
});
