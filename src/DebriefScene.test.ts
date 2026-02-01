// ABOUTME: Tests for DebriefScene — the post-mission results overlay.
// ABOUTME: Validates display of mission results and navigation callbacks.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DebriefScene } from "./DebriefScene";
import type { MissionResult } from "./DebriefScene";

const successResult: MissionResult = {
  missionTitle: "First Sortie",
  outcome: "success",
  kills: 3,
  timeSeconds: 45.7,
};

const failureResult: MissionResult = {
  missionTitle: "First Sortie",
  outcome: "failure",
  kills: 1,
  timeSeconds: 22.3,
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
