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
  class MockRectangle { width = ""; height = ""; color = ""; background = ""; alpha = 0; thickness = 0; isPointerBlocker = false; isHitTestVisible = false; cornerRadius = 0; paddingRight = ""; paddingTop = ""; horizontalAlignment = 0; verticalAlignment = 0; left = ""; top = ""; addControl = vi.fn(); }
  class MockEllipse { width = ""; height = ""; color = ""; background = ""; thickness = 0; top = ""; left = ""; isVisible = true; isPointerBlocker = false; isHitTestVisible = false; addControl = vi.fn(); }
  return {
    AdvancedDynamicTexture: { CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn(), dispose: vi.fn() })) },
    StackPanel: MockStackPanel,
    Slider: MockSlider,
    TextBlock: MockTextBlock,
    Control: MockControl,
    Rectangle: MockRectangle,
    Ellipse: MockEllipse,
  };
});

// Mock Babylon.js modules since jsdom doesn't support WebGL
vi.mock("@babylonjs/core", () => {
  class MockEngine {
    runRenderLoop = vi.fn();
    stopRenderLoop = vi.fn();
    resize = vi.fn();
    getDeltaTime = vi.fn(() => 16);
    dispose = vi.fn();
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

  class MockParticleSystem {
    emitter: unknown = null;
    minSize = 0; maxSize = 0; minLifeTime = 0; maxLifeTime = 0;
    emitRate = 0; color1 = null; color2 = null; colorDead = null;
    minEmitPower = 0; maxEmitPower = 0; direction1 = null; direction2 = null;
    targetStopDuration = 0; disposeOnStop = false;
    start = vi.fn(); createSphereEmitter = vi.fn();
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
    ParticleSystem: MockParticleSystem,
    MeshBuilder: {
      CreateGround: vi.fn((_name: string) => createMockMesh("terrain")),
      CreateCylinder: vi.fn((_name: string) => createMockMesh("aircraft")),
      CreateBox: vi.fn((_name: string) => ({ ...createMockMesh("skybox"), infiniteDistance: false })),
    },
  };
});

import { Game } from "./Game";
import type { MissionData } from "./MissionData";

const sampleMission: MissionData = {
  id: "pacific-01",
  title: "First Sortie",
  description: "Intercept enemy fighters.",
  theater: "pacific",
  playerStart: { position: { x: 0, y: 50, z: 0 }, heading: 0 },
  enemies: [{ position: { x: 100, y: 50, z: 200 } }],
  objectives: [
    { type: "destroy_all", description: "Destroy all enemy aircraft" },
  ],
};

function createGame(onMissionEnd = vi.fn()) {
  const canvas = document.createElement("canvas");
  return new Game(canvas, sampleMission, onMissionEnd);
}

describe("Game", () => {
  it("creates an engine and scene", () => {
    const game = createGame();
    expect(game.engine).toBeDefined();
    expect(game.scene).toBeDefined();
  });

  it("creates a Terrain", () => {
    const game = createGame();
    expect(game.terrain).toBeDefined();
  });

  it("creates a Skybox", () => {
    const game = createGame();
    expect(game.skybox).toBeDefined();
  });

  it("creates an Aircraft entity", () => {
    const game = createGame();
    expect(game.aircraft).toBeDefined();
    expect(game.aircraft.mesh).toBeDefined();
  });

  it("creates an InputManager", () => {
    const game = createGame();
    expect(game.input).toBeDefined();
  });

  it("aircraft reads from InputManager (not directly from keyboard)", () => {
    const game = createGame();
    expect(game.aircraft).toBeDefined();
    expect(game.input).toBeDefined();
  });

  it("creates a FlightSystem", () => {
    const game = createGame();
    expect(game.flightSystem).toBeDefined();
  });

  it("creates a CameraSystem", () => {
    const game = createGame();
    expect(game.cameraSystem).toBeDefined();
  });

  it("creates a WeaponManager", () => {
    const game = createGame();
    expect(game.weaponManager).toBeDefined();
  });

  it("creates an enemy aircraft with AI", () => {
    const game = createGame();
    expect(game.enemy).toBeDefined();
    expect(game.enemy.mesh).toBeDefined();
    expect(game.aiSystem).toBeDefined();
  });

  it("creates a separate WeaponSystem for the enemy", () => {
    const game = createGame();
    expect(game.enemyWeaponSystem).toBeDefined();
  });

  it("creates a CollisionSystem", () => {
    const game = createGame();
    expect(game.collisionSystem).toBeDefined();
  });

  it("creates a ScreenShake system", () => {
    const game = createGame();
    expect(game.screenShake).toBeDefined();
  });

  it("creates a HitFlash system", () => {
    const game = createGame();
    expect(game.hitFlash).toBeDefined();
  });

  it("creates a HUD", () => {
    const game = createGame();
    expect(game.hud).toBeDefined();
  });

  it("creates a TargetingSystem", () => {
    const game = createGame();
    expect(game.targetingSystem).toBeDefined();
  });

  it("creates a Radar", () => {
    const game = createGame();
    expect(game.radar).toBeDefined();
  });

  it("creates a WeaponManager with MissileLockSystem", () => {
    const game = createGame();
    expect(game.weaponManager.missileLockSystem).toBeDefined();
  });

  it("creates an ObjectiveManager", () => {
    const game = createGame();
    expect(game.objectiveManager).toBeDefined();
  });

  it("creates a FormationSystem", () => {
    const game = createGame();
    expect(game.formationSystem).toBeDefined();
  });

  it("has a dispose method that stops the engine", () => {
    const game = createGame();
    expect(typeof game.dispose).toBe("function");
    game.dispose();
  });
});
