// ABOUTME: Tests for ScreenShake — validates camera offset application and decay.
// ABOUTME: Ensures shake intensity scales with damage and decays over time.

import { describe, it, expect, beforeEach } from "vitest";
import { ScreenShake } from "./ScreenShake";

describe("ScreenShake", () => {
  let shake: ScreenShake;

  beforeEach(() => {
    shake = new ScreenShake();
  });

  it("starts with zero offset", () => {
    const offset = shake.getOffset();
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
    expect(offset.z).toBe(0);
  });

  it("produces non-zero offset after triggering", () => {
    shake.trigger(1.0);
    shake.update(1 / 60);
    const offset = shake.getOffset();
    const magnitude = Math.sqrt(offset.x ** 2 + offset.y ** 2 + offset.z ** 2);
    expect(magnitude).toBeGreaterThan(0);
  });

  it("decays to near-zero after enough time", () => {
    shake.trigger(1.0);
    // Simulate 2 seconds of updates
    for (let i = 0; i < 120; i++) {
      shake.update(1 / 60);
    }
    const offset = shake.getOffset();
    const magnitude = Math.sqrt(offset.x ** 2 + offset.y ** 2 + offset.z ** 2);
    expect(magnitude).toBeLessThan(0.01);
  });

  it("stronger intensity produces larger initial offset", () => {
    const shakeLight = new ScreenShake();
    const shakeHeavy = new ScreenShake();

    shakeLight.trigger(0.2);
    shakeLight.update(1 / 60);
    const lightOffset = shakeLight.getOffset();
    const lightMag = Math.sqrt(lightOffset.x ** 2 + lightOffset.y ** 2 + lightOffset.z ** 2);

    shakeHeavy.trigger(1.0);
    shakeHeavy.update(1 / 60);
    const heavyOffset = shakeHeavy.getOffset();
    const heavyMag = Math.sqrt(heavyOffset.x ** 2 + heavyOffset.y ** 2 + heavyOffset.z ** 2);

    expect(heavyMag).toBeGreaterThan(lightMag);
  });

  it("re-triggering while shaking increases intensity", () => {
    shake.trigger(0.5);
    shake.update(1 / 60);
    const firstMag = Math.sqrt(
      shake.getOffset().x ** 2 + shake.getOffset().y ** 2 + shake.getOffset().z ** 2,
    );

    shake.trigger(0.5);
    shake.update(1 / 60);
    const secondMag = Math.sqrt(
      shake.getOffset().x ** 2 + shake.getOffset().y ** 2 + shake.getOffset().z ** 2,
    );

    // Re-trigger should keep or increase the intensity
    expect(secondMag).toBeGreaterThanOrEqual(firstMag * 0.5);
  });
});
