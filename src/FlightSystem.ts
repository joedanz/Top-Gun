// ABOUTME: Applies arcade flight physics to Aircraft entities.
// ABOUTME: Handles velocity, speed-dependent turning, stall recovery, and altitude floor.

import type { Aircraft } from "./Aircraft";

export interface FlightParams {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  turnRate: number;
  stallThreshold: number;
  stallNoseDrop: number;
  stallSpeedRecovery: number;
  altitudeFloor: number;
}

const DEFAULT_PARAMS: FlightParams = {
  maxSpeed: 200,
  acceleration: 40,
  deceleration: 30,
  turnRate: 2.0,
  stallThreshold: 20,
  stallNoseDrop: 0.8,
  stallSpeedRecovery: 15,
  altitudeFloor: 2,
};

export class FlightSystem {
  params: FlightParams;

  constructor(overrides: Partial<FlightParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...overrides };
  }

  update(aircraft: Aircraft, dt: number): void {
    if (!aircraft.alive) return;

    const { input } = aircraft;
    const p = aircraft.flightParams ?? this.params;

    // Throttle → speed
    if (input.throttle > 0) {
      aircraft.speed += p.acceleration * input.throttle * dt;
    } else if (input.throttle < 0) {
      aircraft.speed += p.deceleration * input.throttle * dt;
    }
    aircraft.speed = Math.max(0, Math.min(p.maxSpeed, aircraft.speed));

    // Speed-dependent turn rate: full rate at low speed, reduced at high speed
    const speedFactor = 1 - (aircraft.speed / p.maxSpeed) * 0.7;
    const effectiveTurn = p.turnRate * speedFactor;

    aircraft.mesh.rotation.x += input.pitch * effectiveTurn * dt;
    aircraft.mesh.rotation.z += input.roll * effectiveTurn * dt;
    aircraft.mesh.rotation.y += input.yaw * effectiveTurn * dt;

    // Stall: nose drops and speed recovers when below threshold
    if (aircraft.speed < p.stallThreshold) {
      aircraft.mesh.rotation.x += p.stallNoseDrop * dt;
      aircraft.speed += p.stallSpeedRecovery * dt;
      aircraft.speed = Math.min(aircraft.speed, p.maxSpeed);
    }

    // Move forward along the aircraft's facing direction
    const rot = aircraft.mesh.rotation;
    aircraft.mesh.position.x += Math.sin(rot.y) * aircraft.speed * dt;
    aircraft.mesh.position.z += Math.cos(rot.y) * aircraft.speed * dt;
    aircraft.mesh.position.y -= Math.sin(rot.x - Math.PI / 2) * aircraft.speed * dt;

    // Altitude floor
    if (aircraft.mesh.position.y < p.altitudeFloor) {
      aircraft.mesh.position.y = p.altitudeFloor;
    }
  }
}
