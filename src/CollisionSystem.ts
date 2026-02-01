// ABOUTME: Detects collisions between projectiles and aircraft/ground targets using bounding spheres.
// ABOUTME: Applies damage, triggers explosions, and tracks mission-failed state.

import { ParticleSystem, Vector3, Color4, Texture, type Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import type { GroundTarget } from "./GroundTarget";
import type { WeaponSystem } from "./WeaponSystem";

const HIT_RADIUS = 3;
const GROUND_LEVEL = 2;

export interface Hittable {
  mesh: { position: { x: number; y: number; z: number }; dispose: () => void };
  alive: boolean;
  damage: number;
}

interface OwnerPair {
  aircraft: Aircraft;
  weaponSystem: WeaponSystem;
}

export class CollisionSystem {
  missionFailed = false;
  playerHitThisFrame = false;
  playerHitsDealt = 0;
  private player: Aircraft | null = null;

  constructor(private scene: Scene) {}

  setPlayer(player: Aircraft): void {
    this.player = player;
  }

  update(
    aircraft: Aircraft[],
    weaponSystems: WeaponSystem[],
    owners: OwnerPair[],
  ): void {
    this.playerHitThisFrame = false;
    for (const ws of weaponSystems) {
      // Find which aircraft owns this weapon system
      const owner = owners.find((o) => o.weaponSystem === ws);

      for (const projectile of ws.projectiles) {
        if (!projectile.alive) continue;

        for (const target of aircraft) {
          if (!target.alive) continue;

          // Skip self-hits
          if (owner && owner.aircraft === target) continue;

          const dx = projectile.mesh.position.x - target.mesh.position.x;
          const dy = projectile.mesh.position.y - target.mesh.position.y;
          const dz = projectile.mesh.position.z - target.mesh.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < HIT_RADIUS) {
            target.health -= projectile.damage ?? 10;
            projectile.alive = false;
            projectile.mesh.dispose();

            if (target === this.player) {
              this.playerHitThisFrame = true;
            } else if (owner && owner.aircraft === this.player) {
              this.playerHitsDealt++;
            }

            if (target.health <= 0) {
              this.destroyAircraft(target);
            }
          }
        }
      }
    }
  }

  /** Check additional hittable entities (rockets, bombs, missiles) against aircraft targets */
  checkHittables(
    hittables: Hittable[],
    targets: Aircraft[],
    ownerAircraft?: Aircraft,
  ): void {
    for (const h of hittables) {
      if (!h.alive) continue;
      for (const target of targets) {
        if (!target.alive) continue;
        if (ownerAircraft && ownerAircraft === target) continue;

        const dx = h.mesh.position.x - target.mesh.position.x;
        const dy = h.mesh.position.y - target.mesh.position.y;
        const dz = h.mesh.position.z - target.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < HIT_RADIUS) {
          target.health -= h.damage;
          h.alive = false;
          h.mesh.dispose();

          if (target === this.player) {
            this.playerHitThisFrame = true;
          }

          if (target.health <= 0) {
            this.destroyAircraft(target);
          }
          break;
        }
      }
    }
  }

  /** Check projectiles and hittables against ground targets, returns indices of newly destroyed targets */
  checkGroundTargets(
    groundTargets: GroundTarget[],
    weaponSystems: WeaponSystem[],
    hittables: Hittable[],
  ): number[] {
    const destroyed: number[] = [];

    // Check gun projectiles against ground targets
    for (const ws of weaponSystems) {
      for (const projectile of ws.projectiles) {
        if (!projectile.alive) continue;
        for (let i = 0; i < groundTargets.length; i++) {
          const gt = groundTargets[i];
          if (!gt.alive) continue;
          const dx = projectile.mesh.position.x - gt.mesh.position.x;
          const dy = projectile.mesh.position.y - gt.mesh.position.y;
          const dz = projectile.mesh.position.z - gt.mesh.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < HIT_RADIUS) {
            gt.health -= projectile.damage ?? 10;
            projectile.alive = false;
            projectile.mesh.dispose();
            if (gt.health <= 0) {
              gt.alive = false;
              this.spawnExplosionAt(gt.mesh.position);
              destroyed.push(i);
            }
            break;
          }
        }
      }
    }

    // Check hittables (rockets, bombs, missiles) against ground targets
    for (const h of hittables) {
      if (!h.alive) continue;
      for (let i = 0; i < groundTargets.length; i++) {
        const gt = groundTargets[i];
        if (!gt.alive) continue;
        const dx = h.mesh.position.x - gt.mesh.position.x;
        const dy = h.mesh.position.y - gt.mesh.position.y;
        const dz = h.mesh.position.z - gt.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < HIT_RADIUS) {
          gt.health -= h.damage;
          h.alive = false;
          h.mesh.dispose();
          if (gt.health <= 0) {
            gt.alive = false;
            this.spawnExplosionAt(gt.mesh.position);
            destroyed.push(i);
          }
          break;
        }
      }
    }

    return destroyed;
  }

  checkGroundCollision(aircraft: Aircraft): void {
    if (!aircraft.alive) return;
    if (aircraft.mesh.position.y <= GROUND_LEVEL) {
      aircraft.health = 0;
      this.destroyAircraft(aircraft);
    }
  }

  private destroyAircraft(aircraft: Aircraft): void {
    aircraft.alive = false;
    aircraft.health = Math.min(aircraft.health, 0);
    this.spawnExplosionAt(aircraft.mesh.position);

    if (aircraft === this.player) {
      this.missionFailed = true;
    }
  }

  private spawnExplosionAt(position: { x: number; y: number; z: number }): void {
    const ps = new ParticleSystem("explosion", 200, this.scene);
    ps.emitter = new Vector3(position.x, position.y, position.z);
    ps.minSize = 0.5;
    ps.maxSize = 2;
    ps.minLifeTime = 0.3;
    ps.maxLifeTime = 0.8;
    ps.emitRate = 500;
    ps.color1 = new Color4(1, 0.5, 0, 1);
    ps.color2 = new Color4(1, 0, 0, 1);
    ps.colorDead = new Color4(0.2, 0.2, 0.2, 0);
    ps.minEmitPower = 5;
    ps.maxEmitPower = 15;
    ps.direction1 = new Vector3(-1, -1, -1);
    ps.direction2 = new Vector3(1, 1, 1);
    ps.targetStopDuration = 0.3;
    ps.disposeOnStop = true;
    ps.start();
  }
}
