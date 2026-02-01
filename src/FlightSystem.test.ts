// ABOUTME: Tests for the arcade flight model system.
// ABOUTME: Validates velocity movement, speed-dependent turning, stall, and altitude floor.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  class MockVector3 {
    x: number;
    y: number;
    z: number;
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static Zero() {
      return new MockVector3(0, 0, 0);
    }
  }

  return {
    Scene: MockScene,
    Vector3: MockVector3,
    MeshBuilder: {
      CreateCylinder: vi.fn(() => ({
        name: "aircraft",
        position: new MockVector3(0, 50, 0),
        rotation: new MockVector3(Math.PI / 2, 0, 0),
        scaling: { x: 1, y: 1, z: 1 },
      })),
    },
  };
});

import { Aircraft } from "./Aircraft";
import { FlightSystem, type FlightParams } from "./FlightSystem";
import { Scene } from "@babylonjs/core";
import type { FlightInput } from "./InputManager";

function makeInput(overrides: Partial<FlightInput> = {}): FlightInput {
  return { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: false, lockOn: false, ...overrides };
}

function makeScene(): Scene {
  return new (Scene as unknown as new () => Scene)();
}

describe("FlightSystem", () => {
  let system: FlightSystem;
  let aircraft: Aircraft;
  let input: FlightInput & { pitch: number; roll: number; yaw: number; throttle: number };

  beforeEach(() => {
    vi.resetAllMocks();
    input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: false, lockOn: false };
    aircraft = new Aircraft(makeScene(), input);
    system = new FlightSystem();
  });

  it("moves aircraft forward based on its speed", () => {
    aircraft.speed = 50;
    const startZ = aircraft.mesh.position.z;
    system.update(aircraft, 1 / 60);
    expect(aircraft.mesh.position.z).not.toBe(startZ);
  });

  it("accelerates when throttle is positive", () => {
    input.throttle = 1;
    const startSpeed = aircraft.speed;
    system.update(aircraft, 1 / 60);
    expect(aircraft.speed).toBeGreaterThan(startSpeed);
  });

  it("decelerates when throttle is negative", () => {
    aircraft.speed = 100;
    input.throttle = -1;
    system.update(aircraft, 1 / 60);
    expect(aircraft.speed).toBeLessThan(100);
  });

  it("does not allow speed below zero", () => {
    aircraft.speed = 0;
    input.throttle = -1;
    system.update(aircraft, 1 / 60);
    expect(aircraft.speed).toBeGreaterThanOrEqual(0);
  });

  it("does not exceed max speed", () => {
    aircraft.speed = 999;
    input.throttle = 1;
    system.update(aircraft, 1 / 60);
    expect(aircraft.speed).toBeLessThanOrEqual(system.params.maxSpeed);
  });

  it("turns based on pitch and roll input", () => {
    aircraft.speed = 50;
    input.pitch = 1;
    const startRotX = aircraft.mesh.rotation.x;
    system.update(aircraft, 1 / 60);
    expect(aircraft.mesh.rotation.x).not.toBe(startRotX);
  });

  it("turn rate is reduced at higher speed", () => {
    // At low speed, same input should produce more rotation than at high speed
    const aircraftSlow = new Aircraft(makeScene(), makeInput({ pitch: 1 }));
    const aircraftFast = new Aircraft(makeScene(), makeInput({ pitch: 1 }));
    aircraftSlow.speed = 30;
    aircraftFast.speed = 150;

    const systemA = new FlightSystem();
    const systemB = new FlightSystem();

    const startRotSlow = aircraftSlow.mesh.rotation.x;
    const startRotFast = aircraftFast.mesh.rotation.x;

    systemA.update(aircraftSlow, 1 / 60);
    systemB.update(aircraftFast, 1 / 60);

    const deltaSlow = Math.abs(aircraftSlow.mesh.rotation.x - startRotSlow);
    const deltaFast = Math.abs(aircraftFast.mesh.rotation.x - startRotFast);

    expect(deltaSlow).toBeGreaterThan(deltaFast);
  });

  it("stalls when speed is below threshold — nose drops", () => {
    aircraft.speed = 5; // Well below stall threshold
    const startRotX = aircraft.mesh.rotation.x;
    system.update(aircraft, 0.1);
    // Nose should drop (pitch rotation increases — nose down)
    expect(aircraft.mesh.rotation.x).toBeGreaterThan(startRotX);
  });

  it("speed recovers during stall as aircraft dives", () => {
    aircraft.speed = 5;
    // Simulate several frames of stall
    for (let i = 0; i < 60; i++) {
      system.update(aircraft, 1 / 60);
    }
    expect(aircraft.speed).toBeGreaterThan(5);
  });

  it("altitude floor prevents going underground", () => {
    aircraft.speed = 50;
    aircraft.mesh.position.y = 0.5; // Near ground
    aircraft.mesh.rotation.x = 1; // Nose down (diving)
    system.update(aircraft, 1 / 60);
    expect(aircraft.mesh.position.y).toBeGreaterThanOrEqual(system.params.altitudeFloor);
  });

  it("exposes tunable parameters", () => {
    const params = system.params;
    expect(params.maxSpeed).toBeDefined();
    expect(params.turnRate).toBeDefined();
    expect(params.acceleration).toBeDefined();
    expect(params.stallThreshold).toBeDefined();
    expect(params.altitudeFloor).toBeDefined();
  });

  it("allows overriding flight parameters", () => {
    const custom: Partial<FlightParams> = { maxSpeed: 500, turnRate: 5 };
    const customSystem = new FlightSystem(custom);
    expect(customSystem.params.maxSpeed).toBe(500);
    expect(customSystem.params.turnRate).toBe(5);
  });

  it("uses per-aircraft flightParams when set on the aircraft", () => {
    const fastParams: FlightParams = {
      maxSpeed: 300,
      acceleration: 60,
      deceleration: 30,
      turnRate: 1.5,
      stallThreshold: 25,
      stallNoseDrop: 0.8,
      stallSpeedRecovery: 15,
      altitudeFloor: 2,
    };
    aircraft.flightParams = fastParams;
    input.throttle = 1;
    system.update(aircraft, 1);
    // Should use aircraft's maxSpeed (300), not system default (200)
    expect(aircraft.speed).toBeLessThanOrEqual(300);
    expect(aircraft.speed).toBeGreaterThan(0);
  });

  it("uses different params for different aircraft in same system", () => {
    const slowInput = makeInput({ throttle: 1 });
    const fastInput = makeInput({ throttle: 1 });
    const slowCraft = new Aircraft(makeScene(), slowInput);
    const fastCraft = new Aircraft(makeScene(), fastInput);

    slowCraft.flightParams = {
      maxSpeed: 100, acceleration: 20, deceleration: 20,
      turnRate: 3.0, stallThreshold: 15, stallNoseDrop: 0.6,
      stallSpeedRecovery: 12, altitudeFloor: 2,
    };
    fastCraft.flightParams = {
      maxSpeed: 300, acceleration: 60, deceleration: 30,
      turnRate: 1.5, stallThreshold: 25, stallNoseDrop: 0.8,
      stallSpeedRecovery: 15, altitudeFloor: 2,
    };

    system.update(slowCraft, 1);
    system.update(fastCraft, 1);

    // Fast aircraft should have accelerated more
    expect(fastCraft.speed).toBeGreaterThan(slowCraft.speed);
  });
});
