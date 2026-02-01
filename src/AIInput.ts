// ABOUTME: Mutable FlightInput implementation driven by the AI system.
// ABOUTME: AISystem writes to this each frame; Aircraft reads from it like any other input source.

import type { FlightInput } from "./InputManager";

export class AIInput implements FlightInput {
  pitch = 0;
  roll = 0;
  yaw = 0;
  throttle = 0;
  fire = false;
  cycleTarget = false;
  lockOn = false;
  cycleWeapon = false;
  deployCountermeasure = false;
}
