// ABOUTME: Tests for InputManager — verifies keyboard state tracking and semantic input axes.
// ABOUTME: Ensures WASD maps to pitch/roll, QE to yaw, Shift/Ctrl to throttle.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InputManager } from "./InputManager";

describe("InputManager", () => {
  let input: InputManager;

  beforeEach(() => {
    input = new InputManager();
  });

  afterEach(() => {
    input.dispose();
  });

  it("reports zero for all axes when no keys are pressed", () => {
    expect(input.pitch).toBe(0);
    expect(input.roll).toBe(0);
    expect(input.yaw).toBe(0);
    expect(input.throttle).toBe(0);
    expect(input.fire).toBe(false);
  });

  it("reports positive pitch when W is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    expect(input.pitch).toBe(1);
  });

  it("reports negative pitch when S is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(input.pitch).toBe(-1);
  });

  it("reports negative roll when A is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(input.roll).toBe(-1);
  });

  it("reports positive roll when D is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    expect(input.roll).toBe(1);
  });

  it("reports negative yaw when Q is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    expect(input.yaw).toBe(-1);
  });

  it("reports positive yaw when E is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }));
    expect(input.yaw).toBe(1);
  });

  it("reports positive throttle when Shift is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
    expect(input.throttle).toBe(1);
  });

  it("reports negative throttle when Control is pressed", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    expect(input.throttle).toBe(-1);
  });

  it("resets axis when key is released", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    expect(input.pitch).toBe(1);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }));
    expect(input.pitch).toBe(0);
  });

  it("cancels opposing keys (W+S = 0 pitch)", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(input.pitch).toBe(0);
  });

  it("reports fire when Space is pressed", () => {
    expect(input.fire).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(input.fire).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));
    expect(input.fire).toBe(false);
  });

  it("reports cycleTarget when Tab is pressed", () => {
    expect(input.cycleTarget).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(input.cycleTarget).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "Tab" }));
    expect(input.cycleTarget).toBe(false);
  });

  it("reports lockOn when R is pressed", () => {
    expect(input.lockOn).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(input.lockOn).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "r" }));
    expect(input.lockOn).toBe(false);
  });

  it("reports cycleWeapon when X is pressed", () => {
    expect(input.cycleWeapon).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
    expect(input.cycleWeapon).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "x" }));
    expect(input.cycleWeapon).toBe(false);
  });

  it("reports deployCountermeasure when F is pressed", () => {
    expect(input.deployCountermeasure).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" }));
    expect(input.deployCountermeasure).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "f" }));
    expect(input.deployCountermeasure).toBe(false);
  });

  it("stops listening after dispose", () => {
    input.dispose();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    expect(input.pitch).toBe(0);
  });
});
