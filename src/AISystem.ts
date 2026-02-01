// ABOUTME: Drives enemy aircraft by computing pursuit, firing, and evasion decisions.
// ABOUTME: Supports difficulty-scaled evasive maneuvers: break turns, barrel rolls, and split-S.

import type { Aircraft } from "./Aircraft";
import type { AIInput } from "./AIInput";

const FIRE_RANGE = 300;
const FIRE_ANGLE = Math.PI / 6; // 30 degrees
const MIN_SPLIT_S_ALTITUDE = 40;

type Maneuver = "break_turn" | "barrel_roll" | "split_s";

const MANEUVERS_BY_DIFFICULTY: Record<number, Maneuver[]> = {
  1: ["break_turn"],
  2: ["break_turn", "barrel_roll"],
  3: ["break_turn", "barrel_roll", "split_s"],
};

export class AISystem {
  private difficulty: number;
  private activeManeuver: Maneuver | null = null;
  private maneuverTimer = 0;
  private maneuverDirection = 1; // +1 or -1

  constructor(difficulty = 1) {
    this.difficulty = Math.max(1, Math.min(3, difficulty));
  }

  update(
    enemy: Aircraft & { input: AIInput },
    player: Aircraft,
    dt: number,
    underFire: boolean,
  ): void {
    const input = enemy.input;

    // Tick down active maneuver
    if (this.activeManeuver) {
      this.maneuverTimer -= dt;
      if (this.maneuverTimer <= 0) {
        this.activeManeuver = null;
      }
    }

    // If under fire and no active maneuver, pick one
    if (underFire && !this.activeManeuver) {
      this.startManeuver(enemy);
    }

    // Execute active maneuver
    if (this.activeManeuver) {
      this.executeManeuver(input);
      return;
    }

    // Normal pursuit behavior
    this.pursue(enemy, player, input);
  }

  private startManeuver(enemy: Aircraft & { input: AIInput }): void {
    const available = MANEUVERS_BY_DIFFICULTY[this.difficulty] ?? ["break_turn"];
    const roll = Math.random();
    let chosen = available[Math.floor(roll * available.length)];

    // Avoid split-S at low altitude
    if (chosen === "split_s" && enemy.mesh.position.y < MIN_SPLIT_S_ALTITUDE) {
      chosen = "break_turn";
    }

    this.activeManeuver = chosen;
    this.maneuverDirection = Math.random() > 0.5 ? 1 : -1;

    switch (chosen) {
      case "break_turn":
        this.maneuverTimer = 0.8;
        break;
      case "barrel_roll":
        this.maneuverTimer = 1.0;
        break;
      case "split_s":
        this.maneuverTimer = 1.2;
        break;
    }
  }

  private executeManeuver(input: AIInput): void {
    switch (this.activeManeuver) {
      case "break_turn":
        input.yaw = this.maneuverDirection;
        input.pitch = -0.5;
        input.roll = 0;
        input.throttle = 1;
        input.fire = false;
        break;
      case "barrel_roll":
        input.roll = this.maneuverDirection;
        input.pitch = -0.3;
        input.yaw = 0;
        input.throttle = 1;
        input.fire = false;
        break;
      case "split_s":
        input.roll = this.maneuverDirection;
        input.pitch = 0.8;
        input.yaw = 0;
        input.throttle = 0.5;
        input.fire = false;
        break;
    }
  }

  private pursue(
    enemy: Aircraft & { input: AIInput },
    player: Aircraft,
    input: AIInput,
  ): void {
    const dx = player.mesh.position.x - enemy.mesh.position.x;
    const dy = player.mesh.position.y - enemy.mesh.position.y;
    const dz = player.mesh.position.z - enemy.mesh.position.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const desiredYaw = Math.atan2(dx, dz);
    let yawDiff = desiredYaw - enemy.mesh.rotation.y;

    while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
    while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;

    const desiredPitch = -Math.atan2(dy, distXZ);
    const currentPitch = enemy.mesh.rotation.x - Math.PI / 2;
    const pitchDiff = desiredPitch - currentPitch;

    input.yaw = Math.max(-1, Math.min(1, yawDiff));
    input.pitch = Math.max(-1, Math.min(1, pitchDiff));
    input.throttle = 1;
    input.roll = 0;

    const facingDot =
      Math.sin(enemy.mesh.rotation.y) * dx +
      Math.cos(enemy.mesh.rotation.y) * dz;
    const angle = dist > 0 ? Math.acos(Math.max(-1, Math.min(1, facingDot / dist))) : 0;
    input.fire = angle < FIRE_ANGLE && dist < FIRE_RANGE;
  }
}
