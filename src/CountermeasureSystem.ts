// ABOUTME: Deploys flares and chaff to counter incoming missiles.
// ABOUTME: Flares decoy heat-seeking missiles; chaff breaks radar missile locks.

import type { Scene } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";
import { Flare } from "./Flare";
import type { Missile } from "./Missile";

const DEFAULT_FLARE_AMMO = 30;
const DEFAULT_CHAFF_AMMO = 30;
const DEPLOY_COOLDOWN = 0.3; // seconds between deployments
const FLARE_DECOY_CHANCE = 0.7; // 70% chance to decoy a heat-seeker
const CHAFF_DECOY_CHANCE = 0.6; // 60% chance to break radar lock
const DECOY_RANGE = 200; // max distance from flare to missile for decoying

export class CountermeasureSystem {
  flareAmmo: number;
  chaffAmmo: number;
  flares: Flare[] = [];

  private scene: Scene;
  private prevDeploy = false;
  private cooldown = 0;
  private deployFlareNext = true; // alternates between flare and chaff

  constructor(scene: Scene, flareAmmo = DEFAULT_FLARE_AMMO, chaffAmmo = DEFAULT_CHAFF_AMMO) {
    this.scene = scene;
    this.flareAmmo = flareAmmo;
    this.chaffAmmo = chaffAmmo;
  }

  update(aircraft: Aircraft, incomingMissiles: Missile[], dt: number): void {
    // Update existing flares
    for (const f of this.flares) {
      f.update(dt);
    }
    this.flares = this.flares.filter((f) => f.alive);

    // Cooldown
    this.cooldown = Math.max(0, this.cooldown - dt);

    // Edge-triggered deploy
    const deployPressed = aircraft.input.deployCountermeasure && !this.prevDeploy;
    this.prevDeploy = aircraft.input.deployCountermeasure;

    if (deployPressed && this.cooldown <= 0) {
      if (this.deployFlareNext && this.flareAmmo > 0) {
        this.deployFlare(aircraft, incomingMissiles);
        this.deployFlareNext = false;
        this.cooldown = DEPLOY_COOLDOWN;
      } else if (!this.deployFlareNext && this.chaffAmmo > 0) {
        this.deployChaff(aircraft, incomingMissiles);
        this.deployFlareNext = true;
        this.cooldown = DEPLOY_COOLDOWN;
      } else if (this.deployFlareNext && this.flareAmmo === 0 && this.chaffAmmo > 0) {
        // Fall through to chaff if no flares left
        this.deployChaff(aircraft, incomingMissiles);
        this.cooldown = DEPLOY_COOLDOWN;
      } else if (!this.deployFlareNext && this.chaffAmmo === 0 && this.flareAmmo > 0) {
        // Fall through to flare if no chaff left
        this.deployFlare(aircraft, incomingMissiles);
        this.cooldown = DEPLOY_COOLDOWN;
      }
    }
  }

  private deployFlare(aircraft: Aircraft, incomingMissiles: Missile[]): void {
    const pos = aircraft.mesh.position;
    const flare = new Flare(
      this.scene,
      { x: pos.x, y: pos.y, z: pos.z },
      aircraft.mesh.rotation.y,
    );
    this.flares.push(flare);
    this.flareAmmo--;

    // Attempt to decoy heat-seeking missiles
    for (const missile of incomingMissiles) {
      if (!missile.alive || missile.mode !== "heat") continue;
      const dx = missile.mesh.position.x - pos.x;
      const dy = missile.mesh.position.y - pos.y;
      const dz = missile.mesh.position.z - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < DECOY_RANGE && Math.random() < FLARE_DECOY_CHANCE) {
        missile.divertToFlare({ x: flare.mesh.position.x, y: flare.mesh.position.y, z: flare.mesh.position.z });
      }
    }
  }

  private deployChaff(aircraft: Aircraft, incomingMissiles: Missile[]): void {
    // Chaff is a cloud — no visible mesh entity, but we create a flare for visual effect
    const pos = aircraft.mesh.position;
    const flare = new Flare(
      this.scene,
      { x: pos.x, y: pos.y, z: pos.z },
      aircraft.mesh.rotation.y,
    );
    this.flares.push(flare);
    this.chaffAmmo--;

    // Attempt to break radar missile lock
    for (const missile of incomingMissiles) {
      if (!missile.alive || missile.mode !== "radar") continue;
      const dx = missile.mesh.position.x - pos.x;
      const dy = missile.mesh.position.y - pos.y;
      const dz = missile.mesh.position.z - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < DECOY_RANGE && Math.random() < CHAFF_DECOY_CHANCE) {
        missile.divertToFlare({ x: flare.mesh.position.x, y: flare.mesh.position.y, z: flare.mesh.position.z });
      }
    }
  }
}
