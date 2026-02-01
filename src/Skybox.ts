// ABOUTME: Creates a large skybox with a gradient material for sky/horizon/ground effect.
// ABOUTME: Supports theater-specific color palettes (e.g., cold grey-blue for Arctic).

import { MeshBuilder, StandardMaterial, Color3, type Scene, type Mesh } from "@babylonjs/core";
import type { Theater } from "./MissionData";

const SKYBOX_COLORS: Partial<Record<Theater, { r: number; g: number; b: number }>> = {
  arctic: { r: 0.6, g: 0.7, b: 0.8 },
  middleeast: { r: 0.8, g: 0.7, b: 0.5 },
};

const DEFAULT_COLOR = { r: 0.5, g: 0.7, b: 0.9 };

export class Skybox {
  mesh: Mesh;

  constructor(scene: Scene, theater?: Theater) {
    this.mesh = MeshBuilder.CreateBox(
      "skybox",
      { size: 5000 },
      scene,
    ) as Mesh;

    this.mesh.infiniteDistance = true;

    const color = (theater && SKYBOX_COLORS[theater]) ?? DEFAULT_COLOR;
    const material = new StandardMaterial("skyboxMaterial", scene);
    material.backFaceCulling = false;
    material.disableLighting = true;
    material.emissiveColor = new Color3(color.r, color.g, color.b);

    this.mesh.material = material;
  }
}
