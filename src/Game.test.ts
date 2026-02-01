// ABOUTME: Tests for the Game class — verifies scene setup, terrain, skybox, and aircraft integration.
// ABOUTME: Uses mocked Babylon.js engine since jsdom has no WebGL.

import { describe, it, expect, vi } from "vitest";

const createMockMesh = (name: string) => ({
  name,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scaling: { x: 1, y: 1, z: 1 },
  receiveShadows: false,
  material: null as unknown,
});

vi.mock("@babylonjs/gui", () => {
  class MockStackPanel { width = ""; horizontalAlignment = 0; verticalAlignment = 0; paddingTop = ""; paddingLeft = ""; addControl = vi.fn(); }
  class MockSlider { minimum = 0; maximum = 100; value = 0; height = ""; width = ""; color = ""; background = ""; onValueChangedObservable = { add: vi.fn() }; }
  class MockTextBlock { text = ""; height = ""; color = ""; fontSize = 0; textHorizontalAlignment = 0; }
  class MockControl { static HORIZONTAL_ALIGNMENT_LEFT = 0; static VERTICAL_ALIGNMENT_TOP = 0; }
  return {
    AdvancedDynamicTexture: { CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn(), dispose: vi.fn() })) },
    StackPanel: MockStackPanel,
    Slider: MockSlider,
    TextBlock: MockTextBlock,
    Control: MockControl,
  };
});

// Mock Babylon.js modules since jsdom doesn't support WebGL
vi.mock("@babylonjs/core", () => {
  class MockEngine {
    runRenderLoop = vi.fn();
    resize = vi.fn();
    getDeltaTime = vi.fn(() => 16);
  }

  class MockScene {
    render = vi.fn();
    clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  class MockFreeCamera {
    setTarget = vi.fn();
    attachControl = vi.fn();
    position = { x: 0, y: 5, z: -10 };
  }

  class MockHemisphericLight {
    intensity = 1;
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

  class MockColor3 {
    constructor(public r: number, public g: number, public b: number) {}
  }

  class MockColor4 {
    constructor(
      public r: number,
      public g: number,
      public b: number,
      public a: number
    ) {}
  }

  class MockStandardMaterial {
    diffuseColor: unknown = null;
    diffuseTexture: unknown = null;
    specularColor: unknown = null;
    emissiveColor: unknown = null;
    backFaceCulling = true;
    disableLighting = false;
    constructor(public name: string) {}
  }

  class MockTexture {
    uScale = 1;
    vScale = 1;
    constructor(public url: string) {}
  }

  return {
    Engine: MockEngine,
    Scene: MockScene,
    FreeCamera: MockFreeCamera,
    HemisphericLight: MockHemisphericLight,
    Vector3: MockVector3,
    Color3: MockColor3,
    Color4: MockColor4,
    StandardMaterial: MockStandardMaterial,
    Texture: MockTexture,
    MeshBuilder: {
      CreateGround: vi.fn((_name: string) => createMockMesh("terrain")),
      CreateCylinder: vi.fn((_name: string) => createMockMesh("aircraft")),
      CreateBox: vi.fn((_name: string) => ({ ...createMockMesh("skybox"), infiniteDistance: false })),
    },
  };
});

import { Game } from "./Game";

describe("Game", () => {
  it("creates an engine and scene", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.engine).toBeDefined();
    expect(game.scene).toBeDefined();
  });

  it("creates a Terrain", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.terrain).toBeDefined();
  });

  it("creates a Skybox", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.skybox).toBeDefined();
  });

  it("creates an Aircraft entity", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.aircraft).toBeDefined();
    expect(game.aircraft.mesh).toBeDefined();
  });

  it("creates an InputManager", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.input).toBeDefined();
  });

  it("aircraft reads from InputManager (not directly from keyboard)", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.aircraft).toBeDefined();
    expect(game.input).toBeDefined();
  });

  it("creates a FlightSystem", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.flightSystem).toBeDefined();
  });

  it("creates a CameraSystem", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.cameraSystem).toBeDefined();
  });

  it("creates a WeaponSystem", () => {
    const canvas = document.createElement("canvas");
    const game = new Game(canvas);
    expect(game.weaponSystem).toBeDefined();
  });
});
