// ABOUTME: Tests for scoring formula and medal calculations.
// ABOUTME: Validates score breakdown components and medal thresholds.

import { describe, it, expect } from "vitest";
import { calculateScore, getMedal, MEDAL_THRESHOLDS } from "./Scoring";

describe("calculateScore", () => {
  it("awards points for kills", () => {
    const score = calculateScore(3, 50, 0, 0, 0);
    expect(score.kills).toBe(1500);
  });

  it("awards time bonus for fast completion", () => {
    const fast = calculateScore(0, 10, 0, 0, 0);
    const slow = calculateScore(0, 90, 0, 0, 0);
    expect(fast.timeBonus).toBeGreaterThan(slow.timeBonus);
  });

  it("clamps time bonus to zero for very slow missions", () => {
    const score = calculateScore(0, 200, 0, 0, 0);
    expect(score.timeBonus).toBe(0);
  });

  it("awards accuracy bonus based on hit ratio", () => {
    const perfect = calculateScore(0, 50, 10, 10, 0);
    const poor = calculateScore(0, 50, 10, 2, 0);
    expect(perfect.accuracyBonus).toBeGreaterThan(poor.accuracyBonus);
  });

  it("handles zero shots fired without NaN", () => {
    const score = calculateScore(0, 50, 0, 0, 0);
    expect(score.accuracyBonus).toBe(0);
    expect(Number.isNaN(score.total)).toBe(false);
  });

  it("applies damage penalty", () => {
    const noDamage = calculateScore(3, 50, 10, 5, 0);
    const damaged = calculateScore(3, 50, 10, 5, 50);
    expect(damaged.total).toBeLessThan(noDamage.total);
    expect(damaged.damagePenalty).toBeGreaterThan(0);
  });

  it("total never goes below zero", () => {
    const score = calculateScore(0, 200, 10, 0, 100);
    expect(score.total).toBe(0);
  });

  it("combines all factors into total", () => {
    const score = calculateScore(2, 30, 20, 10, 10);
    expect(score.total).toBe(score.kills + score.timeBonus + score.accuracyBonus - score.damagePenalty);
  });
});

describe("getMedal", () => {
  it("returns none for scores below bronze", () => {
    expect(getMedal(0)).toBe("none");
    expect(getMedal(499)).toBe("none");
  });

  it("returns bronze at threshold", () => {
    expect(getMedal(MEDAL_THRESHOLDS.bronze)).toBe("bronze");
  });

  it("returns silver at threshold", () => {
    expect(getMedal(MEDAL_THRESHOLDS.silver)).toBe("silver");
  });

  it("returns gold at threshold", () => {
    expect(getMedal(MEDAL_THRESHOLDS.gold)).toBe("gold");
  });

  it("returns gold for very high scores", () => {
    expect(getMedal(10000)).toBe("gold");
  });
});
