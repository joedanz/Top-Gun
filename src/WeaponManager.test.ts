// ABOUTME: Tests for WeaponManager — orchestrates weapon switching and firing for all weapon types.
// ABOUTME: Verifies weapon cycling, correct delegation, and ammo tracking per weapon type.

import { describe, it, expect, vi, beforeEach } from "vitest";

const createMockMesh = () => ({
  position: { x: 0, y: 50, z: 0 },
  rotation: { x: Math.PI / 2, y: 0, z: 0 },
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
      CreateCylinder: vi.fn(() => createMockMesh()),
    },
  };
});

vi.mock("@babylonjs/gui", () => {
  class MockTextBlock {
    text = "";
    color = "";
    fontSize = 0;
    height = "";
    textHorizontalAlignment = 0;
  }
  class MockEllipse {
    width = "";
    height = "";
    color = "";
    thickness = 0;
    isVisible = false;
    isPointerBlocker = false;
    isHitTestVisible = false;
    addControl = vi.fn();
  }
  return {
    AdvancedDynamicTexture: {
      CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn(), dispose: vi.fn() })),
    },
    TextBlock: MockTextBlock,
    Ellipse: MockEllipse,
  };
});

import { WeaponManager, WeaponType } from "./WeaponManager";
import { Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import type { FlightInput } from "./InputManager";

function makeInput(overrides: Partial<FlightInput> = {}): FlightInput {
  return {
    pitch: 0, roll: 0, yaw: 0, throttle: 0,
    fire: false, cycleTarget: false, lockOn: false,
    cycleWeapon: false,
    deployCountermeasure: false,
    ...overrides,
  };
}

function makeAircraft(input: FlightInput): Aircraft {
  return {
    mesh: { position: { x: 0, y: 50, z: 0 }, rotation: { x: Math.PI / 2, y: 0, z: 0 } },
    input,
    alive: true,
    speed: 150,
    health: 100,
  } as unknown as Aircraft;
}

describe("WeaponManager", () => {
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
  });

  it("starts with guns as active weapon", () => {
    const wm = new WeaponManager(scene);
    expect(wm.activeWeapon).toBe(WeaponType.Guns);
  });

  it("cycles through weapon types on cycleWeapon press", () => {
    const wm = new WeaponManager(scene);
    const input = makeInput({ cycleWeapon: true, deployCountermeasure: false });
    const aircraft = makeAircraft(input);

    wm.update(aircraft, null, 0.016);
    expect(wm.activeWeapon).toBe(WeaponType.HeatSeeking);
  });

  it("cycles back to guns after last weapon type", () => {
    const wm = new WeaponManager(scene);

    // Cycle through all types
    for (let i = 0; i < 5; i++) {
      const input = makeInput({ cycleWeapon: true, deployCountermeasure: false });
      const aircraft = makeAircraft(input);
      wm.update(aircraft, null, 0.016);
      // Release between presses
      const releaseInput = makeInput({ cycleWeapon: false, deployCountermeasure: false });
      const releaseAircraft = makeAircraft(releaseInput);
      wm.update(releaseAircraft, null, 0.016);
    }

    expect(wm.activeWeapon).toBe(WeaponType.Guns);
  });

  it("fires guns when active weapon is Guns and fire pressed", () => {
    const wm = new WeaponManager(scene);
    const input = makeInput({ fire: true });
    const aircraft = makeAircraft(input);

    wm.update(aircraft, null, 0.016);

    expect(wm.gunSystem.projectiles.length).toBeGreaterThan(0);
  });

  it("fires rockets when active weapon is Rockets and fire pressed", () => {
    const wm = new WeaponManager(scene, { rockets: 10 });
    // Switch to rockets (cycle: guns -> heat -> radar -> rockets)
    for (let i = 0; i < 3; i++) {
      const input = makeInput({ cycleWeapon: true, deployCountermeasure: false });
      wm.update(makeAircraft(input), null, 0.016);
      wm.update(makeAircraft(makeInput()), null, 0.016); // release
    }
    expect(wm.activeWeapon).toBe(WeaponType.Rockets);

    const input = makeInput({ fire: true });
    wm.update(makeAircraft(input), null, 0.016);
    expect(wm.rockets.length).toBeGreaterThan(0);
  });

  it("fires bombs when active weapon is Bombs and fire pressed", () => {
    const wm = new WeaponManager(scene, { bombs: 4 });
    // Switch to bombs (cycle: guns -> heat -> radar -> rockets -> bombs)
    for (let i = 0; i < 4; i++) {
      const input = makeInput({ cycleWeapon: true, deployCountermeasure: false });
      wm.update(makeAircraft(input), null, 0.016);
      wm.update(makeAircraft(makeInput()), null, 0.016); // release
    }
    expect(wm.activeWeapon).toBe(WeaponType.Bombs);

    const input = makeInput({ fire: true });
    const aircraft = makeAircraft(input);
    aircraft.speed = 150;
    wm.update(aircraft, null, 0.016);
    expect(wm.bombs.length).toBeGreaterThan(0);
  });

  it("tracks ammo for each weapon type", () => {
    const wm = new WeaponManager(scene, {
      gunAmmo: 200,
      heatSeeking: 4,
      radarGuided: 2,
      rockets: 8,
      bombs: 4,
    });
    expect(wm.getAmmo(WeaponType.Guns)).toBe(200);
    expect(wm.getAmmo(WeaponType.HeatSeeking)).toBe(4);
    expect(wm.getAmmo(WeaponType.RadarGuided)).toBe(2);
    expect(wm.getAmmo(WeaponType.Rockets)).toBe(8);
    expect(wm.getAmmo(WeaponType.Bombs)).toBe(4);
  });

  it("does not fire rockets if ammo is 0", () => {
    const wm = new WeaponManager(scene, { rockets: 0 });
    // Switch to rockets
    for (let i = 0; i < 3; i++) {
      wm.update(makeAircraft(makeInput({ cycleWeapon: true, deployCountermeasure: false })), null, 0.016);
      wm.update(makeAircraft(makeInput()), null, 0.016);
    }
    wm.update(makeAircraft(makeInput({ fire: true })), null, 0.016);
    expect(wm.rockets.length).toBe(0);
  });

  it("decrements ammo when firing rockets", () => {
    const wm = new WeaponManager(scene, { rockets: 5 });
    // Switch to rockets
    for (let i = 0; i < 3; i++) {
      wm.update(makeAircraft(makeInput({ cycleWeapon: true, deployCountermeasure: false })), null, 0.016);
      wm.update(makeAircraft(makeInput()), null, 0.016);
    }
    wm.update(makeAircraft(makeInput({ fire: true })), null, 0.016);
    expect(wm.getAmmo(WeaponType.Rockets)).toBe(4);
  });
});
