// ABOUTME: Aircraft entity that owns a Babylon mesh and reads from a FlightInput source.
// ABOUTME: Carries flight state (speed) and exposes input for systems to read.

import { MeshBuilder, StandardMaterial, Color3, type Scene, type Mesh } from "@babylonjs/core";
import type { FlightInput } from "./InputManager";

export interface AircraftOptions {
  color?: { r: number; g: number; b: number };
}

export class Aircraft {
  mesh: Mesh;
  speed = 0;
  health = 100;
  alive = true;

  constructor(
    scene: Scene,
    readonly input: FlightInput,
    name = "aircraft",
    options: AircraftOptions = {},
  ) {
    this.mesh = MeshBuilder.CreateCylinder(
      name,
      { height: 2, diameterTop: 0, diameterBottom: 1, tessellation: 8 },
      scene,
    ) as Mesh;
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.y = 10;

    if (options.color) {
      const mat = new StandardMaterial(`${name}-mat`, scene);
      mat.diffuseColor = new Color3(options.color.r, options.color.g, options.color.b);
      this.mesh.material = mat;
    }
  }
}
