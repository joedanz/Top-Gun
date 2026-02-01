// ABOUTME: Tests for ProgressionManager — scoring, aircraft unlocks, mission sequencing.
// ABOUTME: Validates milestone-based progression, score calculation, and medal derivation.

import { describe, it, expect, beforeEach } from "vitest";
import { ProgressionManager } from "./ProgressionManager";
import { SaveManager } from "./SaveManager";
import type { Storage } from "./SaveManager";
import type { MissionResult } from "./DebriefScene";
import { calculateScore, getMedal } from "./Scoring";

function createMockStorage(): Storage {
  const data: Record<string, string> = {};
  return {
    getItem(key: string) {
      return data[key] ?? null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
    removeItem(key: string) {
      delete data[key];
    },
  };
}

function makeResult(overrides: Partial<MissionResult> = {}): MissionResult {
  const base = {
    missionTitle: "Test",
    outcome: "success" as const,
    kills: 3,
    timeSeconds: 45,
    shotsFired: 20,
    shotsHit: 10,
    damageTaken: 20,
  };
  const merged = { ...base, ...overrides };
  const breakdown = merged.outcome === "success"
    ? calculateScore(merged.kills, merged.timeSeconds, merged.shotsFired, merged.shotsHit, merged.damageTaken)
    : { total: 0 };
  return {
    ...merged,
    score: merged.score ?? breakdown.total,
    medal: merged.medal ?? getMedal(merged.score ?? breakdown.total),
  } as MissionResult;
}

describe("ProgressionManager", () => {
  let pm: ProgressionManager;

  beforeEach(() => {
    SaveManager.setStorage(createMockStorage());
    pm = new ProgressionManager();
  });

  describe("score calculation", () => {
    it("calculates score from result", () => {
      const result = makeResult({ kills: 3, timeSeconds: 45 });
      const score = pm.calculateScore(result);
      expect(score).toBeGreaterThan(0);
    });

    it("awards higher score for more kills", () => {
      const base = makeResult({ kills: 1, timeSeconds: 60 });
      const moreKills = makeResult({ kills: 5, timeSeconds: 60 });
      expect(pm.calculateScore(moreKills)).toBeGreaterThan(
        pm.calculateScore(base),
      );
    });

    it("awards higher score for faster completion", () => {
      const slow = makeResult({ kills: 3, timeSeconds: 120 });
      const fast = makeResult({ kills: 3, timeSeconds: 30 });
      expect(pm.calculateScore(fast)).toBeGreaterThan(
        pm.calculateScore(slow),
      );
    });

    it("returns zero score for failed missions", () => {
      const result = makeResult({ outcome: "failure", kills: 2, timeSeconds: 30 });
      expect(pm.calculateScore(result)).toBe(0);
    });
  });

  describe("mission completion", () => {
    it("records a completed mission", () => {
      const result = makeResult({ missionTitle: "First Sortie" });
      pm.completeMission("pacific-01", result);
      expect(pm.isMissionCompleted("pacific-01")).toBe(true);
    });

    it("does not record failed missions as completed", () => {
      const result = makeResult({ outcome: "failure", kills: 0, timeSeconds: 10 });
      pm.completeMission("pacific-01", result);
      expect(pm.isMissionCompleted("pacific-01")).toBe(false);
    });

    it("keeps the best score for a mission", () => {
      const low = makeResult({ kills: 1, timeSeconds: 120 });
      const high = makeResult({ kills: 5, timeSeconds: 30 });
      pm.completeMission("pacific-01", low);
      const lowScore = pm.getMissionScore("pacific-01");
      pm.completeMission("pacific-01", high);
      const highScore = pm.getMissionScore("pacific-01");
      expect(highScore).toBeGreaterThan(lowScore);
    });

    it("does not overwrite a higher score with a lower one", () => {
      const high = makeResult({ kills: 5, timeSeconds: 30 });
      const low = makeResult({ kills: 1, timeSeconds: 120 });
      pm.completeMission("pacific-01", high);
      const first = pm.getMissionScore("pacific-01");
      pm.completeMission("pacific-01", low);
      expect(pm.getMissionScore("pacific-01")).toBe(first);
    });
  });

  describe("medals", () => {
    it("returns none medal for missions with no score", () => {
      expect(pm.getMissionMedal("pacific-01")).toBe("none");
    });

    it("returns appropriate medal based on stored best score", () => {
      const result = makeResult({ kills: 5, timeSeconds: 20, shotsFired: 10, shotsHit: 10, damageTaken: 0 });
      pm.completeMission("pacific-01", result);
      const medal = pm.getMissionMedal("pacific-01");
      expect(["bronze", "silver", "gold"]).toContain(medal);
    });

    it("medal improves when best score increases", () => {
      const low = makeResult({ kills: 1, timeSeconds: 90, shotsFired: 50, shotsHit: 1, damageTaken: 80 });
      pm.completeMission("pacific-01", low);
      const lowMedal = pm.getMissionMedal("pacific-01");

      const high = makeResult({ kills: 5, timeSeconds: 20, shotsFired: 10, shotsHit: 10, damageTaken: 0 });
      pm.completeMission("pacific-01", high);
      const highMedal = pm.getMissionMedal("pacific-01");

      const medalOrder = ["none", "bronze", "silver", "gold"];
      expect(medalOrder.indexOf(highMedal)).toBeGreaterThanOrEqual(medalOrder.indexOf(lowMedal));
    });
  });

  describe("mission unlocking", () => {
    it("first mission in pacific theater is unlocked by default", () => {
      expect(pm.isMissionUnlocked("pacific-01")).toBe(true);
    });

    it("subsequent missions unlock after completing previous mission", () => {
      expect(pm.isMissionUnlocked("pacific-02")).toBe(false);
      pm.completeMission("pacific-01", makeResult());
      expect(pm.isMissionUnlocked("pacific-02")).toBe(true);
    });
  });

  describe("aircraft unlocking", () => {
    it("f-14 is unlocked by default", () => {
      expect(pm.getLockedAircraftIds(["f-14", "p-51", "fa-18"])).toEqual([
        "p-51",
        "fa-18",
      ]);
    });

    it("completing pacific theater unlocks fa-18", () => {
      pm.completeTheater("pacific");
      const locked = pm.getLockedAircraftIds(["f-14", "p-51", "fa-18"]);
      expect(locked).not.toContain("fa-18");
    });

    it("completing middleeast theater unlocks p-51", () => {
      pm.completeTheater("middleeast");
      const locked = pm.getLockedAircraftIds(["f-14", "p-51", "fa-18"]);
      expect(locked).not.toContain("p-51");
    });
  });

  describe("theater unlocking", () => {
    it("pacific and middleeast are unlocked from the start", () => {
      expect(pm.isTheaterUnlocked("pacific")).toBe(true);
      expect(pm.isTheaterUnlocked("middleeast")).toBe(true);
    });

    it("europe is locked until pacific or middleeast is complete", () => {
      expect(pm.isTheaterUnlocked("europe")).toBe(false);
      for (let i = 1; i <= 5; i++) {
        const id = `pacific-${String(i).padStart(2, "0")}`;
        pm.completeMission(id, makeResult());
      }
      expect(pm.isTheaterUnlocked("europe")).toBe(true);
    });

    it("arctic is locked until europe is complete", () => {
      expect(pm.isTheaterUnlocked("arctic")).toBe(false);
      for (let i = 1; i <= 5; i++) {
        pm.completeMission(`europe-${String(i).padStart(2, "0")}`, makeResult());
      }
      expect(pm.isTheaterUnlocked("arctic")).toBe(true);
    });
  });

  describe("theater progress", () => {
    it("returns 0 completed out of total for a fresh theater", () => {
      const progress = pm.getTheaterProgress("pacific");
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(5);
    });

    it("tracks completed missions within a theater", () => {
      pm.completeMission("pacific-01", makeResult());
      pm.completeMission("pacific-02", makeResult());
      const progress = pm.getTheaterProgress("pacific");
      expect(progress.completed).toBe(2);
    });
  });

  describe("persistence", () => {
    it("saves and restores state across instances", () => {
      pm.completeMission("pacific-01", makeResult());
      pm.completeTheater("pacific");

      const pm2 = new ProgressionManager();
      expect(pm2.isMissionCompleted("pacific-01")).toBe(true);
      expect(pm2.getLockedAircraftIds(["f-14", "fa-18"])).not.toContain(
        "fa-18",
      );
    });

    it("loads automatically on construction without manual load call", () => {
      pm.completeMission("pacific-01", makeResult({ kills: 2, timeSeconds: 30 }));

      const pm2 = new ProgressionManager();
      expect(pm2.isMissionCompleted("pacific-01")).toBe(true);
      expect(pm2.getMissionScore("pacific-01")).toBeGreaterThan(0);
    });

    it("persists theater unlock state across sessions via completed missions", () => {
      for (let i = 1; i <= 5; i++) {
        pm.completeMission(`pacific-${String(i).padStart(2, "0")}`, makeResult());
      }
      expect(pm.isTheaterUnlocked("europe")).toBe(true);

      const pm2 = new ProgressionManager();
      expect(pm2.isTheaterUnlocked("europe")).toBe(true);
    });

    it("persists scores across sessions", () => {
      pm.completeMission("pacific-01", makeResult({ kills: 5, timeSeconds: 20 }));
      const score = pm.getMissionScore("pacific-01");

      const pm2 = new ProgressionManager();
      expect(pm2.getMissionScore("pacific-01")).toBe(score);
    });

    it("persists medals across sessions", () => {
      pm.completeMission("pacific-01", makeResult({ kills: 5, timeSeconds: 20, shotsFired: 10, shotsHit: 10, damageTaken: 0 }));
      const medal = pm.getMissionMedal("pacific-01");

      const pm2 = new ProgressionManager();
      expect(pm2.getMissionMedal("pacific-01")).toBe(medal);
    });

    it("handles corrupt save data by starting fresh", () => {
      const storage = createMockStorage();
      storage.setItem("topgun_save_v1", "corrupted{{{");
      SaveManager.setStorage(storage);

      const fresh = new ProgressionManager();
      expect(fresh.isMissionCompleted("pacific-01")).toBe(false);
      expect(fresh.getLockedAircraftIds(["f-14", "fa-18"])).toContain("fa-18");
    });
  });
});
