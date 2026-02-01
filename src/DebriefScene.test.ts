// ABOUTME: Tests for DebriefScene — the post-mission results overlay.
// ABOUTME: Validates display of mission results, score, medals, and navigation callbacks.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DebriefScene } from "./DebriefScene";
import type { MissionResult } from "./DebriefScene";

const successResult: MissionResult = {
  missionTitle: "First Sortie",
  outcome: "success",
  kills: 3,
  timeSeconds: 45.7,
  score: 2100,
  medal: "silver",
  shotsFired: 30,
  shotsHit: 15,
  damageTaken: 20,
};

const failureResult: MissionResult = {
  missionTitle: "First Sortie",
  outcome: "failure",
  kills: 1,
  timeSeconds: 22.3,
  score: 0,
  medal: "none",
  shotsFired: 10,
  shotsHit: 2,
  damageTaken: 100,
};

const goldResult: MissionResult = {
  missionTitle: "Ace Mission",
  outcome: "success",
  kills: 5,
  timeSeconds: 20,
  score: 3500,
  medal: "gold",
  shotsFired: 10,
  shotsHit: 10,
  damageTaken: 0,
};

describe("DebriefScene", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders mission title", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    expect(container.textContent).toContain("First Sortie");
    debrief.dispose();
  });

  it("displays MISSION COMPLETE for success", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    expect(container.textContent).toContain("MISSION COMPLETE");
    debrief.dispose();
  });

  it("displays MISSION FAILED for failure", () => {
    const debrief = new DebriefScene(failureResult, container, vi.fn(), vi.fn());
    expect(container.textContent).toContain("MISSION FAILED");
    debrief.dispose();
  });

  it("shows kill count", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    expect(container.textContent).toContain("3");
    debrief.dispose();
  });

  it("shows mission time", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    expect(container.textContent).toContain("45.7");
    debrief.dispose();
  });

  it("shows score", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    expect(container.textContent).toContain("2100");
    debrief.dispose();
  });

  it("shows medal for successful mission", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    expect(container.textContent).toContain("SILVER MEDAL");
    debrief.dispose();
  });

  it("shows gold medal with correct styling", () => {
    const debrief = new DebriefScene(goldResult, container, vi.fn(), vi.fn());
    const medalEl = container.querySelector("[data-medal='gold']");
    expect(medalEl).toBeTruthy();
    expect(medalEl!.textContent).toContain("GOLD MEDAL");
    debrief.dispose();
  });

  it("does not show medal for no-medal result", () => {
    const debrief = new DebriefScene(failureResult, container, vi.fn(), vi.fn());
    expect(container.textContent).not.toContain("MEDAL");
    debrief.dispose();
  });

  it("has a next mission button", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    const buttons = container.querySelectorAll("button");
    const nextBtn = Array.from(buttons).find((b) =>
      b.textContent?.toLowerCase().includes("next"),
    );
    expect(nextBtn).toBeDefined();
    debrief.dispose();
  });

  it("has a return to menu button", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    const buttons = container.querySelectorAll("button");
    const menuBtn = Array.from(buttons).find((b) =>
      b.textContent?.toLowerCase().includes("menu"),
    );
    expect(menuBtn).toBeDefined();
    debrief.dispose();
  });

  it("calls onNextMission when next button is clicked", () => {
    const onNext = vi.fn();
    const debrief = new DebriefScene(successResult, container, onNext, vi.fn());
    const buttons = container.querySelectorAll("button");
    const nextBtn = Array.from(buttons).find((b) =>
      b.textContent?.toLowerCase().includes("next"),
    )!;
    nextBtn.click();
    expect(onNext).toHaveBeenCalledOnce();
    debrief.dispose();
  });

  it("calls onMenu when menu button is clicked", () => {
    const onMenu = vi.fn();
    const debrief = new DebriefScene(successResult, container, vi.fn(), onMenu);
    const buttons = container.querySelectorAll("button");
    const menuBtn = Array.from(buttons).find((b) =>
      b.textContent?.toLowerCase().includes("menu"),
    )!;
    menuBtn.click();
    expect(onMenu).toHaveBeenCalledOnce();
    debrief.dispose();
  });

  it("dispose removes the overlay from the container", () => {
    const debrief = new DebriefScene(successResult, container, vi.fn(), vi.fn());
    expect(container.children.length).toBeGreaterThan(0);
    debrief.dispose();
    expect(container.children.length).toBe(0);
  });
});
