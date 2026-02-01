// ABOUTME: Tests for Aircraft entity — verifies mesh creation and input-driven movement.
// ABOUTME: Uses mocked Babylon.js since jsdom has no WebGL.

import { describe, it, expect, vi, beforeEach } from "vitest";

const createMockMesh = (name: string) => ({
  name,
  position: { x: 0, y: 10, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scaling: { x: 1, y: 1, z: 1 },
});

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  class MockVector3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
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
      CreateCylinder: vi.fn((_name: string) => createMockMesh("aircraft")),
    },
  };
});

import { Aircraft } from "./Aircraft";
import { Scene } from "@babylonjs/core";

describe("Aircraft", () => {
  let scene: Scene;
  let mockInput: { pitch: number; roll: number; yaw: number; throttle: number };

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
    mockInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
  });

  it("creates a mesh in the scene", async () => {
    const { MeshBuilder } = await import("@babylonjs/core");
    new Aircraft(scene, mockInput);
    expect(MeshBuilder.CreateCylinder).toHaveBeenCalled();
  });

  it("owns a mesh with a position", () => {
    const aircraft = new Aircraft(scene, mockInput);
    expect(aircraft.mesh).toBeDefined();
    expect(aircraft.mesh.position).toBeDefined();
  });

  it("reads from input source, not directly from keyboard", () => {
    const aircraft = new Aircraft(scene, mockInput);
    mockInput.pitch = 1;
    aircraft.update(1 / 60);
    expect(aircraft.mesh.position.z).not.toBe(0);
  });

  it("does not move when input is zero", () => {
    const aircraft = new Aircraft(scene, mockInput);
    const initialZ = aircraft.mesh.position.z;
    aircraft.update(1 / 60);
    expect(aircraft.mesh.position.z).toBe(initialZ);
  });

  it("responds to roll input by changing x position", () => {
    const aircraft = new Aircraft(scene, mockInput);
    mockInput.roll = 1;
    aircraft.update(1 / 60);
    expect(aircraft.mesh.position.x).not.toBe(0);
  });

  it("responds to yaw input by changing y rotation", () => {
    const aircraft = new Aircraft(scene, mockInput);
    mockInput.yaw = 1;
    aircraft.update(1 / 60);
    expect(aircraft.mesh.rotation.y).not.toBe(0);
  });
});
