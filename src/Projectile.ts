// ABOUTME: Projectile entity with a visible tracer mesh that travels forward and expires.
// ABOUTME: Created by WeaponSystem, self-manages lifetime and disposal.

import { MeshBuilder, type Scene, type Mesh } from "@babylonjs/core";

const PROJECTILE_SPEED = 500;
const PROJECTILE_LIFETIME = 2; // seconds

export class Projectile {
  mesh: Mesh;
  alive = true;
  private age = 0;
  private dirY: number;
  private dirX: number;

  constructor(
    scene: Scene,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
  ) {
    this.mesh = MeshBuilder.CreateCylinder(
      "projectile",
      { height: 1.5, diameterTop: 0.05, diameterBottom: 0.05, tessellation: 4 },
      scene,
    ) as Mesh;
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z;
    this.mesh.rotation.x = rotation.x;
    this.mesh.rotation.y = rotation.y;
    this.mesh.rotation.z = rotation.z;

    this.dirY = rotation.y;
    this.dirX = rotation.x;
  }

  update(dt: number): void {
    if (!this.alive) return;

    this.age += dt;
    if (this.age >= PROJECTILE_LIFETIME) {
      this.alive = false;
      this.mesh.dispose();
      return;
    }

    const speed = PROJECTILE_SPEED * dt;
    this.mesh.position.x += Math.sin(this.dirY) * speed;
    this.mesh.position.z += Math.cos(this.dirY) * speed;
    this.mesh.position.y -= Math.sin(this.dirX - Math.PI / 2) * speed;
  }
}
