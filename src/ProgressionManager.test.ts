// ABOUTME: Tests for ProgressionManager — scoring, aircraft unlocks, mission sequencing.
// ABOUTME: Validates milestone-based progression and score calculation from mission results.

import { describe, it, expect, beforeEach } from "vitest";
import { ProgressionManager } from "./ProgressionManager";
import { SaveManager } from "./SaveManager";
import type { Storage } from "./SaveManager";
import type { MissionResult } from "./DebriefScene";

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

describe("ProgressionManager", () => {
  let pm: ProgressionManager;

  beforeEach(() => {
    SaveManager.setStorage(createMockStorage());
    pm = new ProgressionManager();
  });

  describe("score calculation", () => {
    it("calculates score from kills and time", () => {
      const result: MissionResult = {
        missionTitle: "First Sortie",
        outcome: "success",
        kills: 3,
        timeSeconds: 45,
      };
      const score = pm.calculateScore(result);
      expect(score).toBeGreaterThan(0);
    });

    it("awards higher score for more kills", () => {
      const base: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 1,
        timeSeconds: 60,
      };
      const moreKills: MissionResult = { ...base, kills: 5 };
      expect(pm.calculateScore(moreKills)).toBeGreaterThan(
        pm.calculateScore(base),
      );
    });

    it("awards higher score for faster completion", () => {
      const slow: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 3,
        timeSeconds: 120,
      };
      const fast: MissionResult = { ...slow, timeSeconds: 30 };
      expect(pm.calculateScore(fast)).toBeGreaterThan(
        pm.calculateScore(slow),
      );
    });

    it("returns zero score for failed missions", () => {
      const result: MissionResult = {
        missionTitle: "Test",
        outcome: "failure",
        kills: 2,
        timeSeconds: 30,
      };
      expect(pm.calculateScore(result)).toBe(0);
    });
  });

  describe("mission completion", () => {
    it("records a completed mission", () => {
      const result: MissionResult = {
        missionTitle: "First Sortie",
        outcome: "success",
        kills: 3,
        timeSeconds: 45,
      };
      pm.completeMission("pacific-01", result);
      expect(pm.isMissionCompleted("pacific-01")).toBe(true);
    });

    it("does not record failed missions as completed", () => {
      const result: MissionResult = {
        missionTitle: "First Sortie",
        outcome: "failure",
        kills: 0,
        timeSeconds: 10,
      };
      pm.completeMission("pacific-01", result);
      expect(pm.isMissionCompleted("pacific-01")).toBe(false);
    });

    it("keeps the best score for a mission", () => {
      const low: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 1,
        timeSeconds: 120,
      };
      const high: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 5,
        timeSeconds: 30,
      };
      pm.completeMission("pacific-01", low);
      const lowScore = pm.getMissionScore("pacific-01");
      pm.completeMission("pacific-01", high);
      const highScore = pm.getMissionScore("pacific-01");
      expect(highScore).toBeGreaterThan(lowScore);
    });

    it("does not overwrite a higher score with a lower one", () => {
      const high: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 5,
        timeSeconds: 30,
      };
      const low: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 1,
        timeSeconds: 120,
      };
      pm.completeMission("pacific-01", high);
      const first = pm.getMissionScore("pacific-01");
      pm.completeMission("pacific-01", low);
      expect(pm.getMissionScore("pacific-01")).toBe(first);
    });
  });

  describe("mission unlocking", () => {
    it("first mission in pacific theater is unlocked by default", () => {
      expect(pm.isMissionUnlocked("pacific-01")).toBe(true);
    });

    it("subsequent missions unlock after completing previous mission", () => {
      expect(pm.isMissionUnlocked("pacific-02")).toBe(false);
      const result: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 3,
        timeSeconds: 45,
      };
      pm.completeMission("pacific-01", result);
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
      // Complete all pacific missions (simulate completing theater)
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
      const result: MissionResult = { missionTitle: "T", outcome: "success", kills: 1, timeSeconds: 30 };
      // Complete all pacific missions
      for (let i = 1; i <= 5; i++) {
        const id = `pacific-${String(i).padStart(2, "0")}`;
        pm.completeMission(id, result);
      }
      expect(pm.isTheaterUnlocked("europe")).toBe(true);
    });

    it("arctic is locked until europe is complete", () => {
      expect(pm.isTheaterUnlocked("arctic")).toBe(false);
      const result: MissionResult = { missionTitle: "T", outcome: "success", kills: 1, timeSeconds: 30 };
      for (let i = 1; i <= 5; i++) {
        pm.completeMission(`europe-${String(i).padStart(2, "0")}`, result);
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
      const result: MissionResult = { missionTitle: "T", outcome: "success", kills: 1, timeSeconds: 30 };
      pm.completeMission("pacific-01", result);
      pm.completeMission("pacific-02", result);
      const progress = pm.getTheaterProgress("pacific");
      expect(progress.completed).toBe(2);
    });
  });

  describe("persistence", () => {
    it("saves and restores state across instances", () => {
      const result: MissionResult = {
        missionTitle: "Test",
        outcome: "success",
        kills: 3,
        timeSeconds: 45,
      };
      pm.completeMission("pacific-01", result);
      pm.completeTheater("pacific");

      const pm2 = new ProgressionManager();
      expect(pm2.isMissionCompleted("pacific-01")).toBe(true);
      expect(pm2.getLockedAircraftIds(["f-14", "fa-18"])).not.toContain(
        "fa-18",
      );
    });
  });
});
