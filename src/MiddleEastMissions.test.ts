// ABOUTME: Validates Middle East theater mission JSON files for structure, progression, and variety.
// ABOUTME: Ensures 5 missions with ground attack focus, progressive difficulty, and a boss encounter.

import { describe, it, expect } from "vitest";
import type { MissionData } from "./MissionData";

import middleeast01 from "../public/missions/middleeast-01.json";
import middleeast02 from "../public/missions/middleeast-02.json";
import middleeast03 from "../public/missions/middleeast-03.json";
import middleeast04 from "../public/missions/middleeast-04.json";
import middleeast05 from "../public/missions/middleeast-05.json";

const missions: MissionData[] = [middleeast01, middleeast02, middleeast03, middleeast04, middleeast05] as MissionData[];

describe("Middle East Theater Missions", () => {
  it("has 5 missions", () => {
    expect(missions).toHaveLength(5);
  });

  it("all missions have correct theater", () => {
    for (const m of missions) {
      expect(m.theater).toBe("middleeast");
    }
  });

  it("all missions have required fields", () => {
    for (const m of missions) {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.playerStart).toBeDefined();
      expect(m.playerStart.position).toBeDefined();
      expect(m.objectives.length).toBeGreaterThan(0);
    }
  });

  it("missions have sequential IDs", () => {
    expect(missions.map((m) => m.id)).toEqual([
      "middleeast-01",
      "middleeast-02",
      "middleeast-03",
      "middleeast-04",
      "middleeast-05",
    ]);
  });

  it("difficulty increases progressively", () => {
    const difficulties = missions.map((m) => m.aiDifficulty ?? 1);
    for (let i = 1; i < difficulties.length; i++) {
      expect(difficulties[i]).toBeGreaterThanOrEqual(difficulties[i - 1]);
    }
  });

  it("has ground attack focus — majority of missions have ground targets", () => {
    const withGround = missions.filter((m) => m.groundTargets && m.groundTargets.length > 0);
    expect(withGround.length).toBeGreaterThanOrEqual(3);
  });

  it("has distinct objective types across missions", () => {
    const objectiveTypes = new Set(missions.flatMap((m) => m.objectives.map((o) => o.type)));
    expect(objectiveTypes.size).toBeGreaterThanOrEqual(2);
  });

  it("final mission is a boss encounter with higher difficulty", () => {
    const boss = missions[missions.length - 1];
    expect(boss.aiDifficulty).toBeGreaterThanOrEqual(3);
    expect(boss.enemies.length).toBeGreaterThanOrEqual(3);
  });

  it("at least one mission uses destroy_ground_targets objective", () => {
    const hasGroundObjective = missions.some((m) =>
      m.objectives.some((o) => o.type === "destroy_ground_targets"),
    );
    expect(hasGroundObjective).toBe(true);
  });

  it("ground target count increases across missions with ground targets", () => {
    const groundCounts = missions
      .filter((m) => m.groundTargets && m.groundTargets.length > 0)
      .map((m) => m.groundTargets!.length);
    if (groundCounts.length >= 2) {
      expect(groundCounts[groundCounts.length - 1]).toBeGreaterThanOrEqual(groundCounts[0]);
    }
  });
});
