// ABOUTME: Tests for VfxSystem — verifies smoke trails, muzzle flash, and missile exhaust effects.
// ABOUTME: Uses mocked Babylon.js ParticleSystem to verify particle creation and configuration.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { MockParticleSystem, mockParticleInstances } = vi.hoisted(() => {
  const instances: Array<{
    emitter: unknown;
    minSize: number;
    maxSize: number;
    minLifeTime: number;
    maxLifeTime: number;
    emitRate: number;
    color1: unknown;
    color2: unknown;
    colorDead: unknown;
    minEmitPower: number;
    maxEmitPower: number;
    direction1: unknown;
    direction2: unknown;
    targetStopDuration: number;
    disposeOnStop: boolean;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    createSphereEmitter: ReturnType<typeof vi.fn>;
  }> = [];

  class MockPS {
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
    stop = vi.fn();
    dispose = vi.fn();
    createSphereEmitter = vi.fn();
    constructor() {
      instances.push(this);
    }
  }

  return { MockParticleSystem: MockPS, mockParticleInstances: instances };
});

vi.mock("@babylonjs/core", () => {
  class MockVector3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  }
  class MockColor4 {
    constructor(
      public r: number,
      public g: number,
      public b: number,
      public a: number,
    ) {}
  }

  return {
    ParticleSystem: MockParticleSystem,
    Vector3: MockVector3,
    Color4: MockColor4,
  };
});

import { VfxSystem } from "./VfxSystem";

import type { Scene } from "@babylonjs/core";

function createMockScene(): Scene {
  return {} as Scene;
}

function createMockAircraft(health = 100) {
  return {
    mesh: { position: { x: 10, y: 20, z: 30 } },
    health,
    alive: true,
  };
}

function createMockMissile() {
  return {
    mesh: { position: { x: 5, y: 10, z: 15 } },
    alive: true,
  };
}

describe("VfxSystem", () => {
  let scene: ReturnType<typeof createMockScene>;
  let vfx: VfxSystem;

  beforeEach(() => {
    vi.resetAllMocks();
    mockParticleInstances.length = 0;
    scene = createMockScene();
    vfx = new VfxSystem(scene);
  });

  // --- Smoke Trails ---
  describe("smoke trails", () => {
    it("creates smoke trail when aircraft health drops below threshold", () => {
      const aircraft = createMockAircraft(60);
      vfx.updateSmokeTrail(aircraft);
      expect(mockParticleInstances.length).toBe(1);
      expect(mockParticleInstances[0].start).toHaveBeenCalled();
    });

    it("does not create smoke trail for healthy aircraft", () => {
      const aircraft = createMockAircraft(100);
      vfx.updateSmokeTrail(aircraft);
      expect(mockParticleInstances.length).toBe(0);
    });

    it("uses aircraft mesh as emitter", () => {
      const aircraft = createMockAircraft(50);
      vfx.updateSmokeTrail(aircraft);
      expect(mockParticleInstances[0].emitter).toBe(aircraft.mesh);
    });

    it("increases emit rate as damage increases", () => {
      const lightDamage = createMockAircraft(60);
      vfx.updateSmokeTrail(lightDamage);
      const lightRate = mockParticleInstances[0].emitRate;

      mockParticleInstances.length = 0;
      const vfx2 = new VfxSystem(scene);
      const heavyDamage = createMockAircraft(20);
      vfx2.updateSmokeTrail(heavyDamage);
      const heavyRate = mockParticleInstances[0].emitRate;

      expect(heavyRate).toBeGreaterThan(lightRate);
    });

    it("does not create duplicate smoke trail on repeated calls", () => {
      const aircraft = createMockAircraft(50);
      vfx.updateSmokeTrail(aircraft);
      vfx.updateSmokeTrail(aircraft);
      expect(mockParticleInstances.length).toBe(1);
    });

    it("stops smoke trail when aircraft is destroyed", () => {
      const aircraft = createMockAircraft(50);
      vfx.updateSmokeTrail(aircraft);
      aircraft.alive = false;
      vfx.updateSmokeTrail(aircraft);
      expect(mockParticleInstances[0].stop).toHaveBeenCalled();
    });

    it("updates emit rate when damage level changes", () => {
      const aircraft = createMockAircraft(60);
      vfx.updateSmokeTrail(aircraft);
      const initialRate = mockParticleInstances[0].emitRate;

      aircraft.health = 20;
      vfx.updateSmokeTrail(aircraft);
      expect(mockParticleInstances[0].emitRate).toBeGreaterThan(initialRate);
    });
  });

  // --- Muzzle Flash ---
  describe("muzzle flash", () => {
    it("creates a burst particle effect at aircraft position", () => {
      const pos = { x: 10, y: 20, z: 30 };
      const rot = { y: 0 };
      vfx.spawnMuzzleFlash(pos, rot);
      expect(mockParticleInstances.length).toBe(1);
      expect(mockParticleInstances[0].start).toHaveBeenCalled();
    });

    it("sets disposeOnStop for auto-cleanup", () => {
      vfx.spawnMuzzleFlash({ x: 0, y: 0, z: 0 }, { y: 0 });
      expect(mockParticleInstances[0].disposeOnStop).toBe(true);
    });

    it("has a short target stop duration", () => {
      vfx.spawnMuzzleFlash({ x: 0, y: 0, z: 0 }, { y: 0 });
      expect(mockParticleInstances[0].targetStopDuration).toBeLessThanOrEqual(0.15);
    });

    it("uses yellow/orange colors for muzzle flash", () => {
      vfx.spawnMuzzleFlash({ x: 0, y: 0, z: 0 }, { y: 0 });
      const ps = mockParticleInstances[0];
      // Primary color should be bright (yellow/orange)
      expect(ps.color1).not.toBeNull();
      expect(ps.color2).not.toBeNull();
    });
  });

  // --- Missile Exhaust ---
  describe("missile exhaust", () => {
    it("creates exhaust trail attached to missile mesh", () => {
      const missile = createMockMissile();
      vfx.addMissileExhaust(missile);
      expect(mockParticleInstances.length).toBe(1);
      expect(mockParticleInstances[0].emitter).toBe(missile.mesh);
      expect(mockParticleInstances[0].start).toHaveBeenCalled();
    });

    it("stops and disposes exhaust when missile dies", () => {
      const missile = createMockMissile();
      vfx.addMissileExhaust(missile);
      missile.alive = false;
      vfx.updateMissileExhausts();
      expect(mockParticleInstances[0].stop).toHaveBeenCalled();
      expect(mockParticleInstances[0].dispose).toHaveBeenCalled();
    });

    it("does not duplicate exhaust for same missile", () => {
      const missile = createMockMissile();
      vfx.addMissileExhaust(missile);
      vfx.addMissileExhaust(missile);
      expect(mockParticleInstances.length).toBe(1);
    });

    it("manages multiple missile exhausts independently", () => {
      const m1 = createMockMissile();
      const m2 = createMockMissile();
      vfx.addMissileExhaust(m1);
      vfx.addMissileExhaust(m2);
      expect(mockParticleInstances.length).toBe(2);

      m1.alive = false;
      vfx.updateMissileExhausts();
      expect(mockParticleInstances[0].stop).toHaveBeenCalled();
      expect(mockParticleInstances[1].stop).not.toHaveBeenCalled();
    });
  });
});
