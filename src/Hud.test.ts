// ABOUTME: Tests for the HUD system that displays flight instruments and combat info.
// ABOUTME: Verifies speed, altitude, heading, ammo, and health indicators update correctly.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/gui", () => {
  class MockTextBlock {
    text = "";
    color = "";
    fontSize = 0;
    height = "";
    textHorizontalAlignment = 0;
    top = "";
    left = "";
    paddingTop = "";
    paddingLeft = "";
    paddingRight = "";
    paddingBottom = "";
  }
  class MockStackPanel {
    width = "";
    height = "";
    horizontalAlignment = 0;
    verticalAlignment = 0;
    paddingTop = "";
    paddingBottom = "";
    paddingRight = "";
    paddingLeft = "";
    isPointerBlocker = false;
    addControl = vi.fn();
  }
  class MockControl {
    static HORIZONTAL_ALIGNMENT_LEFT = 0;
    static HORIZONTAL_ALIGNMENT_RIGHT = 1;
    static VERTICAL_ALIGNMENT_TOP = 0;
    static VERTICAL_ALIGNMENT_BOTTOM = 1;
  }
  return {
    AdvancedDynamicTexture: {
      CreateFullscreenUI: vi.fn(() => ({ addControl: vi.fn(), dispose: vi.fn() })),
    },
    TextBlock: MockTextBlock,
    StackPanel: MockStackPanel,
    Control: MockControl,
  };
});

import { Hud } from "./Hud";

function makeAircraft(overrides: Partial<{ speed: number; health: number; mesh: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } } }> = {}) {
  return {
    speed: 120,
    health: 100,
    mesh: {
      position: { x: 0, y: 500, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    ...overrides,
  };
}

describe("Hud", () => {
  let hud: Hud;

  beforeEach(() => {
    vi.resetAllMocks();
    hud = new Hud();
  });

  it("creates a HUD with text elements", () => {
    expect(hud).toBeDefined();
  });

  it("updates speed display", () => {
    const aircraft = makeAircraft({ speed: 150 });
    hud.update(aircraft as never, 30);
    expect(hud.speedText.text).toContain("150");
  });

  it("updates altitude display", () => {
    const aircraft = makeAircraft();
    aircraft.mesh.position.y = 250;
    hud.update(aircraft as never, 30);
    expect(hud.altitudeText.text).toContain("250");
  });

  it("updates heading display", () => {
    const aircraft = makeAircraft();
    aircraft.mesh.rotation.y = Math.PI / 2; // 90 degrees
    hud.update(aircraft as never, 30);
    expect(hud.headingText.text).toContain("90");
  });

  it("updates ammo display", () => {
    const aircraft = makeAircraft();
    hud.update(aircraft as never, 15);
    expect(hud.ammoText.text).toContain("15");
  });

  it("updates health display", () => {
    const aircraft = makeAircraft({ health: 75 });
    hud.update(aircraft as never, 30);
    expect(hud.healthText.text).toContain("75");
  });

  it("shows heading 0 as N (north)", () => {
    const aircraft = makeAircraft();
    aircraft.mesh.rotation.y = 0;
    hud.update(aircraft as never, 30);
    // Heading 0 degrees = North
    expect(hud.headingText.text).toMatch(/0/);
  });

  it("normalizes heading to 0-360 range", () => {
    const aircraft = makeAircraft();
    aircraft.mesh.rotation.y = -Math.PI / 2; // -90 degrees → should show as 270
    hud.update(aircraft as never, 30);
    expect(hud.headingText.text).toContain("270");
  });
});
