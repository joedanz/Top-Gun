// ABOUTME: Tests for AIInput — verifies it implements FlightInput with mutable fields.
// ABOUTME: Ensures AI system can write control values that Aircraft reads.

import { describe, it, expect } from "vitest";
import { AIInput } from "./AIInput";

describe("AIInput", () => {
  it("starts with neutral inputs", () => {
    const ai = new AIInput();
    expect(ai.pitch).toBe(0);
    expect(ai.roll).toBe(0);
    expect(ai.yaw).toBe(0);
    expect(ai.throttle).toBe(0);
    expect(ai.fire).toBe(false);
  });

  it("allows mutation of all axes", () => {
    const ai = new AIInput();
    ai.pitch = 0.5;
    ai.roll = -1;
    ai.yaw = 0.3;
    ai.throttle = 1;
    ai.fire = true;
    expect(ai.pitch).toBe(0.5);
    expect(ai.roll).toBe(-1);
    expect(ai.yaw).toBe(0.3);
    expect(ai.throttle).toBe(1);
    expect(ai.fire).toBe(true);
  });
});
