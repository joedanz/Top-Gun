// ABOUTME: Tests for Aircraft entity — verifies mesh creation and state initialization.
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
  let mockInput: { pitch: number; roll: number; yaw: number; throttle: number; fire: boolean };

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
    mockInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0, fire: false };
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

  it("starts with zero speed", () => {
    const aircraft = new Aircraft(scene, mockInput);
    expect(aircraft.speed).toBe(0);
  });

  it("exposes input as a readable property", () => {
    const aircraft = new Aircraft(scene, mockInput);
    expect(aircraft.input).toBe(mockInput);
  });

  it("starts with 100 health", () => {
    const aircraft = new Aircraft(scene, mockInput);
    expect(aircraft.health).toBe(100);
  });

  it("starts alive", () => {
    const aircraft = new Aircraft(scene, mockInput);
    expect(aircraft.alive).toBe(true);
  });
});
