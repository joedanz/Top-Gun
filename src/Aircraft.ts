// ABOUTME: Aircraft entity that owns a Babylon mesh and reads from a FlightInput source.
// ABOUTME: Placeholder cone/cylinder shape; applies basic movement from input axes.

import { MeshBuilder, type Scene, type Mesh } from "@babylonjs/core";
import type { FlightInput } from "./InputManager";

const MOVE_SPEED = 20;
const TURN_SPEED = 2;

export class Aircraft {
  mesh: Mesh;

  constructor(
    scene: Scene,
    private input: FlightInput,
  ) {
    this.mesh = MeshBuilder.CreateCylinder(
      "aircraft",
      { height: 2, diameterTop: 0, diameterBottom: 1, tessellation: 8 },
      scene,
    ) as Mesh;
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.y = 10;
  }

  update(dt: number): void {
    const { pitch, roll, yaw } = this.input;

    this.mesh.position.z += pitch * MOVE_SPEED * dt;
    this.mesh.position.x += roll * MOVE_SPEED * dt;
    this.mesh.rotation.y += yaw * TURN_SPEED * dt;
  }
}
