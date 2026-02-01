// ABOUTME: Object pool for projectile meshes to avoid per-shot allocation overhead.
// ABOUTME: Pre-allocates cylinder meshes and recycles them when projectiles expire.

import { MeshBuilder, type Scene, type Mesh } from "@babylonjs/core";

export class ProjectilePool {
  private available: Mesh[] = [];
  private all: Mesh[] = [];

  constructor(private scene: Scene, initialSize: number) {
    for (let i = 0; i < initialSize; i++) {
      const mesh = this.createMesh();
      mesh.setEnabled(false);
      this.available.push(mesh);
    }
  }

  get availableCount(): number {
    return this.available.length;
  }

  acquire(): Mesh {
    let mesh: Mesh;
    if (this.available.length > 0) {
      mesh = this.available.pop()!;
    } else {
      mesh = this.createMesh();
    }
    mesh.setEnabled(true);
    return mesh;
  }

  release(mesh: Mesh): void {
    mesh.setEnabled(false);
    this.available.push(mesh);
  }

  dispose(): void {
    for (const mesh of this.all) {
      mesh.dispose();
    }
    this.all.length = 0;
    this.available.length = 0;
  }

  private createMesh(): Mesh {
    const mesh = MeshBuilder.CreateCylinder(
      "projectile",
      { height: 1.5, diameterTop: 0.05, diameterBottom: 0.05, tessellation: 4 },
      this.scene,
    ) as Mesh;
    this.all.push(mesh);
    return mesh;
  }
}
