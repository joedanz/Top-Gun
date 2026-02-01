// ABOUTME: Tests for BriefingScene — the pre-mission briefing overlay.
// ABOUTME: Validates display of mission info and launch callback.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BriefingScene } from "./BriefingScene";
import type { MissionData } from "./MissionData";

const sampleMission: MissionData = {
  id: "pacific-01",
  title: "First Sortie",
  description: "Intercept enemy fighters approaching the carrier group.",
  theater: "pacific",
  playerStart: { position: { x: 0, y: 50, z: 0 }, heading: 0 },
  enemies: [{ position: { x: 200, y: 60, z: 400 } }],
  objectives: [
    { type: "destroy_all", description: "Destroy all enemy aircraft" },
  ],
};

describe("BriefingScene", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders mission title", () => {
    const briefing = new BriefingScene(sampleMission, container, vi.fn());
    expect(container.textContent).toContain("First Sortie");
    briefing.dispose();
  });

  it("renders mission description", () => {
    const briefing = new BriefingScene(sampleMission, container, vi.fn());
    expect(container.textContent).toContain("Intercept enemy fighters");
    briefing.dispose();
  });

  it("renders theater name", () => {
    const briefing = new BriefingScene(sampleMission, container, vi.fn());
    expect(container.textContent).toContain("PACIFIC");
    briefing.dispose();
  });

  it("renders objectives", () => {
    const briefing = new BriefingScene(sampleMission, container, vi.fn());
    expect(container.textContent).toContain("Destroy all enemy aircraft");
    briefing.dispose();
  });

  it("renders a launch button", () => {
    const briefing = new BriefingScene(sampleMission, container, vi.fn());
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button!.textContent).toContain("Launch");
    briefing.dispose();
  });

  it("calls onLaunch callback when launch button is clicked", () => {
    const onLaunch = vi.fn();
    const briefing = new BriefingScene(sampleMission, container, onLaunch);
    const button = container.querySelector("button")!;
    button.click();
    expect(onLaunch).toHaveBeenCalledOnce();
    briefing.dispose();
  });

  it("dispose removes the overlay from the container", () => {
    const briefing = new BriefingScene(sampleMission, container, vi.fn());
    expect(container.children.length).toBeGreaterThan(0);
    briefing.dispose();
    expect(container.children.length).toBe(0);
  });

  it("renders multiple objectives", () => {
    const multi = {
      ...sampleMission,
      objectives: [
        { type: "destroy_enemies" as const, description: "Destroy 3 enemies", count: 3 },
        { type: "survive_time" as const, description: "Survive for 60 seconds", timeSeconds: 60 },
      ],
    };
    const briefing = new BriefingScene(multi, container, vi.fn());
    expect(container.textContent).toContain("Destroy 3 enemies");
    expect(container.textContent).toContain("Survive for 60 seconds");
    briefing.dispose();
  });
});
