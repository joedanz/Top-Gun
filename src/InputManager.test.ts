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

  it("stops listening after dispose", () => {
    input.dispose();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    expect(input.pitch).toBe(0);
  });
});
