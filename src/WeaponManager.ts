// ABOUTME: Orchestrates all weapon types — guns, heat-seeking/radar missiles, rockets, bombs.
// ABOUTME: Handles weapon switching via cycleWeapon input and delegates firing to the active system.

import type { Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import { WeaponSystem } from "./WeaponSystem";
import { MissileLockSystem } from "./MissileLockSystem";
import { Rocket } from "./Rocket";
import { Bomb } from "./Bomb";
import { Missile } from "./Missile";

export enum WeaponType {
  Guns = "guns",
  HeatSeeking = "heat",
  RadarGuided = "radar",
  Rockets = "rockets",
  Bombs = "bombs",
}

const WEAPON_ORDER: WeaponType[] = [
  WeaponType.Guns,
  WeaponType.HeatSeeking,
  WeaponType.RadarGuided,
  WeaponType.Rockets,
  WeaponType.Bombs,
];

const ROCKET_COOLDOWN = 0.2;
const BOMB_COOLDOWN = 0.5;

export interface WeaponAmmoConfig {
  gunAmmo?: number;
  heatSeeking?: number;
  radarGuided?: number;
  rockets?: number;
  bombs?: number;
}

export class WeaponManager {
  activeWeapon = WeaponType.Guns;
  gunSystem: WeaponSystem;
  missileLockSystem: MissileLockSystem;
  rockets: Rocket[] = [];
  bombs: Bomb[] = [];
  radarMissiles: Missile[] = [];

  private scene: Scene;
  private rocketAmmo: number;
  private bombAmmo: number;
  private radarAmmo: number;
  private rocketCooldown = 0;
  private bombCooldown = 0;
  private radarPrevFire = false;
  private prevCycleWeapon = false;

  constructor(scene: Scene, ammo: WeaponAmmoConfig = {}) {
    this.scene = scene;
    this.gunSystem = new WeaponSystem(scene, ammo.gunAmmo ?? 200);
    this.missileLockSystem = new MissileLockSystem(scene, ammo.heatSeeking ?? 4);
    this.rocketAmmo = ammo.rockets ?? 0;
    this.bombAmmo = ammo.bombs ?? 0;
    this.radarAmmo = ammo.radarGuided ?? 0;
  }

  update(aircraft: Aircraft, target: Aircraft | null, dt: number): void {
    // Handle weapon cycling (edge-triggered)
    const cyclePressed = aircraft.input.cycleWeapon && !this.prevCycleWeapon;
    this.prevCycleWeapon = aircraft.input.cycleWeapon;
    if (cyclePressed) {
      const idx = WEAPON_ORDER.indexOf(this.activeWeapon);
      this.activeWeapon = WEAPON_ORDER[(idx + 1) % WEAPON_ORDER.length];
    }

    // Always update existing projectiles/missiles
    this.gunSystem.update(
      this.activeWeapon === WeaponType.Guns ? aircraft : this.noFireAircraft(aircraft),
      dt,
    );
    this.missileLockSystem.update(
      this.activeWeapon === WeaponType.HeatSeeking ? aircraft : this.noFireAircraft(aircraft),
      target,
      dt,
    );
    this.updateRockets(aircraft, dt);
    this.updateBombs(aircraft, dt);
    this.updateRadarMissiles(aircraft, target, dt);
  }

  getAmmo(type: WeaponType): number {
    switch (type) {
      case WeaponType.Guns: return this.gunSystem.ammo;
      case WeaponType.HeatSeeking: return this.missileLockSystem.ammo;
      case WeaponType.RadarGuided: return this.radarAmmo;
      case WeaponType.Rockets: return this.rocketAmmo;
      case WeaponType.Bombs: return this.bombAmmo;
    }
  }

  private updateRockets(aircraft: Aircraft, dt: number): void {
    this.rocketCooldown = Math.max(0, this.rocketCooldown - dt);

    if (
      this.activeWeapon === WeaponType.Rockets &&
      aircraft.input.fire &&
      this.rocketCooldown <= 0 &&
      this.rocketAmmo > 0
    ) {
      const pos = aircraft.mesh.position;
      const rot = aircraft.mesh.rotation;
      this.rockets.push(
        new Rocket(this.scene, { x: pos.x, y: pos.y, z: pos.z }, { x: rot.x, y: rot.y, z: rot.z }),
      );
      this.rocketCooldown = ROCKET_COOLDOWN;
      this.rocketAmmo--;
    }

    for (const r of this.rockets) {
      r.update(dt);
    }
    this.rockets = this.rockets.filter((r) => r.alive);
  }

  private updateBombs(aircraft: Aircraft, dt: number): void {
    this.bombCooldown = Math.max(0, this.bombCooldown - dt);

    if (
      this.activeWeapon === WeaponType.Bombs &&
      aircraft.input.fire &&
      this.bombCooldown <= 0 &&
      this.bombAmmo > 0
    ) {
      const pos = aircraft.mesh.position;
      const rot = aircraft.mesh.rotation;
      this.bombs.push(
        new Bomb(
          this.scene,
          { x: pos.x, y: pos.y, z: pos.z },
          { x: rot.x, y: rot.y, z: rot.z },
          aircraft.speed,
        ),
      );
      this.bombCooldown = BOMB_COOLDOWN;
      this.bombAmmo--;
    }

    for (const b of this.bombs) {
      b.update(dt);
    }
    this.bombs = this.bombs.filter((b) => b.alive);
  }

  private updateRadarMissiles(aircraft: Aircraft, target: Aircraft | null, dt: number): void {
    const firePressed = aircraft.input.fire && !this.radarPrevFire;
    this.radarPrevFire = aircraft.input.fire;

    if (
      this.activeWeapon === WeaponType.RadarGuided &&
      firePressed &&
      this.radarAmmo > 0 &&
      target &&
      target.alive
    ) {
      const pos = aircraft.mesh.position;
      const rot = aircraft.mesh.rotation;
      this.radarMissiles.push(
        new Missile(
          this.scene,
          { x: pos.x, y: pos.y, z: pos.z },
          { x: rot.x, y: rot.y, z: rot.z },
          target,
          "radar",
        ),
      );
      this.radarAmmo--;
    }

    for (const m of this.radarMissiles) {
      m.update(dt);
    }
    this.radarMissiles = this.radarMissiles.filter((m) => m.alive);
  }

  /** Creates a proxy that suppresses fire input — used to prevent the wrong system from firing */
  private noFireAircraft(aircraft: Aircraft): Aircraft {
    return {
      ...aircraft,
      input: { ...aircraft.input, fire: false, lockOn: false },
    } as Aircraft;
  }
}
