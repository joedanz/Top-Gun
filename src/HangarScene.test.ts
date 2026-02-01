// ABOUTME: Tests for HangarScene — the aircraft selection overlay.
// ABOUTME: Validates display of aircraft stats, selection, and locked aircraft behavior.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HangarScene } from "./HangarScene";
import type { AircraftStats } from "./AircraftData";

const sampleAircraft: AircraftStats[] = [
  {
    id: "f-14",
    name: "F-14 Tomcat",
    flightParams: {
      maxSpeed: 260,
      acceleration: 50,
      deceleration: 30,
      turnRate: 1.6,
      stallThreshold: 25,
      stallNoseDrop: 0.8,
      stallSpeedRecovery: 15,
      altitudeFloor: 2,
    },
    weaponLoadout: { gunAmmo: 200, missiles: 6 },
  },
  {
    id: "p-51",
    name: "P-51 Mustang",
    flightParams: {
      maxSpeed: 140,
      acceleration: 25,
      deceleration: 20,
      turnRate: 2.8,
      stallThreshold: 15,
      stallNoseDrop: 0.6,
      stallSpeedRecovery: 12,
      altitudeFloor: 2,
    },
    weaponLoadout: { gunAmmo: 300, missiles: 0 },
  },
  {
    id: "fa-18",
    name: "F/A-18 Super Hornet",
    flightParams: {
      maxSpeed: 220,
      acceleration: 45,
      deceleration: 35,
      turnRate: 2.2,
      stallThreshold: 20,
      stallNoseDrop: 0.8,
      stallSpeedRecovery: 15,
      altitudeFloor: 2,
    },
    weaponLoadout: { gunAmmo: 250, missiles: 4 },
  },
];

describe("HangarScene", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders all aircraft names", () => {
    const hangar = new HangarScene(sampleAircraft, [], container, vi.fn());
    expect(container.textContent).toContain("F-14 Tomcat");
    expect(container.textContent).toContain("P-51 Mustang");
    expect(container.textContent).toContain("F/A-18 Super Hornet");
    hangar.dispose();
  });

  it("displays speed and agility stats for each aircraft", () => {
    const hangar = new HangarScene(sampleAircraft, [], container, vi.fn());
    // F-14: maxSpeed 260, turnRate 1.6
    expect(container.textContent).toContain("260");
    expect(container.textContent).toContain("1.6");
    // P-51: maxSpeed 140, turnRate 2.8
    expect(container.textContent).toContain("140");
    expect(container.textContent).toContain("2.8");
    hangar.dispose();
  });

  it("displays weapon loadout stats", () => {
    const hangar = new HangarScene(sampleAircraft, [], container, vi.fn());
    expect(container.textContent).toContain("200");
    expect(container.textContent).toContain("6");
    hangar.dispose();
  });

  it("calls onSelect with the aircraft id when a selectable aircraft is clicked", () => {
    const onSelect = vi.fn();
    const hangar = new HangarScene(sampleAircraft, [], container, onSelect);
    const buttons = container.querySelectorAll("button");
    // Click the first aircraft's select button
    buttons[0].click();
    expect(onSelect).toHaveBeenCalledWith("f-14");
    hangar.dispose();
  });

  it("shows locked aircraft as not selectable", () => {
    const onSelect = vi.fn();
    const lockedIds = ["p-51"];
    const hangar = new HangarScene(sampleAircraft, lockedIds, container, onSelect);
    // Find all buttons — locked aircraft should not have a clickable select button
    const cards = container.querySelectorAll("[data-aircraft-id]");
    const lockedCard = Array.from(cards).find(
      (c) => c.getAttribute("data-aircraft-id") === "p-51",
    );
    expect(lockedCard).toBeDefined();
    expect(lockedCard!.textContent).toContain("LOCKED");
    // Clicking locked card's button should not fire onSelect
    const lockedButton = lockedCard!.querySelector("button");
    if (lockedButton) lockedButton.click();
    expect(onSelect).not.toHaveBeenCalled();
    hangar.dispose();
  });

  it("dispose removes the overlay from the container", () => {
    const hangar = new HangarScene(sampleAircraft, [], container, vi.fn());
    expect(container.children.length).toBeGreaterThan(0);
    hangar.dispose();
    expect(container.children.length).toBe(0);
  });

  it("highlights the selected aircraft card", () => {
    const hangar = new HangarScene(sampleAircraft, [], container, vi.fn());
    const buttons = container.querySelectorAll("button");
    buttons[1].click(); // Select P-51
    const cards = container.querySelectorAll("[data-aircraft-id]");
    const selectedCard = Array.from(cards).find(
      (c) => c.getAttribute("data-aircraft-id") === "p-51",
    );
    expect((selectedCard as HTMLElement).style.borderColor).toBe("rgb(0, 170, 0)");
    hangar.dispose();
  });
});
