// ABOUTME: Validates Arctic theater mission JSON files for structure, progression, and variety.
// ABOUTME: Ensures 5 missions with progressive difficulty, drone swarms, and a boss encounter.

import { describe, it, expect } from "vitest";
import type { MissionData } from "./MissionData";

import arctic01 from "../public/missions/arctic-01.json";
import arctic02 from "../public/missions/arctic-02.json";
import arctic03 from "../public/missions/arctic-03.json";
import arctic04 from "../public/missions/arctic-04.json";
import arctic05 from "../public/missions/arctic-05.json";

const missions: MissionData[] = [arctic01, arctic02, arctic03, arctic04, arctic05] as MissionData[];

describe("Arctic Theater Missions", () => {
  it("has 5 missions", () => {
    expect(missions).toHaveLength(5);
  });

  it("all missions have correct theater", () => {
    for (const m of missions) {
      expect(m.theater).toBe("arctic");
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
      "arctic-01",
      "arctic-02",
      "arctic-03",
      "arctic-04",
      "arctic-05",
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

  it("final mission is a boss encounter", () => {
    const boss = missions[missions.length - 1];
    expect(boss.bossIndex).toBeDefined();
    expect(boss.bossName).toBe("Nemesis");
    expect(boss.bossHealth).toBeGreaterThanOrEqual(500);
    expect(boss.aiDifficulty).toBeGreaterThanOrEqual(3);
  });

  it("at least one mission uses formations", () => {
    const hasFormations = missions.some((m) => m.formations && m.formations.length > 0);
    expect(hasFormations).toBe(true);
  });

  it("mission titles match MissionManifest", () => {
    const expectedTitles = [
      "Cold Front",
      "Ice Station",
      "Aurora Borealis",
      "Frozen Airfield",
      "Final Countdown",
    ];
    expect(missions.map((m) => m.title)).toEqual(expectedTitles);
  });

  it("at least one mission has drone swarm (6+ enemies in coordinated groups)", () => {
    const hasDroneSwarm = missions.some(
      (m) => m.enemies.length >= 6 && m.formations && m.formations.length >= 2,
    );
    expect(hasDroneSwarm).toBe(true);
  });

  it("has ground targets in at least one mission", () => {
    const hasGround = missions.some((m) => m.groundTargets && m.groundTargets.length > 0);
    expect(hasGround).toBe(true);
  });
});
