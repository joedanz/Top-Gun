// ABOUTME: Creates a large textured ground plane for the game world.
// ABOUTME: Uses a procedural grid texture to provide spatial reference during flight.

import { MeshBuilder, StandardMaterial, Color3, Texture, type Scene, type Mesh } from "@babylonjs/core";

export class Terrain {
  mesh: Mesh;

  constructor(scene: Scene) {
    this.mesh = MeshBuilder.CreateGround(
      "terrain",
      { width: 4000, height: 4000, subdivisions: 32 },
      scene,
    ) as Mesh;

    const material = new StandardMaterial("terrainMaterial", scene);
    material.diffuseColor = new Color3(0.35, 0.55, 0.3);
    material.specularColor = new Color3(0, 0, 0);

    // Apply a tiling grid texture for spatial reference
    const texture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==", scene);
    texture.uScale = 200;
    texture.vScale = 200;
    material.diffuseTexture = texture;

    this.mesh.material = material;
    this.mesh.receiveShadows = true;
  }
}
