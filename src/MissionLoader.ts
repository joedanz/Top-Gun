// ABOUTME: Parses mission JSON data and spawns player/enemy/ground-target entities accordingly.
// ABOUTME: Returns all spawned entities and an ObjectiveManager for the mission.

import type { Scene } from "@babylonjs/core";
import type { MissionData } from "./MissionData";
import { Aircraft } from "./Aircraft";
import { AIInput } from "./AIInput";
import { InputManager } from "./InputManager";
import { ObjectiveManager } from "./ObjectiveManager";
import { GroundTarget } from "./GroundTarget";
import { Carrier } from "./Carrier";

export interface MissionEntities {
  player: Aircraft;
  inputManager: InputManager;
  enemies: Aircraft[];
  aiInputs: AIInput[];
  groundTargets: GroundTarget[];
  carrier: Carrier | null;
  objectiveManager: ObjectiveManager;
}

export class MissionLoader {
  static load(mission: MissionData, scene: Scene): MissionEntities {
    const inputManager = new InputManager();
    const player = new Aircraft(scene, inputManager, "player");
    player.mesh.position.x = mission.playerStart.position.x;
    player.mesh.position.y = mission.playerStart.position.y;
    player.mesh.position.z = mission.playerStart.position.z;
    player.mesh.rotation.y = mission.playerStart.heading;

    const enemies: Aircraft[] = [];
    const aiInputs: AIInput[] = [];

    for (let i = 0; i < mission.enemies.length; i++) {
      const spawn = mission.enemies[i];
      const aiInput = new AIInput();
      const color = spawn.color ?? { r: 1, g: 0, b: 0 };
      const enemy = new Aircraft(scene, aiInput, `enemy-${i}`, { color });
      enemy.mesh.position.x = spawn.position.x;
      enemy.mesh.position.y = spawn.position.y;
      enemy.mesh.position.z = spawn.position.z;
      enemies.push(enemy);
      aiInputs.push(aiInput);
    }

    const groundTargets: GroundTarget[] = [];
    if (mission.groundTargets) {
      for (const gtSpawn of mission.groundTargets) {
        const gt = new GroundTarget(scene, gtSpawn.type, gtSpawn.position);
        groundTargets.push(gt);
      }
    }

    let carrier: Carrier | null = null;
    if (mission.carrier) {
      carrier = new Carrier(scene, mission.carrier.position, mission.carrier.heading);
    }

    const objectiveManager = new ObjectiveManager(
      mission.objectives,
      mission.enemies.length,
      groundTargets.length,
    );

    return { player, inputManager, enemies, aiInputs, groundTargets, carrier, objectiveManager };
  }
}
