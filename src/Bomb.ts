// ABOUTME: Gravity-affected bomb entity for attacking ground targets.
// ABOUTME: Inherits forward velocity from aircraft at release, falls under gravity.

import { MeshBuilder, type Scene, type Mesh } from "@babylonjs/core";

const GRAVITY = 30; // units/s²
const GROUND_LEVEL = 2;
const BOMB_DAMAGE = 80;

export class Bomb {
  mesh: Mesh;
  alive = true;
  readonly damage = BOMB_DAMAGE;
  private velocityX: number;
  private velocityY = 0;
  private velocityZ: number;

  constructor(
    scene: Scene,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    aircraftSpeed: number,
  ) {
    this.mesh = MeshBuilder.CreateCylinder(
      "bomb",
      { height: 1.5, diameterTop: 0.2, diameterBottom: 0.4, tessellation: 6 },
      scene,
    ) as Mesh;
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z;
    this.mesh.rotation.x = rotation.x;
    this.mesh.rotation.y = rotation.y;
    this.mesh.rotation.z = rotation.z;

    // Inherit forward velocity from aircraft
    this.velocityX = Math.sin(rotation.y) * aircraftSpeed;
    this.velocityZ = Math.cos(rotation.y) * aircraftSpeed;
  }

  update(dt: number): void {
    if (!this.alive) return;

    // Apply gravity
    this.velocityY -= GRAVITY * dt;

    // Move
    this.mesh.position.x += this.velocityX * dt;
    this.mesh.position.y += this.velocityY * dt;
    this.mesh.position.z += this.velocityZ * dt;

    // Ground detonation
    if (this.mesh.position.y <= GROUND_LEVEL) {
      this.alive = false;
      this.mesh.dispose();
    }
  }
}
