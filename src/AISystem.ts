// ABOUTME: Drives enemy aircraft by computing pursuit, firing, and evasion decisions.
// ABOUTME: Writes control values to AIInput each frame based on relative position to the player.

import type { Aircraft } from "./Aircraft";
import type { AIInput } from "./AIInput";

const FIRE_RANGE = 300;
const FIRE_ANGLE = Math.PI / 6; // 30 degrees
const EVASION_ROLL = 1;

export class AISystem {
  update(
    enemy: Aircraft & { input: AIInput },
    player: Aircraft,
    dt: number,
    underFire: boolean,
  ): void {
    const input = enemy.input;

    // Vector from enemy to player
    const dx = player.mesh.position.x - enemy.mesh.position.x;
    const dy = player.mesh.position.y - enemy.mesh.position.y;
    const dz = player.mesh.position.z - enemy.mesh.position.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Desired heading to player
    const desiredYaw = Math.atan2(dx, dz);
    let yawDiff = desiredYaw - enemy.mesh.rotation.y;

    // Normalize angle to [-PI, PI]
    while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
    while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;

    // Pitch toward player
    const desiredPitch = -Math.atan2(dy, distXZ);
    const currentPitch = enemy.mesh.rotation.x - Math.PI / 2;
    let pitchDiff = desiredPitch - currentPitch;

    // Clamp inputs to [-1, 1]
    input.yaw = Math.max(-1, Math.min(1, yawDiff));
    input.pitch = Math.max(-1, Math.min(1, pitchDiff));
    input.throttle = 1;
    input.roll = 0;

    // Fire when facing the player and within range
    const facingDot =
      Math.sin(enemy.mesh.rotation.y) * dx +
      Math.cos(enemy.mesh.rotation.y) * dz;
    const angle = dist > 0 ? Math.acos(Math.max(-1, Math.min(1, facingDot / dist))) : 0;
    input.fire = angle < FIRE_ANGLE && dist < FIRE_RANGE;

    // Evasive action when under fire
    if (underFire) {
      input.roll = EVASION_ROLL * (Math.random() > 0.5 ? 1 : -1);
      input.pitch = -0.5; // pull up while evading
    }
  }
}
