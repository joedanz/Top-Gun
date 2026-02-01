// ABOUTME: Detects collisions between projectiles and aircraft using bounding spheres.
// ABOUTME: Applies damage, triggers explosions, and tracks mission-failed state.

import { ParticleSystem, Vector3, Color4, Texture, type Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import type { WeaponSystem } from "./WeaponSystem";

const HIT_RADIUS = 3;
const BULLET_DAMAGE = 10;
const GROUND_LEVEL = 2;

interface OwnerPair {
  aircraft: Aircraft;
  weaponSystem: WeaponSystem;
}

export class CollisionSystem {
  missionFailed = false;
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
            target.health -= BULLET_DAMAGE;
            projectile.alive = false;
            projectile.mesh.dispose();

            if (target.health <= 0) {
              this.destroyAircraft(target);
            }
          }
        }
      }
    }
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
    this.spawnExplosion(aircraft);

    if (aircraft === this.player) {
      this.missionFailed = true;
    }
  }

  private spawnExplosion(aircraft: Aircraft): void {
    const ps = new ParticleSystem("explosion", 200, this.scene);
    ps.emitter = new Vector3(
      aircraft.mesh.position.x,
      aircraft.mesh.position.y,
      aircraft.mesh.position.z,
    );
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
