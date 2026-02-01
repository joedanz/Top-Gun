// ABOUTME: Manages visual effects — smoke trails on damaged aircraft, muzzle flash, missile exhaust.
// ABOUTME: Uses Babylon.js ParticleSystem with auto-cleanup for transient effects.

import { ParticleSystem, Vector3, Color4, type Scene } from "@babylonjs/core";

const SMOKE_HEALTH_THRESHOLD = 70;

interface SmokeTarget {
  mesh: { position: { x: number; y: number; z: number } };
  health: number;
  alive: boolean;
}

interface ExhaustTarget {
  mesh: { position: { x: number; y: number; z: number } };
  alive: boolean;
}

export class VfxSystem {
  private smokeTrails = new Map<SmokeTarget, ParticleSystem>();
  private missileExhausts = new Map<ExhaustTarget, ParticleSystem>();

  constructor(private scene: Scene) {}

  /** Create or update smoke trail for a damaged aircraft */
  updateSmokeTrail(aircraft: SmokeTarget): void {
    const existing = this.smokeTrails.get(aircraft);

    if (!aircraft.alive) {
      if (existing) {
        existing.stop();
        this.smokeTrails.delete(aircraft);
      }
      return;
    }

    if (aircraft.health >= SMOKE_HEALTH_THRESHOLD) return;

    // Damage ratio: 0 at threshold, 1 at 0 health
    const damageRatio = 1 - aircraft.health / SMOKE_HEALTH_THRESHOLD;
    const emitRate = 10 + damageRatio * 40;

    if (existing) {
      existing.emitRate = emitRate;
      return;
    }

    const ps = new ParticleSystem("smoke", 100, this.scene);
    ps.emitter = aircraft.mesh as unknown as Vector3;
    ps.minSize = 0.3;
    ps.maxSize = 1.5;
    ps.minLifeTime = 0.5;
    ps.maxLifeTime = 1.5;
    ps.emitRate = emitRate;
    ps.color1 = new Color4(0.3, 0.3, 0.3, 0.8);
    ps.color2 = new Color4(0.1, 0.1, 0.1, 0.6);
    ps.colorDead = new Color4(0, 0, 0, 0);
    ps.minEmitPower = 1;
    ps.maxEmitPower = 3;
    ps.direction1 = new Vector3(-0.5, -1, -0.5);
    ps.direction2 = new Vector3(0.5, 0, 0.5);
    ps.start();

    this.smokeTrails.set(aircraft, ps);
  }

  /** Spawn a short muzzle flash burst at a position */
  spawnMuzzleFlash(
    position: { x: number; y: number; z: number },
    rotation: { y: number },
  ): void {
    // Offset slightly forward from aircraft nose
    const offsetDist = 2;
    const emitX = position.x + Math.sin(rotation.y) * offsetDist;
    const emitZ = position.z + Math.cos(rotation.y) * offsetDist;

    const ps = new ParticleSystem("muzzleFlash", 30, this.scene);
    ps.emitter = new Vector3(emitX, position.y, emitZ);
    ps.minSize = 0.2;
    ps.maxSize = 0.6;
    ps.minLifeTime = 0.05;
    ps.maxLifeTime = 0.1;
    ps.emitRate = 300;
    ps.color1 = new Color4(1, 1, 0.5, 1);
    ps.color2 = new Color4(1, 0.6, 0, 1);
    ps.colorDead = new Color4(1, 0.3, 0, 0);
    ps.minEmitPower = 2;
    ps.maxEmitPower = 5;
    ps.direction1 = new Vector3(-0.3, -0.3, -0.3);
    ps.direction2 = new Vector3(0.3, 0.3, 0.3);
    ps.targetStopDuration = 0.08;
    ps.disposeOnStop = true;
    ps.start();
  }

  /** Attach exhaust trail to a missile */
  addMissileExhaust(missile: ExhaustTarget): void {
    if (this.missileExhausts.has(missile)) return;

    const ps = new ParticleSystem("exhaust", 60, this.scene);
    ps.emitter = missile.mesh as unknown as Vector3;
    ps.minSize = 0.1;
    ps.maxSize = 0.5;
    ps.minLifeTime = 0.3;
    ps.maxLifeTime = 0.8;
    ps.emitRate = 40;
    ps.color1 = new Color4(1, 0.8, 0.3, 1);
    ps.color2 = new Color4(1, 0.4, 0, 0.8);
    ps.colorDead = new Color4(0.3, 0.3, 0.3, 0);
    ps.minEmitPower = 1;
    ps.maxEmitPower = 2;
    ps.direction1 = new Vector3(-0.2, -0.2, -0.2);
    ps.direction2 = new Vector3(0.2, 0.2, 0.2);
    ps.start();

    this.missileExhausts.set(missile, ps);
  }

  /** Clean up exhausts for dead missiles */
  updateMissileExhausts(): void {
    for (const [missile, ps] of this.missileExhausts) {
      if (!missile.alive) {
        ps.stop();
        ps.dispose();
        this.missileExhausts.delete(missile);
      }
    }
  }
}
