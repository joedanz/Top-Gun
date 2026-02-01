// ABOUTME: Tests for the third-person camera system.
// ABOUTME: Validates positioning, smooth interpolation, and speed-dependent distance.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/core", () => {
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

  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  class MockFreeCamera {
    name: string;
    position: MockVector3;
    _scene: MockScene;
    setTarget = vi.fn();
    attachControl = vi.fn();
    constructor(name: string, position: MockVector3, scene: MockScene) {
      this.name = name;
      this.position = new MockVector3(position.x, position.y, position.z);
      this._scene = scene;
    }
  }

  return {
    Scene: MockScene,
    Vector3: MockVector3,
    FreeCamera: MockFreeCamera,
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
import { CameraSystem } from "./CameraSystem";
import { Scene, FreeCamera, Vector3 } from "@babylonjs/core";
import type { FlightInput } from "./InputManager";

function makeScene(): Scene {
  return new (Scene as unknown as new () => Scene)();
}

function makeCamera(scene: Scene): FreeCamera {
  const Cam = FreeCamera as unknown as new (name: string, pos: Vector3, scene: Scene) => FreeCamera;
  return new Cam("camera", new (Vector3 as unknown as new (x: number, y: number, z: number) => Vector3)(0, 0, 0), scene);
}

function makeInput(): FlightInput {
  return { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false, cycleTarget: false, lockOn: false };
}

describe("CameraSystem", () => {
  let system: CameraSystem;
  let camera: FreeCamera;
  let aircraft: Aircraft;
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = makeScene();
    camera = makeCamera(scene);
    aircraft = new Aircraft(scene, makeInput());
    system = new CameraSystem(camera);
  });

  it("positions camera behind and above the aircraft", () => {
    // Aircraft at y=50, facing forward (rotation.y=0 means +Z direction)
    // After multiple updates to converge, camera should be behind (-Z) and above
    for (let i = 0; i < 120; i++) {
      system.update(aircraft, 1 / 60);
    }

    expect(camera.position.y).toBeGreaterThan(aircraft.mesh.position.y);
    expect(camera.position.z).toBeLessThan(aircraft.mesh.position.z);
  });

  it("smoothly interpolates camera position (no snapping)", () => {
    // Place camera far from target; a single update should NOT snap to final position
    camera.position.x = 1000;
    camera.position.y = 1000;
    camera.position.z = 1000;

    system.update(aircraft, 1 / 60);

    // Camera should have moved but not all the way to the target
    expect(camera.position.x).toBeLessThan(1000);
    expect(camera.position.x).not.toBe(0);
  });

  it("pulls camera back at high speed", () => {
    // Update several frames at zero speed to let camera converge
    aircraft.speed = 0;
    for (let i = 0; i < 120; i++) {
      system.update(aircraft, 1 / 60);
    }
    const distLowSpeed = Math.sqrt(
      (camera.position.x - aircraft.mesh.position.x) ** 2 +
      (camera.position.y - aircraft.mesh.position.y) ** 2 +
      (camera.position.z - aircraft.mesh.position.z) ** 2,
    );

    // Reset and converge at high speed
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;
    aircraft.speed = 200;
    for (let i = 0; i < 120; i++) {
      system.update(aircraft, 1 / 60);
    }
    const distHighSpeed = Math.sqrt(
      (camera.position.x - aircraft.mesh.position.x) ** 2 +
      (camera.position.y - aircraft.mesh.position.y) ** 2 +
      (camera.position.z - aircraft.mesh.position.z) ** 2,
    );

    expect(distHighSpeed).toBeGreaterThan(distLowSpeed);
  });

  it("tightens camera at low speed", () => {
    // At zero speed, camera should be closer than at max speed
    aircraft.speed = 0;
    for (let i = 0; i < 120; i++) {
      system.update(aircraft, 1 / 60);
    }
    const distZero = Math.sqrt(
      (camera.position.x - aircraft.mesh.position.x) ** 2 +
      (camera.position.y - aircraft.mesh.position.y) ** 2 +
      (camera.position.z - aircraft.mesh.position.z) ** 2,
    );

    // Should be close to the base distance, not expanded
    expect(distZero).toBeGreaterThan(0);
    expect(distZero).toBeLessThan(30); // base offset should be modest
  });

  it("follows aircraft heading when aircraft turns", () => {
    // Face aircraft to the right (rotation.y = PI/2)
    aircraft.mesh.rotation.y = Math.PI / 2;
    for (let i = 0; i < 120; i++) {
      system.update(aircraft, 1 / 60);
    }

    // Camera should be behind in the -X direction (behind relative to +X heading)
    expect(camera.position.x).toBeLessThan(aircraft.mesh.position.x);
  });
});
