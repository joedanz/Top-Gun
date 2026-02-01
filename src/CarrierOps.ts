// ABOUTME: Manages carrier takeoff and landing operations with state machine.
// ABOUTME: Handles catapult launch, glideslope guidance, arresting wire trap, and bolter logic.

import type { Aircraft } from "./Aircraft";
import type { Carrier } from "./Carrier";

export enum CarrierOpsState {
  OnDeck = "on_deck",
  Launching = "launching",
  Airborne = "airborne",
  Approaching = "approaching",
  Trapped = "trapped",
  Bolter = "bolter",
}

export interface LandingGuidance {
  /** Positive = too high, negative = too low */
  glideslopeError: number;
  /** Positive = too far right, negative = too far left */
  lineupError: number;
  /** Distance to the carrier deck touchdown point */
  distance: number;
}

const CATAPULT_ACCELERATION = 120;
const LAUNCH_DURATION = 2.0;
const LAUNCH_SPEED = 80;
const APPROACH_ALTITUDE_MAX = 40;
const APPROACH_SPEED_MAX = 80;
const APPROACH_DISTANCE_MAX = 250;
const GLIDESLOPE_ANGLE = 3.5; // degrees
const TRAP_HEIGHT_TOLERANCE = 2;
const TRAP_SPEED_MAX = 80;
const TRAP_PITCH_TOLERANCE = 0.35; // radians from level
const ARRESTING_DECELERATION = 100;
const BOLTER_PASS_DISTANCE = 70;
const CRASH_SPEED_THRESHOLD = 100;
const CRASH_PITCH_THRESHOLD = 0.3; // radians steep dive past level

export class CarrierOps {
  state = CarrierOpsState.Airborne;
  landed = false;
  crashed = false;
  private launchTimer = 0;
  private carrierPos: { x: number; y: number; z: number };
  private carrierHeading: number;

  constructor(private carrier: Carrier) {
    this.carrierPos = {
      x: carrier.hull.position.x,
      y: carrier.hull.position.y,
      z: carrier.hull.position.z,
    };
    this.carrierHeading = carrier.hull.rotation.y;
  }

  startOnDeck(aircraft: Aircraft): void {
    this.state = CarrierOpsState.OnDeck;
    aircraft.speed = 0;
    aircraft.mesh.position.x = this.carrierPos.x;
    aircraft.mesh.position.y = this.carrier.getDeckY();
    aircraft.mesh.position.z = this.carrierPos.z - 30; // Aft of carrier center
    aircraft.mesh.rotation.y = this.carrierHeading;
  }

  update(aircraft: Aircraft, dt: number): void {
    switch (this.state) {
      case CarrierOpsState.OnDeck:
        this.updateOnDeck(aircraft, dt);
        break;
      case CarrierOpsState.Launching:
        this.updateLaunching(aircraft, dt);
        break;
      case CarrierOpsState.Airborne:
        this.checkApproach(aircraft);
        break;
      case CarrierOpsState.Approaching:
        this.updateApproaching(aircraft, dt);
        break;
      case CarrierOpsState.Trapped:
        this.updateTrapped(aircraft, dt);
        break;
      case CarrierOpsState.Bolter:
        this.updateBolter(aircraft);
        break;
    }
  }

  getGuidance(aircraft: Aircraft): LandingGuidance | null {
    if (this.state !== CarrierOpsState.Approaching) return null;

    const dx = aircraft.mesh.position.x - this.carrierPos.x;
    const dz = aircraft.mesh.position.z - this.carrierPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Ideal altitude based on glideslope angle and distance
    const idealAlt = this.carrier.getDeckY() +
      Math.tan((GLIDESLOPE_ANGLE * Math.PI) / 180) * distance;
    const glideslopeError = aircraft.mesh.position.y - idealAlt;

    // Lineup error: lateral offset from carrier centerline
    // For heading=0 carrier, centerline is along Z axis, so X offset is lineup error
    const lineupError = dx;

    return { glideslopeError, lineupError, distance };
  }

  private updateOnDeck(aircraft: Aircraft, _dt: number): void {
    // Hold aircraft on deck
    aircraft.speed = 0;
    aircraft.mesh.position.y = Math.max(aircraft.mesh.position.y, this.carrier.getDeckY());

    // Transition to launching when throttle is applied
    if (aircraft.input.throttle > 0) {
      this.state = CarrierOpsState.Launching;
      this.launchTimer = 0;
    }
  }

  private updateLaunching(aircraft: Aircraft, dt: number): void {
    this.launchTimer += dt;

    // Catapult acceleration
    aircraft.speed += CATAPULT_ACCELERATION * dt;
    aircraft.speed = Math.min(aircraft.speed, LAUNCH_SPEED);

    // Keep aircraft on deck during launch
    aircraft.mesh.position.y = this.carrier.getDeckY();

    if (this.launchTimer >= LAUNCH_DURATION) {
      this.state = CarrierOpsState.Airborne;
    }
  }

  private checkApproach(aircraft: Aircraft): void {
    const dx = aircraft.mesh.position.x - this.carrierPos.x;
    const dz = aircraft.mesh.position.z - this.carrierPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const altAboveDeck = aircraft.mesh.position.y - this.carrier.getDeckY();

    if (
      distance < APPROACH_DISTANCE_MAX &&
      altAboveDeck < APPROACH_ALTITUDE_MAX &&
      aircraft.speed < APPROACH_SPEED_MAX
    ) {
      this.state = CarrierOpsState.Approaching;
    }
  }

  private updateApproaching(aircraft: Aircraft, _dt: number): void {
    const onDeck = this.carrier.isOnDeck(aircraft.mesh.position);
    const altAboveDeck = aircraft.mesh.position.y - this.carrier.getDeckY();

    // Check if aircraft has touched deck
    if (onDeck && altAboveDeck <= TRAP_HEIGHT_TOLERANCE) {
      // Check approach quality
      const pitchFromLevel = Math.abs(aircraft.mesh.rotation.x - Math.PI / 2);

      if (aircraft.speed > CRASH_SPEED_THRESHOLD && pitchFromLevel > CRASH_PITCH_THRESHOLD) {
        // Hard crash
        this.crashed = true;
        aircraft.health = 0;
        aircraft.alive = false;
        this.state = CarrierOpsState.Airborne; // Reset state
        return;
      }

      if (aircraft.speed <= TRAP_SPEED_MAX && pitchFromLevel <= TRAP_PITCH_TOLERANCE) {
        // Successful trap
        this.state = CarrierOpsState.Trapped;
        this.landed = true;
        aircraft.mesh.position.y = this.carrier.getDeckY();
        return;
      }
    }

    // Check for bolter — flew past carrier without catching wire
    const dz = aircraft.mesh.position.z - this.carrierPos.z;
    if (dz > BOLTER_PASS_DISTANCE) {
      this.state = CarrierOpsState.Bolter;
    }

    // Revert to airborne if aircraft climbs away or speeds up too much
    if (altAboveDeck > APPROACH_ALTITUDE_MAX || aircraft.speed > APPROACH_SPEED_MAX * 1.5) {
      this.state = CarrierOpsState.Airborne;
    }
  }

  private updateTrapped(aircraft: Aircraft, dt: number): void {
    // Decelerate on arresting wire
    aircraft.speed -= ARRESTING_DECELERATION * dt;
    if (aircraft.speed < 0) aircraft.speed = 0;
    aircraft.mesh.position.y = this.carrier.getDeckY();
  }

  private updateBolter(aircraft: Aircraft): void {
    // Transition back to airborne once away from carrier
    const dx = aircraft.mesh.position.x - this.carrierPos.x;
    const dz = aircraft.mesh.position.z - this.carrierPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > APPROACH_DISTANCE_MAX || aircraft.mesh.position.y > this.carrier.getDeckY() + APPROACH_ALTITUDE_MAX) {
      this.state = CarrierOpsState.Airborne;
    }
  }
}
