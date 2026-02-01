// ABOUTME: Aircraft entity that owns a Babylon mesh and reads from a FlightInput source.
// ABOUTME: Carries flight state (speed) and exposes input for systems to read.

import { MeshBuilder, type Scene, type Mesh } from "@babylonjs/core";
import type { FlightInput } from "./InputManager";

export class Aircraft {
  mesh: Mesh;
  speed = 0;

  constructor(
    scene: Scene,
    readonly input: FlightInput,
  ) {
    this.mesh = MeshBuilder.CreateCylinder(
      "aircraft",
      { height: 2, diameterTop: 0, diameterBottom: 1, tessellation: 8 },
      scene,
    ) as Mesh;
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.y = 10;
  }
}
