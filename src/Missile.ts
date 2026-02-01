// ABOUTME: Homing missile entity that tracks a locked target with limited turning ability.
// ABOUTME: Supports heat-seeking (short range) and radar-guided (long range, fire-and-forget) modes.

import { MeshBuilder, type Scene, type Mesh } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";

export type MissileMode = "heat" | "radar";

const MISSILE_SPEED = 300;
const HEAT_LIFETIME = 8;
const RADAR_LIFETIME = 12;
const TURN_RATE = 2.0; // radians per second — limited tracking ability

export class Missile {
  mesh: Mesh;
  alive = true;
  readonly mode: MissileMode;
  readonly damage = 50;
  private lifetime: number;
  private age = 0;
  private yaw: number;
  private pitchAngle: number;
  private diverted = false;
  private divertPosition: { x: number; y: number; z: number } | null = null;

  constructor(
    scene: Scene,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    private target: Aircraft | null,
    mode: MissileMode = "heat",
  ) {
    this.mode = mode;
    this.lifetime = mode === "radar" ? RADAR_LIFETIME : HEAT_LIFETIME;

    this.mesh = MeshBuilder.CreateCylinder(
      "missile",
      { height: 2, diameterTop: 0.1, diameterBottom: 0.3, tessellation: 6 },
      scene,
    ) as Mesh;
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z;
    this.mesh.rotation.x = rotation.x;
    this.mesh.rotation.y = rotation.y;
    this.mesh.rotation.z = rotation.z;

    this.yaw = rotation.y;
    this.pitchAngle = rotation.x;
  }

  /** Redirect this missile toward a flare/chaff position instead of its target */
  divertToFlare(position: { x: number; y: number; z: number }): void {
    this.diverted = true;
    this.divertPosition = position;
    this.target = null;
  }

  update(dt: number): void {
    if (!this.alive) return;

    this.age += dt;
    if (this.age >= this.lifetime) {
      this.alive = false;
      this.mesh.dispose();
      return;
    }

    // Track divert position (flare/chaff) or target
    let trackPos: { x: number; y: number; z: number } | null = null;
    if (this.diverted && this.divertPosition) {
      trackPos = this.divertPosition;
    } else if (this.target && this.target.alive) {
      trackPos = this.target.mesh.position;
    }

    if (trackPos) {
      const tp = trackPos;
      const mp = this.mesh.position;
      const dx = tp.x - mp.x;
      const dz = tp.z - mp.z;
      const dy = tp.y - mp.y;
      const horizDist = Math.sqrt(dx * dx + dz * dz);

      // Desired yaw toward target
      const desiredYaw = Math.atan2(dx, dz);
      let yawDiff = desiredYaw - this.yaw;
      // Normalize to [-PI, PI]
      while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
      while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;
      // Apply limited turn
      const maxTurn = TURN_RATE * dt;
      if (Math.abs(yawDiff) > maxTurn) {
        this.yaw += Math.sign(yawDiff) * maxTurn;
      } else {
        this.yaw = desiredYaw;
      }

      // Desired pitch toward target
      const desiredPitch = Math.PI / 2 - Math.atan2(dy, horizDist);
      let pitchDiff = desiredPitch - this.pitchAngle;
      while (pitchDiff > Math.PI) pitchDiff -= 2 * Math.PI;
      while (pitchDiff < -Math.PI) pitchDiff += 2 * Math.PI;
      if (Math.abs(pitchDiff) > maxTurn) {
        this.pitchAngle += Math.sign(pitchDiff) * maxTurn;
      } else {
        this.pitchAngle = desiredPitch;
      }
    }

    // Move forward
    const speed = MISSILE_SPEED * dt;
    this.mesh.position.x += Math.sin(this.yaw) * speed;
    this.mesh.position.z += Math.cos(this.yaw) * speed;
    this.mesh.position.y -= Math.sin(this.pitchAngle - Math.PI / 2) * speed;

    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.x = this.pitchAngle;
  }
}
