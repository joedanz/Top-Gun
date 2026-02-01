// ABOUTME: Validates Pacific theater mission JSON files for structure, progression, and variety.
// ABOUTME: Ensures 5 missions with progressive difficulty, distinct objectives, and a boss encounter.

import { describe, it, expect } from "vitest";
import type { MissionData } from "./MissionData";

import pacific01 from "../public/missions/pacific-01.json";
import pacific02 from "../public/missions/pacific-02.json";
import pacific03 from "../public/missions/pacific-03.json";
import pacific04 from "../public/missions/pacific-04.json";
import pacific05 from "../public/missions/pacific-05.json";

const missions: MissionData[] = [pacific01, pacific02, pacific03, pacific04, pacific05] as MissionData[];

describe("Pacific Theater Missions", () => {
  it("has 5 missions", () => {
    expect(missions).toHaveLength(5);
  });

  it("all missions have correct theater", () => {
    for (const m of missions) {
      expect(m.theater).toBe("pacific");
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
      "pacific-01",
      "pacific-02",
      "pacific-03",
      "pacific-04",
      "pacific-05",
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

  it("at least one mission has a survive_time objective", () => {
    const hasSurvive = missions.some((m) => m.objectives.some((o) => o.type === "survive_time"));
    expect(hasSurvive).toBe(true);
  });

  it("first mission is a tutorial", () => {
    expect(missions[0].tutorial).toBe(true);
    expect(missions[0].title).toBe("Flight School");
  });
});
