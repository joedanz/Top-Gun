// ABOUTME: Creates a large textured ground plane for the game world.
// ABOUTME: Supports theater-specific color palettes (e.g., snow/ice for Arctic).

import { MeshBuilder, StandardMaterial, Color3, Texture, type Scene, type Mesh } from "@babylonjs/core";
import type { Theater } from "./MissionData";

const TERRAIN_COLORS: Partial<Record<Theater, { r: number; g: number; b: number }>> = {
  arctic: { r: 0.85, g: 0.88, b: 0.92 },
  middleeast: { r: 0.76, g: 0.65, b: 0.45 },
};

const DEFAULT_COLOR = { r: 0.35, g: 0.55, b: 0.3 };

export class Terrain {
  mesh: Mesh;

  constructor(scene: Scene, theater?: Theater) {
    this.mesh = MeshBuilder.CreateGround(
      "terrain",
      { width: 4000, height: 4000, subdivisions: 32 },
      scene,
    ) as Mesh;

    const color = (theater && TERRAIN_COLORS[theater]) ?? DEFAULT_COLOR;
    const material = new StandardMaterial("terrainMaterial", scene);
    material.diffuseColor = new Color3(color.r, color.g, color.b);
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
