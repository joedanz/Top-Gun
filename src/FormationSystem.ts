// ABOUTME: Manages enemy aircraft formations (wing pairs and diamonds).
// ABOUTME: Wingmen maintain relative positions to their leader; break formation when player is near.

import type { Aircraft } from "./Aircraft";
import type { AIInput } from "./AIInput";

export type FormationType = "wing" | "diamond";

const ENGAGE_RANGE = 500;
const DISENGAGE_RANGE = 800;

/** Relative offsets from leader for each formation type (local space: x = right, z = behind). */
const FORMATION_OFFSETS: Record<FormationType, { x: number; z: number }[]> = {
  wing: [{ x: 30, z: -20 }],
  diamond: [
    { x: 30, z: -20 },
    { x: -30, z: -20 },
    { x: 0, z: -40 },
  ],
};

export interface Formation {
  type: FormationType;
  leader: Aircraft & { input: AIInput };
  wingmen: (Aircraft & { input: AIInput })[];
  engaged: boolean;
}

export class FormationSystem {
  private formations: Formation[] = [];

  createFormation(
    type: FormationType,
    leader: Aircraft & { input: AIInput },
    wingmen: (Aircraft & { input: AIInput })[],
  ): Formation {
    const formation: Formation = { type, leader, wingmen, engaged: false };
    this.formations.push(formation);
    return formation;
  }

  update(
    formation: Formation,
    player: Aircraft,
    dt: number,
  ): void {
    const dx = player.mesh.position.x - formation.leader.mesh.position.x;
    const dz = player.mesh.position.z - formation.leader.mesh.position.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    // Engagement hysteresis: engage at close range, disengage at far range
    if (formation.engaged) {
      if (distToPlayer > DISENGAGE_RANGE) {
        formation.engaged = false;
      }
    } else {
      if (distToPlayer < ENGAGE_RANGE) {
        formation.engaged = true;
      }
    }

    // When engaged, wingmen pursue independently (AISystem handles them)
    if (formation.engaged) return;

    // When disengaged, steer wingmen toward formation offsets relative to the leader
    const offsets = FORMATION_OFFSETS[formation.type];
    const leaderYaw = formation.leader.mesh.rotation.y;
    const cosY = Math.cos(leaderYaw);
    const sinY = Math.sin(leaderYaw);

    for (let i = 0; i < formation.wingmen.length; i++) {
      const wingman = formation.wingmen[i];
      if (!wingman.alive) continue;

      const offset = offsets[i % offsets.length];

      // Rotate offset by leader heading to get world-space target position
      const targetX =
        formation.leader.mesh.position.x + offset.x * cosY + offset.z * sinY;
      const targetZ =
        formation.leader.mesh.position.z - offset.x * sinY + offset.z * cosY;
      const targetY = formation.leader.mesh.position.y;

      // Steer wingman toward target position
      const toX = targetX - wingman.mesh.position.x;
      const toZ = targetZ - wingman.mesh.position.z;
      const toY = targetY - wingman.mesh.position.y;
      const dist = Math.sqrt(toX * toX + toZ * toZ);

      const desiredYaw = Math.atan2(toX, toZ);
      let yawDiff = desiredYaw - wingman.mesh.rotation.y;
      while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
      while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;

      const input = wingman.input;
      input.yaw = Math.max(-1, Math.min(1, yawDiff));
      input.pitch = Math.max(-1, Math.min(1, -toY * 0.05));
      input.roll = 0;
      input.fire = false;

      // Match leader speed, speed up if far from formation position
      input.throttle = dist > 20 ? 1 : 0.5;
    }
  }

  updateAll(player: Aircraft, dt: number): void {
    for (const formation of this.formations) {
      this.update(formation, player, dt);
    }
  }
}
