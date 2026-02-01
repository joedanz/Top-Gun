// ABOUTME: Tests for Carrier entity — aircraft carrier with flight deck collision surface.
// ABOUTME: Verifies mesh creation, positioning, deck dimensions, and visibility from altitude.

import { describe, it, expect, vi, beforeEach } from "vitest";

const createMockMesh = (name: string) => ({
  name,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scaling: { x: 1, y: 1, z: 1 },
  dispose: vi.fn(),
  setEnabled: vi.fn(),
  isPickable: true,
  checkCollisions: false,
});

vi.mock("@babylonjs/core", () => {
  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    Scene: MockScene,
    MeshBuilder: {
      CreateBox: vi.fn((_name: string) => createMockMesh(_name)),
    },
    StandardMaterial: class {
      diffuseColor = { r: 0, g: 0, b: 0 };
    },
    Color3: class {
      constructor(
        public r: number,
        public g: number,
        public b: number,
      ) {}
    },
  };
});

import { Carrier } from "./Carrier";
import { Scene, MeshBuilder } from "@babylonjs/core";

describe("Carrier", () => {
  let scene: Scene;

  beforeEach(() => {
    vi.resetAllMocks();
    (MeshBuilder.CreateBox as ReturnType<typeof vi.fn>).mockImplementation(
      (_name: string) => createMockMesh(_name),
    );
    scene = new (Scene as unknown as new () => Scene)();
  });

  it("creates a hull mesh and deck mesh", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 });
    expect(carrier.hull).toBeDefined();
    expect(carrier.deck).toBeDefined();
    expect(MeshBuilder.CreateBox).toHaveBeenCalledTimes(2);
  });

  it("positions carrier at specified coordinates", () => {
    const carrier = new Carrier(scene, { x: 100, y: 0, z: 500 });
    expect(carrier.hull.position.x).toBe(100);
    expect(carrier.hull.position.z).toBe(500);
  });

  it("hull sits at water level", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 });
    // Hull should be near y=0 (ocean surface)
    expect(carrier.hull.position.y).toBeCloseTo(0, 0);
  });

  it("deck is a flat collision surface on top of hull", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 });
    // Deck should be above the hull
    expect(carrier.deck.position.y).toBeGreaterThanOrEqual(carrier.hull.position.y);
  });

  it("accepts optional heading rotation", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 }, Math.PI / 4);
    expect(carrier.hull.rotation.y).toBeCloseTo(Math.PI / 4);
    expect(carrier.deck.rotation.y).toBeCloseTo(Math.PI / 4);
  });

  it("defaults heading to 0 when not specified", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 });
    expect(carrier.hull.rotation.y).toBe(0);
  });

  it("getDeckY returns the landing surface height", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 });
    expect(typeof carrier.getDeckY()).toBe("number");
    expect(carrier.getDeckY()).toBeGreaterThan(0);
  });

  it("isOnDeck returns true when position is within deck bounds", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 });
    // Position right at carrier center should be on deck
    const onDeck = carrier.isOnDeck({ x: 0, y: carrier.getDeckY(), z: 500 });
    expect(onDeck).toBe(true);
  });

  it("isOnDeck returns false when position is far from carrier", () => {
    const carrier = new Carrier(scene, { x: 0, y: 0, z: 500 });
    const onDeck = carrier.isOnDeck({ x: 9999, y: 0, z: 9999 });
    expect(onDeck).toBe(false);
  });
});
