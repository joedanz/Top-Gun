// ABOUTME: Tests for TheaterSelectScene — theater listing, unlock states, mission selection.
// ABOUTME: Validates theater/mission rendering, locked state, and navigation callbacks.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TheaterSelectScene } from "./TheaterSelectScene";
import type { TheaterInfo, MissionInfo } from "./TheaterSelectScene";

function makeTheaters(): TheaterInfo[] {
  return [
    {
      id: "pacific",
      name: "Pacific",
      unlocked: true,
      missions: [
        { id: "pacific-01", title: "First Sortie", completed: false, unlocked: true },
        { id: "pacific-02", title: "Carrier Quals", completed: false, unlocked: false },
      ],
      completedCount: 0,
      totalCount: 2,
    },
    {
      id: "middleeast",
      name: "Middle East",
      unlocked: true,
      missions: [
        { id: "middleeast-01", title: "Desert Strike", completed: true, unlocked: true },
      ],
      completedCount: 1,
      totalCount: 1,
    },
    {
      id: "europe",
      name: "Europe",
      unlocked: false,
      missions: [],
      completedCount: 0,
      totalCount: 0,
    },
    {
      id: "arctic",
      name: "Arctic",
      unlocked: false,
      missions: [],
      completedCount: 0,
      totalCount: 0,
    },
  ];
}

describe("TheaterSelectScene", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders all four theater names", () => {
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), vi.fn());
    const text = container.textContent ?? "";
    expect(text).toContain("Pacific");
    expect(text).toContain("Middle East");
    expect(text).toContain("Europe");
    expect(text).toContain("Arctic");
    scene.dispose();
  });

  it("shows completion progress for unlocked theaters", () => {
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), vi.fn());
    const text = container.textContent ?? "";
    expect(text).toContain("0 / 2");
    expect(text).toContain("1 / 1");
    scene.dispose();
  });

  it("marks locked theaters as visually distinct", () => {
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), vi.fn());
    const europeCard = container.querySelector('[data-theater-id="europe"]') as HTMLElement;
    expect(europeCard).toBeTruthy();
    expect(europeCard.textContent).toContain("LOCKED");
    scene.dispose();
  });

  it("shows missions when an unlocked theater is selected", () => {
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), vi.fn());
    const pacificCard = container.querySelector('[data-theater-id="pacific"]') as HTMLElement;
    pacificCard.click();
    const text = container.textContent ?? "";
    expect(text).toContain("First Sortie");
    expect(text).toContain("Carrier Quals");
    scene.dispose();
  });

  it("does not show missions when a locked theater is clicked", () => {
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), vi.fn());
    const europeCard = container.querySelector('[data-theater-id="europe"]') as HTMLElement;
    europeCard.click();
    expect(container.textContent).not.toContain("First Sortie");
    scene.dispose();
  });

  it("calls onMissionSelect with mission id when an unlocked mission is clicked", () => {
    const onMissionSelect = vi.fn();
    const scene = new TheaterSelectScene(makeTheaters(), container, onMissionSelect, vi.fn());
    // Expand Pacific
    const pacificCard = container.querySelector('[data-theater-id="pacific"]') as HTMLElement;
    pacificCard.click();
    // Click the unlocked mission
    const missionBtn = container.querySelector('[data-mission-id="pacific-01"]') as HTMLElement;
    missionBtn.click();
    expect(onMissionSelect).toHaveBeenCalledWith("pacific-01");
    scene.dispose();
  });

  it("does not call onMissionSelect for locked missions", () => {
    const onMissionSelect = vi.fn();
    const scene = new TheaterSelectScene(makeTheaters(), container, onMissionSelect, vi.fn());
    const pacificCard = container.querySelector('[data-theater-id="pacific"]') as HTMLElement;
    pacificCard.click();
    const lockedMission = container.querySelector('[data-mission-id="pacific-02"]') as HTMLElement;
    lockedMission.click();
    expect(onMissionSelect).not.toHaveBeenCalled();
    scene.dispose();
  });

  it("shows locked missions as visually distinct", () => {
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), vi.fn());
    const pacificCard = container.querySelector('[data-theater-id="pacific"]') as HTMLElement;
    pacificCard.click();
    const lockedMission = container.querySelector('[data-mission-id="pacific-02"]') as HTMLElement;
    expect(lockedMission.style.opacity).toBe("0.4");
    scene.dispose();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), onBack);
    const backBtn = container.querySelector("[data-action='back']") as HTMLElement;
    backBtn.click();
    expect(onBack).toHaveBeenCalled();
    scene.dispose();
  });

  it("dispose removes overlay from DOM", () => {
    const scene = new TheaterSelectScene(makeTheaters(), container, vi.fn(), vi.fn());
    expect(container.children.length).toBe(1);
    scene.dispose();
    expect(container.children.length).toBe(0);
  });
});
