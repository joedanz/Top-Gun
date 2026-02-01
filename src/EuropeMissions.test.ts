// ABOUTME: Validates Europe theater mission JSON files for structure, progression, and variety.
// ABOUTME: Ensures 5 missions with progressive difficulty, distinct objectives, and a boss encounter.

import { describe, it, expect } from "vitest";
import type { MissionData } from "./MissionData";

import europe01 from "../public/missions/europe-01.json";
import europe02 from "../public/missions/europe-02.json";
import europe03 from "../public/missions/europe-03.json";
import europe04 from "../public/missions/europe-04.json";
import europe05 from "../public/missions/europe-05.json";

const missions: MissionData[] = [europe01, europe02, europe03, europe04, europe05] as MissionData[];

describe("Europe Theater Missions", () => {
  it("has 5 missions", () => {
    expect(missions).toHaveLength(5);
  });

  it("all missions have correct theater", () => {
    for (const m of missions) {
      expect(m.theater).toBe("europe");
    }
  });

  it("all missions have required fields", () => {
    for (const m of missions) {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.playerStart).toBeDefined();
      expect(m.playerStart.position).toBeDefined();
      expect(m.enemies).toBeDefined();
      expect(m.objectives.length).toBeGreaterThan(0);
    }
  });

  it("missions have sequential IDs", () => {
    expect(missions.map((m) => m.id)).toEqual([
      "europe-01",
      "europe-02",
      "europe-03",
      "europe-04",
      "europe-05",
    ]);
  });

  it("difficulty increases progressively", () => {
    const difficulties = missions.map((m) => m.aiDifficulty ?? 1);
    for (let i = 1; i < difficulties.length; i++) {
      expect(difficulties[i]).toBeGreaterThanOrEqual(difficulties[i - 1]);
    }
  });

  it("enemy count generally increases across missions", () => {
    const first = missions[0].enemies.length;
    const last = missions[missions.length - 1].enemies.length;
    expect(last).toBeGreaterThan(first);
  });

  it("has distinct objective types across missions (not all destroy_all)", () => {
    const objectiveTypes = new Set(missions.flatMap((m) => m.objectives.map((o) => o.type)));
    expect(objectiveTypes.size).toBeGreaterThanOrEqual(2);
  });

  it("final mission is a boss encounter with higher difficulty", () => {
    const boss = missions[missions.length - 1];
    expect(boss.aiDifficulty).toBeGreaterThanOrEqual(3);
    expect(boss.enemies.length).toBeGreaterThanOrEqual(3);
  });

  it("at least one mission uses formations", () => {
    const hasFormations = missions.some((m) => m.formations && m.formations.length > 0);
    expect(hasFormations).toBe(true);
  });

  it("mission titles match MissionManifest", () => {
    const expectedTitles = [
      "High Altitude Intercept",
      "Stealth Recon",
      "Escort Duty",
      "Air Superiority",
      "Fortress Strike",
    ];
    expect(missions.map((m) => m.title)).toEqual(expectedTitles);
  });
});
