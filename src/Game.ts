// ABOUTME: Core game class that initializes the Babylon.js engine, scene, and game objects.
// ABOUTME: Sets up camera, lighting, ground plane, Aircraft, and FlightSystem.

import { Engine, Scene, FreeCamera, HemisphericLight, Vector3, Color4 } from "@babylonjs/core";
import { InputManager } from "./InputManager";
import { Aircraft } from "./Aircraft";
import { FlightSystem } from "./FlightSystem";
import { CameraSystem } from "./CameraSystem";
import { DebugPanel } from "./DebugPanel";
import { Terrain } from "./Terrain";
import { Skybox } from "./Skybox";
import { WeaponSystem } from "./WeaponSystem";
import { AIInput } from "./AIInput";
import { AISystem } from "./AISystem";
import { CollisionSystem } from "./CollisionSystem";
import { ScreenShake } from "./ScreenShake";
import { HitFlash } from "./HitFlash";
import { Hud } from "./Hud";
import { TargetingSystem } from "./TargetingSystem";
import { Radar } from "./Radar";
import { MissileLockSystem } from "./MissileLockSystem";
import type { MissionData } from "./MissionData";
import type { MissionResult } from "./DebriefScene";
import { ObjectiveManager } from "./ObjectiveManager";

export class Game {
  engine: Engine;
  scene: Scene;
  aircraft: Aircraft;
  input: InputManager;
  flightSystem: FlightSystem;
  cameraSystem: CameraSystem;
  debugPanel: DebugPanel;
  terrain: Terrain;
  skybox: Skybox;
  weaponSystem: WeaponSystem;
  enemy: Aircraft;
  enemyWeaponSystem: WeaponSystem;
  aiSystem: AISystem;
  collisionSystem: CollisionSystem;
  screenShake: ScreenShake;
  hitFlash: HitFlash;
  hud: Hud;
  targetingSystem: TargetingSystem;
  radar: Radar;
  missileLockSystem: MissileLockSystem;
  objectiveManager: ObjectiveManager;
  private missionEnded = false;
  private kills = 0;
  private elapsedTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    private onMissionEnd: (result: MissionResult) => void,
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.5, 0.7, 0.9, 1);

    const camera = new FreeCamera("camera", new Vector3(0, 15, -20), this.scene);
    camera.setTarget(Vector3.Zero());

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    this.terrain = new Terrain(this.scene);
    this.skybox = new Skybox(this.scene);

    this.input = new InputManager();
    this.aircraft = new Aircraft(this.scene, this.input);
    this.flightSystem = new FlightSystem();
    this.cameraSystem = new CameraSystem(camera);
    this.weaponSystem = new WeaponSystem(this.scene);
    this.debugPanel = new DebugPanel(this.flightSystem);

    // Enemy aircraft with AI
    const aiInput = new AIInput();
    this.enemy = new Aircraft(this.scene, aiInput, "enemy", { color: { r: 1, g: 0, b: 0 } });
    this.enemy.mesh.position.x = 100;
    this.enemy.mesh.position.z = 200;
    this.enemy.mesh.position.y = 50;
    this.enemyWeaponSystem = new WeaponSystem(this.scene);
    this.aiSystem = new AISystem();
    this.collisionSystem = new CollisionSystem(this.scene);
    this.collisionSystem.setPlayer(this.aircraft);
    this.screenShake = new ScreenShake();
    this.hitFlash = new HitFlash(this.scene);
    this.hud = new Hud();
    this.targetingSystem = new TargetingSystem();
    this.radar = new Radar();
    this.missileLockSystem = new MissileLockSystem(this.scene);
    this.objectiveManager = new ObjectiveManager(mission.objectives, mission.enemies.length);

    this.engine.runRenderLoop(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      this.flightSystem.update(this.aircraft, dt);
      this.weaponSystem.update(this.aircraft, dt);

      // Check if enemy is under fire from player projectiles
      const enemyUnderFire = this.weaponSystem.projectiles.some((p) => {
        if (!p.alive) return false;
        const dx = p.mesh.position.x - this.enemy.mesh.position.x;
        const dy = p.mesh.position.y - this.enemy.mesh.position.y;
        const dz = p.mesh.position.z - this.enemy.mesh.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz) < 100;
      });

      this.aiSystem.update(this.enemy as Aircraft & { input: AIInput }, this.aircraft, dt, enemyUnderFire);
      this.flightSystem.update(this.enemy, dt);
      this.enemyWeaponSystem.update(this.enemy, dt);

      // Collision detection
      this.collisionSystem.update(
        [this.aircraft, this.enemy],
        [this.weaponSystem, this.enemyWeaponSystem],
        [
          { aircraft: this.aircraft, weaponSystem: this.weaponSystem },
          { aircraft: this.enemy, weaponSystem: this.enemyWeaponSystem },
        ],
      );
      this.collisionSystem.checkGroundCollision(this.aircraft);
      this.collisionSystem.checkGroundCollision(this.enemy);

      // Hit feedback
      if (this.collisionSystem.playerHitThisFrame) {
        this.screenShake.trigger(0.5);
        this.hitFlash.trigger(0.8);
      }
      this.screenShake.update(dt);
      this.hitFlash.update(dt);

      this.cameraSystem.update(this.aircraft, dt);

      // Apply screen shake offset to camera
      const shakeOffset = this.screenShake.getOffset();
      camera.position.x += shakeOffset.x;
      camera.position.y += shakeOffset.y;
      camera.position.z += shakeOffset.z;

      this.targetingSystem.update(this.aircraft, [this.enemy], camera);
      this.missileLockSystem.update(this.aircraft, this.targetingSystem.currentTarget, dt);
      this.hud.update(this.aircraft, this.weaponSystem.ammo, this.missileLockSystem.ammo);
      this.radar.update(this.aircraft, [this.enemy], []);

      // Track kills and mission time
      if (!this.enemy.alive && this.kills === 0) {
        this.kills = 1;
        this.objectiveManager.recordKill();
      }
      this.elapsedTime += dt;
      this.objectiveManager.update(dt);

      // Check mission end
      if (!this.missionEnded) {
        const outcome = this.objectiveManager.outcome;
        if (outcome === "success" || this.collisionSystem.missionFailed) {
          this.missionEnded = true;
          const result: MissionResult = {
            missionTitle: mission.title,
            outcome: this.collisionSystem.missionFailed ? "failure" : "success",
            kills: this.kills,
            timeSeconds: Math.round(this.elapsedTime * 10) / 10,
          };
          this.onMissionEnd(result);
        }
      }

      this.scene.render();
    });

    window.addEventListener("resize", () => this.engine.resize());
  }

  dispose(): void {
    this.engine.stopRenderLoop();
    this.engine.dispose();
    this.input.dispose();
  }
}
