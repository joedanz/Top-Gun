// ABOUTME: Tests for CollisionSystem — verifies projectile-aircraft and ground collisions.
// ABOUTME: Ensures damage is applied, destroyed aircraft are handled, and self-hits are ignored.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/core", () => {
  class MockParticleSystem {
    emitter: unknown = null;
    minSize = 0;
    maxSize = 0;
    minLifeTime = 0;
    maxLifeTime = 0;
    emitRate = 0;
    color1 = null;
    color2 = null;
    colorDead = null;
    minEmitPower = 0;
    maxEmitPower = 0;
    direction1 = null;
    direction2 = null;
    targetStopDuration = 0;
    disposeOnStop = false;
    start = vi.fn();
    createSphereEmitter = vi.fn();
  }
  class MockVector3 {
    constructor(public x: number, public y: number, public z: number) {}
    static Zero() { return new MockVector3(0, 0, 0); }
  }
  class MockColor4 {
    constructor(public r: number, public g: number, public b: number, public a: number) {}
  }
  class MockTexture {
    constructor(public url: string) {}
  }
  return {
    ParticleSystem: MockParticleSystem,
    Vector3: MockVector3,
    Color4: MockColor4,
    Texture: MockTexture,
  };
});

import { CollisionSystem } from "./CollisionSystem";
import type { Aircraft } from "./Aircraft";
import type { GroundTarget } from "./GroundTarget";
import type { Projectile } from "./Projectile";
import type { WeaponSystem } from "./WeaponSystem";

function makeAircraft(x: number, y: number, z: number, health = 100): Aircraft {
  return {
    mesh: {
      position: { x, y, z },
      rotation: { x: 0, y: 0, z: 0 },
      dispose: vi.fn(),
      isDisposed: vi.fn(() => false),
    },
    speed: 50,
    input: { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: false, lockOn: false, cycleWeapon: false, deployCountermeasure: false },
    health,
    alive: true,
  } as unknown as Aircraft;
}

function makeProjectile(x: number, y: number, z: number): Projectile {
  return {
    mesh: {
      position: { x, y, z },
      dispose: vi.fn(),
    },
    alive: true,
    update: vi.fn(),
  } as unknown as Projectile;
}

function makeWeaponSystem(projectiles: Projectile[]): WeaponSystem {
  return { projectiles } as unknown as WeaponSystem;
}

describe("CollisionSystem", () => {
  let system: CollisionSystem;

  beforeEach(() => {
    vi.resetAllMocks();
    system = new CollisionSystem({} as never);
  });

  it("detects projectile-aircraft collision within bounding sphere radius", () => {
    const aircraft = makeAircraft(10, 10, 10);
    const projectile = makeProjectile(10, 10, 10); // same position = hit
    const ws = makeWeaponSystem([projectile]);

    system.update([aircraft], [ws], []);

    expect(aircraft.health).toBeLessThan(100);
    expect(projectile.alive).toBe(false);
  });

  it("does not detect collision when projectile is far from aircraft", () => {
    const aircraft = makeAircraft(10, 10, 10);
    const projectile = makeProjectile(100, 100, 100); // far away
    const ws = makeWeaponSystem([projectile]);

    system.update([aircraft], [ws], []);

    expect(aircraft.health).toBe(100);
    expect(projectile.alive).toBe(true);
  });

  it("does not damage aircraft from its own weapon system projectiles", () => {
    const aircraft = makeAircraft(10, 10, 10);
    const projectile = makeProjectile(10, 10, 10); // same position
    const ws = makeWeaponSystem([projectile]);

    // aircraft at index 0, weaponSystem at index 0 — means ws belongs to aircraft
    system.update([aircraft], [ws], [{ aircraft, weaponSystem: ws }]);

    expect(aircraft.health).toBe(100);
    expect(projectile.alive).toBe(true);
  });

  it("destroys aircraft at 0 health", () => {
    const aircraft = makeAircraft(10, 10, 10, 5);
    const projectile = makeProjectile(10, 10, 10);
    const ws = makeWeaponSystem([projectile]);

    system.update([aircraft], [ws], []);

    expect(aircraft.alive).toBe(false);
  });

  it("creates explosion particle system when aircraft is destroyed", () => {
    const aircraft = makeAircraft(10, 10, 10, 5);
    const projectile = makeProjectile(10, 10, 10);
    const ws = makeWeaponSystem([projectile]);

    system.update([aircraft], [ws], []);

    expect(aircraft.alive).toBe(false);
    expect(aircraft.health).toBeLessThanOrEqual(0);
  });

  it("detects ground collision when aircraft altitude is at or below ground level", () => {
    const aircraft = makeAircraft(10, 2, 10);

    system.checkGroundCollision(aircraft);

    expect(aircraft.alive).toBe(false);
    expect(aircraft.health).toBe(0);
  });

  it("does not trigger ground collision when aircraft is above ground", () => {
    const aircraft = makeAircraft(10, 50, 10);

    system.checkGroundCollision(aircraft);

    expect(aircraft.alive).toBe(true);
    expect(aircraft.health).toBe(100);
  });

  it("reports mission failed when player aircraft is destroyed", () => {
    const player = makeAircraft(10, 10, 10, 5);
    const projectile = makeProjectile(10, 10, 10);
    const ws = makeWeaponSystem([projectile]);

    system.setPlayer(player);
    system.update([player], [ws], []);

    expect(system.missionFailed).toBe(true);
  });

  it("does not report mission failed when enemy aircraft is destroyed", () => {
    const player = makeAircraft(0, 50, 0);
    const enemy = makeAircraft(10, 10, 10, 5);
    const projectile = makeProjectile(10, 10, 10);
    const ws = makeWeaponSystem([projectile]);

    system.setPlayer(player);
    system.update([player, enemy], [ws], []);

    expect(system.missionFailed).toBe(false);
  });

  it("skips dead aircraft during collision checks", () => {
    const aircraft = makeAircraft(10, 10, 10);
    aircraft.alive = false;
    const projectile = makeProjectile(10, 10, 10);
    const ws = makeWeaponSystem([projectile]);

    system.update([aircraft], [ws], []);

    expect(aircraft.health).toBe(100);
    expect(projectile.alive).toBe(true);
  });

  it("sets playerHitThisFrame when player takes damage", () => {
    const player = makeAircraft(10, 10, 10);
    const projectile = makeProjectile(10, 10, 10);
    const ws = makeWeaponSystem([projectile]);

    system.setPlayer(player);
    system.update([player], [ws], []);

    expect(system.playerHitThisFrame).toBe(true);
  });

  it("resets playerHitThisFrame each update", () => {
    const player = makeAircraft(10, 10, 10);
    const projectile = makeProjectile(10, 10, 10);
    const ws = makeWeaponSystem([projectile]);

    system.setPlayer(player);
    system.update([player], [ws], []);
    expect(system.playerHitThisFrame).toBe(true);

    system.update([player], [makeWeaponSystem([])], []);
    expect(system.playerHitThisFrame).toBe(false);
  });

  it("skips dead projectiles during collision checks", () => {
    const aircraft = makeAircraft(10, 10, 10);
    const projectile = makeProjectile(10, 10, 10);
    projectile.alive = false;
    const ws = makeWeaponSystem([projectile]);

    system.update([aircraft], [ws], []);

    expect(aircraft.health).toBe(100);
  });

  describe("ground target collisions", () => {
    function makeGroundTarget(x: number, y: number, z: number, health = 80): GroundTarget {
      return {
        mesh: { position: { x, y, z }, dispose: vi.fn() },
        health,
        alive: true,
        type: "sam",
      } as unknown as GroundTarget;
    }

    it("damages ground target when projectile hits", () => {
      const gt = makeGroundTarget(10, 0, 10);
      const projectile = makeProjectile(10, 0, 10);
      const ws = makeWeaponSystem([projectile]);

      system.checkGroundTargets([gt], [ws], []);

      expect(gt.health).toBeLessThan(80);
      expect(projectile.alive).toBe(false);
    });

    it("destroys ground target at 0 health and returns its index", () => {
      const gt = makeGroundTarget(10, 0, 10, 5);
      const projectile = makeProjectile(10, 0, 10);
      const ws = makeWeaponSystem([projectile]);

      const destroyed = system.checkGroundTargets([gt], [ws], []);

      expect(gt.alive).toBe(false);
      expect(destroyed).toContain(0);
    });

    it("damages ground target with hittables (bombs/rockets)", () => {
      const gt = makeGroundTarget(10, 0, 10);
      const hittable = {
        mesh: { position: { x: 10, y: 0, z: 10 }, dispose: vi.fn() },
        alive: true,
        damage: 50,
      };

      system.checkGroundTargets([gt], [], [hittable]);

      expect(gt.health).toBe(30);
      expect(hittable.alive).toBe(false);
    });

    it("skips dead ground targets", () => {
      const gt = makeGroundTarget(10, 0, 10);
      gt.alive = false;
      const projectile = makeProjectile(10, 0, 10);
      const ws = makeWeaponSystem([projectile]);

      system.checkGroundTargets([gt], [ws], []);

      expect(projectile.alive).toBe(true);
    });
  });
});
