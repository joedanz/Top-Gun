// ABOUTME: Tests for the ObjectiveManager that tracks mission objective completion.
// ABOUTME: Verifies destroy_enemies, destroy_all, and survive_time objectives.

import { describe, it, expect, beforeEach } from "vitest";
import { ObjectiveManager } from "./ObjectiveManager";
import type { ObjectiveData } from "./MissionData";

describe("ObjectiveManager", () => {
  let manager: ObjectiveManager;

  describe("destroy_enemies objective", () => {
    beforeEach(() => {
      const objectives: ObjectiveData[] = [
        { type: "destroy_enemies", description: "Destroy 3 enemies", count: 3 },
      ];
      manager = new ObjectiveManager(objectives);
    });

    it("starts incomplete", () => {
      expect(manager.allComplete()).toBe(false);
    });

    it("tracks kills and completes when count reached", () => {
      manager.recordKill();
      manager.recordKill();
      expect(manager.allComplete()).toBe(false);
      manager.recordKill();
      expect(manager.allComplete()).toBe(true);
    });

    it("reports objective status", () => {
      manager.recordKill();
      const statuses = manager.getStatuses();
      expect(statuses).toHaveLength(1);
      expect(statuses[0].description).toBe("Destroy 3 enemies");
      expect(statuses[0].complete).toBe(false);
      expect(statuses[0].progress).toBe("1/3");
    });
  });

  describe("destroy_all objective", () => {
    beforeEach(() => {
      const objectives: ObjectiveData[] = [
        { type: "destroy_all", description: "Destroy all enemies" },
      ];
      manager = new ObjectiveManager(objectives, 4);
    });

    it("completes when all enemies destroyed", () => {
      expect(manager.allComplete()).toBe(false);
      manager.recordKill();
      manager.recordKill();
      manager.recordKill();
      expect(manager.allComplete()).toBe(false);
      manager.recordKill();
      expect(manager.allComplete()).toBe(true);
    });
  });

  describe("survive_time objective", () => {
    beforeEach(() => {
      const objectives: ObjectiveData[] = [
        { type: "survive_time", description: "Survive for 60 seconds", timeSeconds: 60 },
      ];
      manager = new ObjectiveManager(objectives);
    });

    it("completes after enough time elapses", () => {
      manager.update(30);
      expect(manager.allComplete()).toBe(false);
      manager.update(30);
      expect(manager.allComplete()).toBe(true);
    });

    it("reports time progress", () => {
      manager.update(25);
      const statuses = manager.getStatuses();
      expect(statuses[0].progress).toBe("25/60s");
    });
  });

  describe("multiple objectives", () => {
    it("requires all objectives to be complete", () => {
      const objectives: ObjectiveData[] = [
        { type: "destroy_enemies", description: "Destroy 2 enemies", count: 2 },
        { type: "survive_time", description: "Survive 30 seconds", timeSeconds: 30 },
      ];
      manager = new ObjectiveManager(objectives);
      manager.recordKill();
      manager.recordKill();
      expect(manager.allComplete()).toBe(false);
      manager.update(30);
      expect(manager.allComplete()).toBe(true);
    });
  });

  describe("mission outcome", () => {
    it("reports success when all objectives complete", () => {
      const objectives: ObjectiveData[] = [
        { type: "destroy_enemies", description: "Destroy 1 enemy", count: 1 },
      ];
      manager = new ObjectiveManager(objectives);
      expect(manager.outcome).toBe("in_progress");
      manager.recordKill();
      expect(manager.outcome).toBe("success");
    });

    it("reports failure when player dies", () => {
      const objectives: ObjectiveData[] = [
        { type: "destroy_enemies", description: "Destroy 1 enemy", count: 1 },
      ];
      manager = new ObjectiveManager(objectives);
      manager.setFailed();
      expect(manager.outcome).toBe("failure");
    });

    it("failure takes priority over completion", () => {
      const objectives: ObjectiveData[] = [
        { type: "destroy_enemies", description: "Destroy 1 enemy", count: 1 },
      ];
      manager = new ObjectiveManager(objectives);
      manager.recordKill();
      manager.setFailed();
      expect(manager.outcome).toBe("failure");
    });
  });
});
