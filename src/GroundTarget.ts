// ABOUTME: Stationary ground target entity (SAM site, bunker, vehicle, radar installation).
// ABOUTME: SAM sites fire surface-to-air missiles at the player; all types are destructible.

import { MeshBuilder, StandardMaterial, Color3, type Scene, type Mesh } from "@babylonjs/core";
import { Missile } from "./Missile";

export type GroundTargetType = "sam" | "bunker" | "vehicle" | "radar";

const HEALTH_BY_TYPE: Record<GroundTargetType, number> = {
  sam: 80,
  bunker: 150,
  vehicle: 50,
  radar: 60,
};

const COLOR_BY_TYPE: Record<GroundTargetType, { r: number; g: number; b: number }> = {
  sam: { r: 0.6, g: 0.2, b: 0.2 },
  bunker: { r: 0.4, g: 0.4, b: 0.4 },
  vehicle: { r: 0.5, g: 0.4, b: 0.2 },
  radar: { r: 0.3, g: 0.3, b: 0.6 },
};

const SAM_COOLDOWN = 4; // seconds between shots
const SAM_AMMO = 6;

export class GroundTarget {
  mesh: Mesh;
  health: number;
  alive = true;
  readonly type: GroundTargetType;
  private fireCooldown = 0;
  private ammo: number;

  constructor(
    scene: Scene,
    type: GroundTargetType,
    position: { x: number; y: number; z: number },
  ) {
    this.type = type;
    this.health = HEALTH_BY_TYPE[type];
    this.ammo = type === "sam" ? SAM_AMMO : 0;

    this.mesh = MeshBuilder.CreateBox(
      `ground-${type}`,
      { width: 3, height: 2, depth: 3 },
      scene,
    ) as Mesh;
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z;

    const mat = new StandardMaterial(`${type}-mat`, scene);
    const c = COLOR_BY_TYPE[type];
    mat.diffuseColor = new Color3(c.r, c.g, c.b);
    this.mesh.material = mat;
  }

  /** Attempt to fire a SAM missile at the target position. Returns fired missiles. */
  tryFire(
    scene: Scene,
    targetPos: { x: number; y: number; z: number },
    dt: number,
  ): Missile[] {
    if (!this.alive || this.type !== "sam" || this.ammo <= 0) return [];

    this.fireCooldown -= dt;
    if (this.fireCooldown > 0) return [];

    this.fireCooldown = SAM_COOLDOWN;
    this.ammo--;

    const dx = targetPos.x - this.mesh.position.x;
    const dy = targetPos.y - this.mesh.position.y;
    const dz = targetPos.z - this.mesh.position.z;
    const yaw = Math.atan2(dx, dz);
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    const pitch = Math.PI / 2 - Math.atan2(dy, horizDist);

    const missile = new Missile(
      scene,
      {
        x: this.mesh.position.x,
        y: this.mesh.position.y + 2,
        z: this.mesh.position.z,
      },
      { x: pitch, y: yaw, z: 0 },
      null,
      "heat",
    );

    return [missile];
  }
}
