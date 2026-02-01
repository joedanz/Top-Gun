// ABOUTME: Spawns projectiles from an aircraft's nose on fire input with rate limiting.
// ABOUTME: Manages projectile lifecycle — updates alive ones, removes dead ones.

import type { Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import { Projectile } from "./Projectile";

const FIRE_COOLDOWN = 0.15; // seconds between shots
const DEFAULT_AMMO = 200;

export class WeaponSystem {
  projectiles: Projectile[] = [];
  ammo: number;
  private cooldown = 0;

  constructor(private scene: Scene, ammo = DEFAULT_AMMO) {
    this.ammo = ammo;
  }

  update(aircraft: Aircraft, dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (aircraft.input.fire && this.cooldown <= 0 && this.ammo > 0) {
      const pos = aircraft.mesh.position;
      const rot = aircraft.mesh.rotation;
      this.projectiles.push(
        new Projectile(
          this.scene,
          { x: pos.x, y: pos.y, z: pos.z },
          { x: rot.x, y: rot.y, z: rot.z },
        ),
      );
      this.cooldown = FIRE_COOLDOWN;
      this.ammo--;
    }

    for (const p of this.projectiles) {
      p.update(dt);
    }

    this.projectiles = this.projectiles.filter((p) => p.alive);
  }
}
