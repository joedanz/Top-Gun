// ABOUTME: Tests for SaveManager — localStorage persistence with versioned keys.
// ABOUTME: Validates save, load, corruption handling, and default state.

import { describe, it, expect, beforeEach } from "vitest";
import { SaveManager } from "./SaveManager";
import type { SaveData, Storage } from "./SaveManager";

function createMockStorage(): Storage & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
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

describe("SaveManager", () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    SaveManager.setStorage(mockStorage);
  });

  it("returns default save data when no save exists", () => {
    const data = SaveManager.load();
    expect(data.completedMissions).toEqual([]);
    expect(data.unlockedAircraft).toEqual(["f-14"]);
    expect(data.missionScores).toEqual({});
    expect(data.version).toBe(1);
  });

  it("persists and loads save data", () => {
    const save: SaveData = {
      version: 1,
      completedMissions: ["pacific-01"],
      unlockedAircraft: ["f-14", "p-51"],
      missionScores: { "pacific-01": 1200 },
    };
    SaveManager.save(save);
    const loaded = SaveManager.load();
    expect(loaded).toEqual(save);
  });

  it("handles corrupt save data gracefully", () => {
    mockStorage.setItem("topgun_save_v1", "not valid json{{{");
    const data = SaveManager.load();
    expect(data.completedMissions).toEqual([]);
    expect(data.unlockedAircraft).toEqual(["f-14"]);
  });

  it("handles missing fields in saved data gracefully", () => {
    mockStorage.setItem("topgun_save_v1", JSON.stringify({ version: 1 }));
    const data = SaveManager.load();
    expect(data.completedMissions).toEqual([]);
    expect(data.unlockedAircraft).toEqual(["f-14"]);
    expect(data.missionScores).toEqual({});
  });

  it("uses a versioned localStorage key", () => {
    SaveManager.save({
      version: 1,
      completedMissions: [],
      unlockedAircraft: ["f-14"],
      missionScores: {},
    });
    expect(mockStorage.getItem("topgun_save_v1")).not.toBeNull();
  });
});
