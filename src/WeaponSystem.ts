// ABOUTME: Spawns projectiles from an aircraft's nose on fire input with rate limiting.
// ABOUTME: Manages projectile lifecycle — updates alive ones, removes dead ones.

import type { Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import { Projectile } from "./Projectile";
import type { ProjectilePool } from "./ProjectilePool";

const FIRE_COOLDOWN = 0.15; // seconds between shots
const DEFAULT_AMMO = 200;

export class WeaponSystem {
  projectiles: Projectile[] = [];
  ammo: number;
  shotsFired = 0;
  private cooldown = 0;
  private pool: ProjectilePool | null;

  constructor(private scene: Scene, ammo = DEFAULT_AMMO, pool?: ProjectilePool) {
    this.ammo = ammo;
    this.pool = pool ?? null;
  }

  update(aircraft: Aircraft, dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (aircraft.input.fire && this.cooldown <= 0 && this.ammo > 0) {
      const pos = aircraft.mesh.position;
      const rot = aircraft.mesh.rotation;
      const mesh = this.pool?.acquire();
      this.projectiles.push(
        new Projectile(
          this.scene,
          { x: pos.x, y: pos.y, z: pos.z },
          { x: rot.x, y: rot.y, z: rot.z },
          mesh,
        ),
      );
      this.cooldown = FIRE_COOLDOWN;
      this.ammo--;
      this.shotsFired++;
    }

    for (const p of this.projectiles) {
      p.update(dt);
    }

    // Return dead projectile meshes to pool
    for (const p of this.projectiles) {
      if (!p.alive && this.pool) {
        this.pool.release(p.mesh);
      }
    }

    this.projectiles = this.projectiles.filter((p) => p.alive);
  }
}
