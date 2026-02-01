// ABOUTME: Core game class that initializes the Babylon.js engine, scene, and game objects.
// ABOUTME: Sets up camera, lighting, ground plane, Aircraft, and FlightSystem.

import { Engine, Scene, FreeCamera, HemisphericLight, Vector3, MeshBuilder, Color4 } from "@babylonjs/core";
import { InputManager } from "./InputManager";
import { Aircraft } from "./Aircraft";
import { FlightSystem } from "./FlightSystem";
import { DebugPanel } from "./DebugPanel";

export class Game {
  engine: Engine;
  scene: Scene;
  aircraft: Aircraft;
  input: InputManager;
  flightSystem: FlightSystem;
  debugPanel: DebugPanel;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.5, 0.7, 0.9, 1);

    const camera = new FreeCamera("camera", new Vector3(0, 15, -20), this.scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this.scene);

    this.input = new InputManager();
    this.aircraft = new Aircraft(this.scene, this.input);
    this.flightSystem = new FlightSystem();
    this.debugPanel = new DebugPanel(this.flightSystem);

    this.engine.runRenderLoop(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      this.flightSystem.update(this.aircraft, dt);
      this.scene.render();
    });

    window.addEventListener("resize", () => this.engine.resize());
  }
}
