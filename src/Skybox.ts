// ABOUTME: Creates a large skybox with a gradient material for sky/horizon/ground effect.
// ABOUTME: Uses a StandardMaterial with emissive color and backFaceCulling disabled.

import { MeshBuilder, StandardMaterial, Color3, type Scene, type Mesh } from "@babylonjs/core";

export class Skybox {
  mesh: Mesh;

  constructor(scene: Scene) {
    this.mesh = MeshBuilder.CreateBox(
      "skybox",
      { size: 5000 },
      scene,
    ) as Mesh;

    this.mesh.infiniteDistance = true;

    const material = new StandardMaterial("skyboxMaterial", scene);
    material.backFaceCulling = false;
    material.disableLighting = true;
    material.emissiveColor = new Color3(0.5, 0.7, 0.9);

    this.mesh.material = material;
  }
}
