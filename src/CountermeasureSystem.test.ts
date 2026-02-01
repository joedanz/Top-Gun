// ABOUTME: Tests for the CountermeasureSystem that deploys flares and chaff.
// ABOUTME: Verifies deployment, missile decoying, ammo tracking, and cooldowns.

import { describe, it, expect, vi, beforeEach } from "vitest";

class MockMesh {
  position = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0 };
  dispose = vi.fn();
}

vi.mock("@babylonjs/core", () => ({
  MeshBuilder: { CreateSphere: vi.fn(() => new MockMesh()) },
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

import { CountermeasureSystem } from "./CountermeasureSystem";
import type { Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import type { Missile } from "./Missile";

function makeAircraft(pos = { x: 0, y: 50, z: 0 }): Aircraft {
  return {
    mesh: {
      position: { ...pos },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
    },
    input: {
      pitch: 0,
      roll: 0,
      yaw: 0,
      throttle: 0,
      fire: false,
      cycleTarget: false,
      lockOn: false,
      cycleWeapon: false,
      deployCountermeasure: false,
    },
    alive: true,
    health: 100,
    speed: 100,
  } as unknown as Aircraft;
}

function makeMissile(
  mode: "heat" | "radar",
  targetPos = { x: 0, y: 50, z: 0 },
): Missile & { divertToFlare: (pos: { x: number; y: number; z: number }) => void } {
  let target = { mesh: { position: targetPos }, alive: true };
  return {
    alive: true,
    mode,
    mesh: { position: { x: 50, y: 50, z: 50 } },
    get target() {
      return target;
    },
    divertToFlare(pos: { x: number; y: number; z: number }) {
      target = { mesh: { position: pos }, alive: true };
    },
    update: vi.fn(),
  } as unknown as Missile & { divertToFlare: (pos: { x: number; y: number; z: number }) => void };
}

describe("CountermeasureSystem", () => {
  const mockScene = {} as Scene;
  let system: CountermeasureSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    system = new CountermeasureSystem(mockScene);
  });

  it("starts with default flare and chaff ammo", () => {
    expect(system.flareAmmo).toBe(30);
    expect(system.chaffAmmo).toBe(30);
  });

  it("accepts custom ammo counts", () => {
    const s = new CountermeasureSystem(mockScene, 10, 20);
    expect(s.flareAmmo).toBe(10);
    expect(s.chaffAmmo).toBe(20);
  });

  it("deploys a flare on key press (edge-triggered)", () => {
    const aircraft = makeAircraft();
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;

    system.update(aircraft, [], 0.016);
    expect(system.flareAmmo).toBe(29);
    expect(system.flares.length).toBe(1);
  });

  it("does not deploy when key held (edge-triggered)", () => {
    const aircraft = makeAircraft();
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;

    system.update(aircraft, [], 0.016);
    system.update(aircraft, [], 0.016); // still held
    expect(system.flareAmmo).toBe(29); // only one deployed
  });

  it("deploys chaff on second press (alternating)", () => {
    const aircraft = makeAircraft();

    // First press — flare
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [], 0.016);
    expect(system.flareAmmo).toBe(29);

    // Release and wait for cooldown
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = false;
    system.update(aircraft, [], 0.5);

    // Second press — chaff
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [], 0.016);
    expect(system.chaffAmmo).toBe(29);
  });

  it("does not deploy when ammo is zero", () => {
    const s = new CountermeasureSystem(mockScene, 0, 0);
    const aircraft = makeAircraft();
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;

    s.update(aircraft, [], 0.016);
    expect(s.flares.length).toBe(0);
  });

  it("has a cooldown between deployments", () => {
    const aircraft = makeAircraft();

    // First deploy
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [], 0.016);
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = false;
    system.update(aircraft, [], 0.01); // tiny time

    // Quick second press — should be blocked by cooldown
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [], 0.016);
    expect(system.flareAmmo).toBe(29); // still 29, no second deploy
  });

  it("flares have a chance to decoy heat-seeking missiles", () => {
    // Use deterministic random
    vi.spyOn(Math, "random").mockReturnValue(0.1); // below 0.7 threshold = success

    const aircraft = makeAircraft();
    const missile = makeMissile("heat", aircraft.mesh.position as { x: number; y: number; z: number });

    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [missile as unknown as Missile], 0.016);

    // The missile's divertToFlare should have been called
    expect(system.flareAmmo).toBe(29);

    vi.restoreAllMocks();
  });

  it("chaff has a chance to break radar missile lock", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // below threshold = success

    const aircraft = makeAircraft();

    // First deploy is flare
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [], 0.016);
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = false;
    system.update(aircraft, [], 0.5); // wait for cooldown

    // Second deploy is chaff
    const radarMissile = makeMissile("radar", aircraft.mesh.position as { x: number; y: number; z: number });
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [radarMissile as unknown as Missile], 0.016);

    expect(system.chaffAmmo).toBe(29);

    vi.restoreAllMocks();
  });

  it("cleans up expired flares", () => {
    const aircraft = makeAircraft();
    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = true;
    system.update(aircraft, [], 0.016);
    expect(system.flares.length).toBe(1);

    (aircraft.input as { deployCountermeasure: boolean }).deployCountermeasure = false;

    // Expire the flare
    system.update(aircraft, [], 4);
    expect(system.flares.length).toBe(0);
  });
});
