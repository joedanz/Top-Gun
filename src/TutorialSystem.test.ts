// ABOUTME: Tests for the tutorial system that guides new players through controls.
// ABOUTME: Validates step progression, skip functionality, and completion callbacks.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TutorialSystem, TutorialStep } from "./TutorialSystem";
import type { Aircraft } from "./Aircraft";

function makeAircraft(overrides: Partial<Aircraft> = {}): Aircraft {
  return {
    speed: 0,
    mesh: {
      position: { x: 0, y: 50, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    input: {
      pitch: 0,
      roll: 0,
      yaw: 0,
      throttle: 0,
      fire: false,
      cycleTarget: false,
      lockOn: false,
      cycleWeapon: false,
      deployCountermeasure: false,
    },
    health: 100,
    alive: true,
    ...overrides,
  } as unknown as Aircraft;
}

/** Advances tutorial to the Turn step (past throttle). */
function advanceToTurn(tutorial: TutorialSystem): void {
  tutorial.update(makeAircraft({ speed: 30 }), 0.016);
}

/** Advances tutorial to the Shoot step (past throttle and turn). */
function advanceToShoot(tutorial: TutorialSystem): void {
  advanceToTurn(tutorial);
  // First update captures initial heading (0)
  tutorial.update(makeAircraft({ speed: 30 }), 0.016);
  // Second update detects heading change
  const turned = makeAircraft({ speed: 30 });
  (turned.mesh.rotation as { y: number }).y = 1.0;
  tutorial.update(turned, 0.016);
}

/** Advances tutorial to the LockOn step (past shoot). */
function advanceToLockOn(tutorial: TutorialSystem): void {
  advanceToShoot(tutorial);
  const firing = makeAircraft({ speed: 30 });
  (firing.input as { fire: boolean }).fire = true;
  tutorial.update(firing, 0.016);
}

/** Completes the entire tutorial. */
function advanceToComplete(tutorial: TutorialSystem): void {
  advanceToLockOn(tutorial);
  const locking = makeAircraft({ speed: 30 });
  (locking.input as { lockOn: boolean }).lockOn = true;
  tutorial.update(locking, 0.016);
}

describe("TutorialSystem", () => {
  let container: HTMLElement;
  let tutorial: TutorialSystem;
  let onComplete: ReturnType<typeof vi.fn>;
  let onSpawnEnemies: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    onComplete = vi.fn();
    onSpawnEnemies = vi.fn();
    tutorial = new TutorialSystem(container, onComplete as () => void, onSpawnEnemies as () => void);
  });

  afterEach(() => {
    tutorial.dispose();
    container.remove();
  });

  it("starts at the throttle step", () => {
    expect(tutorial.currentStep).toBe(TutorialStep.Throttle);
  });

  it("shows a prompt overlay on the screen", () => {
    expect(container.querySelector("[data-tutorial]")).not.toBeNull();
  });

  it("displays throttle instructions initially", () => {
    const overlay = container.querySelector("[data-tutorial]") as HTMLElement;
    expect(overlay.textContent).toContain("Shift");
  });

  it("advances to turn step when player reaches speed threshold", () => {
    advanceToTurn(tutorial);
    expect(tutorial.currentStep).toBe(TutorialStep.Turn);
  });

  it("advances to shoot step when player turns enough", () => {
    advanceToShoot(tutorial);
    expect(tutorial.currentStep).toBe(TutorialStep.Shoot);
  });

  it("calls onSpawnEnemies when reaching shoot step", () => {
    advanceToShoot(tutorial);
    expect(onSpawnEnemies).toHaveBeenCalledOnce();
  });

  it("advances to lock-on step when player fires", () => {
    advanceToLockOn(tutorial);
    expect(tutorial.currentStep).toBe(TutorialStep.LockOn);
  });

  it("completes tutorial when player locks on", () => {
    advanceToComplete(tutorial);
    expect(tutorial.currentStep).toBe(TutorialStep.Complete);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("removes overlay when tutorial completes", () => {
    advanceToComplete(tutorial);
    expect(container.querySelector("[data-tutorial]")).toBeNull();
  });

  it("skips tutorial when skip() is called", () => {
    tutorial.skip();
    expect(tutorial.currentStep).toBe(TutorialStep.Complete);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onSpawnEnemies).toHaveBeenCalledOnce();
  });

  it("shows skip button in overlay", () => {
    const skipBtn = container.querySelector("[data-tutorial-skip]");
    expect(skipBtn).not.toBeNull();
    expect(skipBtn?.textContent).toContain("Skip");
  });

  it("dispose removes the overlay", () => {
    tutorial.dispose();
    expect(container.querySelector("[data-tutorial]")).toBeNull();
  });

  it("does not advance from throttle if speed is below threshold", () => {
    const aircraft = makeAircraft({ speed: 5 });
    tutorial.update(aircraft, 0.016);
    expect(tutorial.currentStep).toBe(TutorialStep.Throttle);
  });

  it("updates prompt text when step changes", () => {
    advanceToTurn(tutorial);
    const overlay = container.querySelector("[data-tutorial]") as HTMLElement;
    expect(overlay.textContent).toContain("WASD");
  });
});
