// ABOUTME: Third-person chase camera that follows the player aircraft.
// ABOUTME: Smooth interpolation, speed-dependent distance (pulls back at high speed).

import type { FreeCamera } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";

export interface CameraParams {
  /** Base distance behind the aircraft */
  baseDistance: number;
  /** Base height above the aircraft */
  baseHeight: number;
  /** Extra distance added at max speed */
  speedDistanceScale: number;
  /** Max speed used for normalizing speed ratio */
  maxSpeed: number;
  /** Interpolation smoothing factor (0–1, higher = snappier) */
  smoothing: number;
}

const DEFAULT_PARAMS: CameraParams = {
  baseDistance: 15,
  baseHeight: 6,
  speedDistanceScale: 10,
  maxSpeed: 200,
  smoothing: 0.05,
};

export class CameraSystem {
  params: CameraParams;

  constructor(
    private camera: FreeCamera,
    overrides: Partial<CameraParams> = {},
  ) {
    this.params = { ...DEFAULT_PARAMS, ...overrides };
  }

  update(aircraft: Aircraft, _dt: number): void {
    const p = this.params;
    const pos = aircraft.mesh.position;
    const rot = aircraft.mesh.rotation;

    // Speed-dependent distance: further at high speed, closer at low speed
    const speedRatio = Math.min(aircraft.speed / p.maxSpeed, 1);
    const distance = p.baseDistance + speedRatio * p.speedDistanceScale;
    const height = p.baseHeight;

    // Target camera position: behind and above the aircraft based on its heading
    const targetX = pos.x - Math.sin(rot.y) * distance;
    const targetY = pos.y + height;
    const targetZ = pos.z - Math.cos(rot.y) * distance;

    // Smooth interpolation (lerp)
    const s = p.smoothing;
    this.camera.position.x += (targetX - this.camera.position.x) * s;
    this.camera.position.y += (targetY - this.camera.position.y) * s;
    this.camera.position.z += (targetZ - this.camera.position.z) * s;

    // Look at the aircraft
    (this.camera.setTarget as (pos: { x: number; y: number; z: number }) => void)(pos);
  }
}
