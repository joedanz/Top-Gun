// ABOUTME: Tests for CarrierOps system — catapult takeoff and arrested landing.
// ABOUTME: Validates state transitions, glideslope guidance, and bolter/trap logic.

import { describe, it, expect, beforeEach } from "vitest";
import { CarrierOps, CarrierOpsState } from "./CarrierOps";
import type { Carrier } from "./Carrier";
import type { Aircraft } from "./Aircraft";
import type { FlightInput } from "./InputManager";

function makeInput(overrides: Partial<FlightInput> = {}): FlightInput {
  return {
    pitch: 0, roll: 0, yaw: 0, throttle: 0,
    fire: false, cycleTarget: false, lockOn: false,
    cycleWeapon: false, deployCountermeasure: false,
    ...overrides,
  };
}

function makeMockCarrier(pos = { x: 0, y: 0, z: -200 }, heading = 0): Carrier {
  return {
    hull: { position: { x: pos.x, y: pos.y, z: pos.z }, rotation: { y: heading } },
    deck: { position: { x: pos.x, y: pos.y + 4, z: pos.z }, rotation: { y: heading } },
    getDeckY: () => pos.y + 4.25,
    isOnDeck: (p: { x: number; y: number; z: number }) => {
      return Math.abs(p.x - pos.x) <= 12 && Math.abs(p.z - pos.z) <= 65;
    },
  } as unknown as Carrier;
}

function makeMockAircraft(input?: FlightInput): Aircraft {
  return {
    mesh: {
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
    },
    speed: 0,
    health: 100,
    alive: true,
    input: input ?? makeInput(),
    flightParams: undefined,
  } as unknown as Aircraft;
}

describe("CarrierOps", () => {
  let ops: CarrierOps;
  let carrier: Carrier;
  let aircraft: Aircraft;

  beforeEach(() => {
    carrier = makeMockCarrier();
    aircraft = makeMockAircraft();
    ops = new CarrierOps(carrier);
  });

  describe("initial state", () => {
    it("starts in Airborne state by default", () => {
      expect(ops.state).toBe(CarrierOpsState.Airborne);
    });

    it("starts on deck when startOnDeck is called", () => {
      ops.startOnDeck(aircraft);
      expect(ops.state).toBe(CarrierOpsState.OnDeck);
      expect(aircraft.speed).toBe(0);
    });
  });

  describe("catapult takeoff", () => {
    it("transitions from OnDeck to Launching when throttle is applied", () => {
      ops.startOnDeck(aircraft);
      const input = makeInput({ throttle: 1 });
      (aircraft as { input: FlightInput }).input = input;
      ops.update(aircraft, 0.016);
      expect(ops.state).toBe(CarrierOpsState.Launching);
    });

    it("accelerates aircraft during launch", () => {
      ops.startOnDeck(aircraft);
      const input = makeInput({ throttle: 1 });
      (aircraft as { input: FlightInput }).input = input;
      ops.update(aircraft, 0.016);
      // Keep updating during launch
      for (let i = 0; i < 60; i++) {
        ops.update(aircraft, 0.016);
      }
      expect(aircraft.speed).toBeGreaterThan(0);
    });

    it("transitions to Airborne after launch completes", () => {
      ops.startOnDeck(aircraft);
      const input = makeInput({ throttle: 1 });
      (aircraft as { input: FlightInput }).input = input;
      // Simulate enough time for launch to complete (~2 seconds)
      for (let i = 0; i < 150; i++) {
        ops.update(aircraft, 0.016);
      }
      expect(ops.state).toBe(CarrierOpsState.Airborne);
    });

    it("positions aircraft on deck during OnDeck state", () => {
      ops.startOnDeck(aircraft);
      expect(aircraft.mesh.position.y).toBeCloseTo(carrier.getDeckY(), 0);
    });
  });

  describe("landing approach", () => {
    it("transitions to Approaching when aircraft is low, slow, and near carrier", () => {
      aircraft.mesh.position.y = 20;
      aircraft.mesh.position.z = -350; // Behind the carrier
      aircraft.speed = 40;
      aircraft.mesh.rotation.y = 0; // Heading toward carrier (along +Z)
      ops.update(aircraft, 0.016);
      expect(ops.state).toBe(CarrierOpsState.Approaching);
    });

    it("provides glideslope guidance data", () => {
      aircraft.mesh.position.y = 20;
      aircraft.mesh.position.z = -350;
      aircraft.speed = 40;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016);
      const guidance = ops.getGuidance(aircraft);
      expect(guidance).not.toBeNull();
      expect(guidance!.glideslopeError).toBeDefined();
      expect(guidance!.lineupError).toBeDefined();
    });

    it("glideslope error is negative when too low", () => {
      aircraft.mesh.position.y = 5;
      aircraft.mesh.position.z = -350;
      aircraft.speed = 40;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016);
      const guidance = ops.getGuidance(aircraft);
      expect(guidance!.glideslopeError).toBeLessThan(0);
    });

    it("glideslope error is positive when too high", () => {
      aircraft.mesh.position.y = 35; // High but within approach altitude limit
      aircraft.mesh.position.z = -350;
      aircraft.speed = 40;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016);
      const guidance = ops.getGuidance(aircraft);
      expect(guidance!.glideslopeError).toBeGreaterThan(0);
    });

    it("lineup error is zero when aligned with carrier centerline", () => {
      aircraft.mesh.position.x = 0; // Carrier is at x=0
      aircraft.mesh.position.y = 20;
      aircraft.mesh.position.z = -350;
      aircraft.speed = 40;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016);
      const guidance = ops.getGuidance(aircraft);
      expect(guidance!.lineupError).toBeCloseTo(0, 0);
    });
  });

  describe("arrested landing (trap)", () => {
    it("traps when aircraft touches deck within tolerance", () => {
      aircraft.mesh.position.x = 0;
      aircraft.mesh.position.y = carrier.getDeckY() + 0.5;
      aircraft.mesh.position.z = -200; // On the carrier
      aircraft.speed = 50;
      aircraft.mesh.rotation.y = 0;
      // First get into approach state
      ops.update(aircraft, 0.016);

      // Now simulate touching the deck
      aircraft.mesh.position.y = carrier.getDeckY();
      ops.update(aircraft, 0.016);
      expect(ops.state).toBe(CarrierOpsState.Trapped);
    });

    it("decelerates aircraft after trap", () => {
      // Put aircraft on deck
      aircraft.mesh.position.x = 0;
      aircraft.mesh.position.y = carrier.getDeckY();
      aircraft.mesh.position.z = -200;
      aircraft.speed = 50;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016); // Approach
      ops.update(aircraft, 0.016); // Touch down → trap
      const initialSpeed = aircraft.speed;
      // Continue updating - should decelerate
      for (let i = 0; i < 30; i++) {
        ops.update(aircraft, 0.016);
      }
      expect(aircraft.speed).toBeLessThan(initialSpeed);
    });

    it("reports landed=true after successful trap", () => {
      aircraft.mesh.position.x = 0;
      aircraft.mesh.position.y = carrier.getDeckY();
      aircraft.mesh.position.z = -200;
      aircraft.speed = 50;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016);
      ops.update(aircraft, 0.016);
      expect(ops.landed).toBe(true);
    });
  });

  describe("bolter (missed landing)", () => {
    it("bolters when aircraft flies past deck without catching wire", () => {
      // Enter approach state first (must be within speed/altitude/distance limits)
      aircraft.mesh.position.x = 0;
      aircraft.mesh.position.y = carrier.getDeckY() + 10;
      aircraft.mesh.position.z = -350;
      aircraft.speed = 60;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016); // → Approaching
      expect(ops.state).toBe(CarrierOpsState.Approaching);
      // Fly past the carrier (z > carrier.z + BOLTER_PASS_DISTANCE)
      aircraft.mesh.position.z = -200 + 71; // carrier at z=-200, pass distance=70
      ops.update(aircraft, 0.016);
      expect(ops.state).toBe(CarrierOpsState.Bolter);
    });

    it("transitions back to Airborne after bolter", () => {
      aircraft.mesh.position.x = 0;
      aircraft.mesh.position.y = carrier.getDeckY() + 10;
      aircraft.mesh.position.z = -350;
      aircraft.speed = 60;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016); // → Approaching
      aircraft.mesh.position.z = -200 + 71; // Past carrier
      ops.update(aircraft, 0.016); // → Bolter
      expect(ops.state).toBe(CarrierOpsState.Bolter);
      // Move away from carrier
      aircraft.mesh.position.y = 60;
      aircraft.mesh.position.z = 200;
      ops.update(aircraft, 0.016);
      expect(ops.state).toBe(CarrierOpsState.Airborne);
    });
  });

  describe("crash on bad approach", () => {
    it("aircraft is destroyed if it hits the deck too hard (steep angle + fast)", () => {
      // Enter approach state first
      aircraft.mesh.position.x = 0;
      aircraft.mesh.position.y = carrier.getDeckY() + 10;
      aircraft.mesh.position.z = -350;
      aircraft.speed = 70;
      aircraft.mesh.rotation.y = 0;
      ops.update(aircraft, 0.016); // → Approaching
      expect(ops.state).toBe(CarrierOpsState.Approaching);
      // Now simulate touching deck with crash conditions
      aircraft.mesh.position.z = -200;
      aircraft.mesh.position.y = carrier.getDeckY();
      aircraft.speed = 150; // Way too fast (> CRASH_SPEED_THRESHOLD)
      aircraft.mesh.rotation.x = Math.PI / 2 + 0.5; // Steep dive (> CRASH_PITCH_THRESHOLD)
      ops.update(aircraft, 0.016);
      expect(ops.crashed).toBe(true);
      expect(aircraft.alive).toBe(false);
    });
  });

  describe("deck height enforcement", () => {
    it("prevents aircraft from falling through deck when on deck", () => {
      ops.startOnDeck(aircraft);
      aircraft.mesh.position.y = carrier.getDeckY() - 5; // Below deck
      ops.update(aircraft, 0.016);
      expect(aircraft.mesh.position.y).toBeGreaterThanOrEqual(carrier.getDeckY());
    });
  });
});
