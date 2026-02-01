// ABOUTME: Unguided rocket entity that flies forward in a straight line.
// ABOUTME: Faster than aircraft, shorter range than bullets, higher damage per hit.

import { MeshBuilder, type Scene, type Mesh } from "@babylonjs/core";

const ROCKET_SPEED = 350;
const ROCKET_LIFETIME = 3; // shorter range than bullets
const ROCKET_DAMAGE = 35;

export class Rocket {
  mesh: Mesh;
  alive = true;
  readonly damage = ROCKET_DAMAGE;
  private age = 0;
  private dirY: number;
  private dirX: number;

  constructor(
    scene: Scene,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
  ) {
    this.mesh = MeshBuilder.CreateCylinder(
      "rocket",
      { height: 2, diameterTop: 0.1, diameterBottom: 0.2, tessellation: 6 },
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
    if (this.age >= ROCKET_LIFETIME) {
      this.alive = false;
      this.mesh.dispose();
      return;
    }

    const speed = ROCKET_SPEED * dt;
    this.mesh.position.x += Math.sin(this.dirY) * speed;
    this.mesh.position.z += Math.cos(this.dirY) * speed;
    this.mesh.position.y -= Math.sin(this.dirX - Math.PI / 2) * speed;
  }
}
