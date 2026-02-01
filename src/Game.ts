// ABOUTME: Core game class that initializes the Babylon.js engine, scene, and game objects.
// ABOUTME: Sets up camera, lighting, ground plane, and a WASD-movable cube.

import { Engine, Scene, FreeCamera, HemisphericLight, Vector3, MeshBuilder, Color4 } from "@babylonjs/core";
import type { Mesh } from "@babylonjs/core";

const MOVE_SPEED = 10;

export class Game {
  engine: Engine;
  scene: Scene;
  cube: Mesh;

  private keys: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.5, 0.7, 0.9, 1);

    const camera = new FreeCamera("camera", new Vector3(0, 5, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this.scene);

    this.cube = MeshBuilder.CreateBox("cube", { size: 1 }, this.scene) as Mesh;
    this.cube.position.y = 1;

    window.addEventListener("keydown", (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));

    this.engine.runRenderLoop(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      for (const key of this.keys) {
        this.handleKey(key, dt);
      }
      this.scene.render();
    });

    window.addEventListener("resize", () => this.engine.resize());
  }

  handleKey(key: string, dt: number): void {
    const speed = MOVE_SPEED * dt;
    switch (key) {
      case "w":
        this.cube.position.z += speed;
        break;
      case "s":
        this.cube.position.z -= speed;
        break;
      case "a":
        this.cube.position.x -= speed;
        break;
      case "d":
        this.cube.position.x += speed;
        break;
    }
  }
}
