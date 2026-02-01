// ABOUTME: Loads GLTF aircraft models via Babylon SceneLoader and caches them.
// ABOUTME: Replaces placeholder meshes on Aircraft entities transparently.

import { SceneLoader, type Scene, type AbstractMesh } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { Aircraft } from "./Aircraft";

export interface ModelCatalogEntry {
  id: string;
  modelPath?: string;
}

export class AssetLoader {
  private cache = new Map<string, AbstractMesh>();

  constructor(private scene: Scene) {}

  async load(path: string): Promise<AbstractMesh | null> {
    const cached = this.cache.get(path);
    if (cached) return cached;

    try {
      const result = await SceneLoader.ImportMeshAsync("", path, "", this.scene);
      const root = result.meshes[0];
      this.cache.set(path, root);
      return root;
    } catch {
      return null;
    }
  }

  async preloadFromCatalog(entries: ModelCatalogEntry[]): Promise<void> {
    const promises = entries
      .filter((e) => e.modelPath)
      .map((e) => this.load(e.modelPath!));
    await Promise.all(promises);
  }

  async applyModel(aircraft: Aircraft, modelPath: string): Promise<void> {
    const mesh = await this.load(modelPath);
    if (!mesh) return;

    const oldPos = aircraft.mesh.position;
    const px = oldPos.x;
    const py = oldPos.y;
    const pz = oldPos.z;

    aircraft.mesh.dispose();
    aircraft.mesh = mesh as any;
    aircraft.mesh.position.x = px;
    aircraft.mesh.position.y = py;
    aircraft.mesh.position.z = pz;
  }
}
