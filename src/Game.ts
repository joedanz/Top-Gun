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
import { WeaponManager } from "./WeaponManager";
import type { MissionData } from "./MissionData";
import { FormationSystem } from "./FormationSystem";
import type { MissionResult } from "./DebriefScene";
import { ObjectiveManager } from "./ObjectiveManager";
import { getAircraftStats } from "./AircraftData";
import { CountermeasureSystem } from "./CountermeasureSystem";
import { GroundTarget } from "./GroundTarget";
import type { Missile } from "./Missile";
import { calculateScore, getMedal } from "./Scoring";
import { BossSystem } from "./BossSystem";
import { BossHealthBar } from "./BossHealthBar";

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
  weaponManager: WeaponManager;
  enemy: Aircraft;
  enemyWeaponSystem: WeaponSystem;
  aiSystem: AISystem;
  collisionSystem: CollisionSystem;
  screenShake: ScreenShake;
  hitFlash: HitFlash;
  hud: Hud;
  targetingSystem: TargetingSystem;
  radar: Radar;
  objectiveManager: ObjectiveManager;
  formationSystem: FormationSystem;
  countermeasureSystem: CountermeasureSystem;
  groundTargets: GroundTarget[];
  bossSystem: BossSystem | null = null;
  bossHealthBar: BossHealthBar;
  private samMissiles: Missile[] = [];
  private missionEnded = false;
  private kills = 0;
  private elapsedTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    private onMissionEnd: (result: MissionResult) => void,
    aircraftId?: string,
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
    this.debugPanel = new DebugPanel(this.flightSystem);

    // Weapon manager (defaults, overridden below if aircraftId provided)
    this.weaponManager = new WeaponManager(this.scene);

    // Enemy aircraft with AI
    const aiInput = new AIInput();
    this.enemy = new Aircraft(this.scene, aiInput, "enemy", { color: { r: 1, g: 0, b: 0 } });
    this.enemy.mesh.position.x = 100;
    this.enemy.mesh.position.z = 200;
    this.enemy.mesh.position.y = 50;
    this.enemyWeaponSystem = new WeaponSystem(this.scene);
    this.aiSystem = new AISystem(mission.aiDifficulty);
    this.collisionSystem = new CollisionSystem(this.scene);
    this.collisionSystem.setPlayer(this.aircraft);
    this.screenShake = new ScreenShake();
    this.hitFlash = new HitFlash(this.scene);
    this.hud = new Hud();
    this.targetingSystem = new TargetingSystem();
    this.radar = new Radar();
    this.formationSystem = new FormationSystem();
    this.countermeasureSystem = new CountermeasureSystem(this.scene);
    this.bossHealthBar = new BossHealthBar();

    // Initialize boss system if this is a boss mission
    if (mission.bossIndex !== undefined && mission.bossIndex === 0) {
      if (mission.bossHealth) {
        this.enemy.health = mission.bossHealth;
      }
      this.bossSystem = new BossSystem();
      this.bossSystem.init(this.enemy);
      if (mission.bossName) {
        this.bossHealthBar.show(mission.bossName);
      }
    }

    // Spawn ground targets from mission data
    this.groundTargets = [];
    if (mission.groundTargets) {
      for (const gtSpawn of mission.groundTargets) {
        this.groundTargets.push(new GroundTarget(this.scene, gtSpawn.type, gtSpawn.position));
      }
    }

    this.objectiveManager = new ObjectiveManager(
      mission.objectives,
      mission.enemies.length,
      this.groundTargets.length,
    );

    // Create formations from mission data
    if (mission.formations) {
      for (const formationDef of mission.formations) {
        const leaderIndex = formationDef.members[0];
        if (leaderIndex === 0) {
          this.formationSystem.createFormation(
            formationDef.type,
            this.enemy as Aircraft & { input: AIInput },
            [],
          );
        }
      }
    }

    if (aircraftId) {
      const stats = getAircraftStats(aircraftId);
      this.aircraft.flightParams = stats.flightParams;
      const loadout = stats.weaponLoadout;
      this.weaponManager = new WeaponManager(this.scene, {
        gunAmmo: loadout.gunAmmo,
        heatSeeking: loadout.missiles,
        radarGuided: loadout.radarMissiles ?? 0,
        rockets: loadout.rockets ?? 0,
        bombs: loadout.bombs ?? 0,
      });
    }

    this.engine.runRenderLoop(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      this.flightSystem.update(this.aircraft, dt);

      // Update all player weapons
      this.weaponManager.update(this.aircraft, this.targetingSystem.currentTarget, dt);

      // SAM sites fire missiles at the player
      const allSamMissiles: Missile[] = [];
      for (const gt of this.groundTargets) {
        const fired = gt.tryFire(this.scene, this.aircraft.mesh.position, dt);
        allSamMissiles.push(...fired);
      }
      this.samMissiles.push(...allSamMissiles);

      // Update SAM missiles
      for (const m of this.samMissiles) {
        m.update(dt);
      }

      // Deploy countermeasures against incoming SAM missiles
      this.countermeasureSystem.update(this.aircraft, this.samMissiles, dt);

      // Check if enemy is under fire from player projectiles
      const enemyUnderFire = this.weaponManager.gunSystem.projectiles.some((p) => {
        if (!p.alive) return false;
        const dx = p.mesh.position.x - this.enemy.mesh.position.x;
        const dy = p.mesh.position.y - this.enemy.mesh.position.y;
        const dz = p.mesh.position.z - this.enemy.mesh.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz) < 100;
      });

      // Update formations (steers wingmen when disengaged)
      this.formationSystem.updateAll(this.aircraft, dt);

      this.aiSystem.update(this.enemy as Aircraft & { input: AIInput }, this.aircraft, dt, enemyUnderFire);
      this.flightSystem.update(this.enemy, dt);
      this.enemyWeaponSystem.update(this.enemy, dt);

      // Collision detection — guns (player + enemy)
      this.collisionSystem.update(
        [this.aircraft, this.enemy],
        [this.weaponManager.gunSystem, this.enemyWeaponSystem],
        [
          { aircraft: this.aircraft, weaponSystem: this.weaponManager.gunSystem },
          { aircraft: this.enemy, weaponSystem: this.enemyWeaponSystem },
        ],
      );

      // Collision detection — player rockets, bombs, missiles against all aircraft
      this.collisionSystem.checkHittables(
        [
          ...this.weaponManager.rockets,
          ...this.weaponManager.bombs,
          ...this.weaponManager.radarMissiles,
          ...this.weaponManager.missileLockSystem.missiles,
        ],
        [this.aircraft, this.enemy],
        this.aircraft,
      );

      // Collision detection — SAM missiles against player
      this.collisionSystem.checkHittables(
        this.samMissiles.filter((m) => m.alive),
        [this.aircraft],
      );

      // Collision detection — player weapons against ground targets
      const destroyedGt = this.collisionSystem.checkGroundTargets(
        this.groundTargets,
        [this.weaponManager.gunSystem],
        [
          ...this.weaponManager.rockets,
          ...this.weaponManager.bombs,
          ...this.weaponManager.radarMissiles,
          ...this.weaponManager.missileLockSystem.missiles,
        ],
      );
      for (const _idx of destroyedGt) {
        this.objectiveManager.recordGroundKill();
      }

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

      // Update boss system and health bar
      if (this.bossSystem) {
        this.bossSystem.update(this.enemy, this.aircraft, dt);
        this.bossHealthBar.update(this.bossSystem.getHealthRatio());
      }

      this.targetingSystem.update(this.aircraft, [this.enemy], camera);
      this.hud.update(this.aircraft, this.weaponManager, this.countermeasureSystem);
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
          const missionOutcome = this.collisionSystem.missionFailed ? "failure" : "success";
          const timeSeconds = Math.round(this.elapsedTime * 10) / 10;
          const shotsFired = this.weaponManager.gunSystem.shotsFired;
          const shotsHit = this.collisionSystem.playerHitsDealt;
          const damageTaken = 100 - Math.max(0, this.aircraft.health);
          const breakdown = missionOutcome === "success"
            ? calculateScore(this.kills, timeSeconds, shotsFired, shotsHit, damageTaken)
            : { kills: 0, timeBonus: 0, accuracyBonus: 0, damagePenalty: 0, total: 0 };
          const result: MissionResult = {
            missionTitle: mission.title,
            outcome: missionOutcome,
            kills: this.kills,
            timeSeconds,
            score: breakdown.total,
            medal: getMedal(breakdown.total),
            shotsFired,
            shotsHit,
            damageTaken,
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
