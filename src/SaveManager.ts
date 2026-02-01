// ABOUTME: Persists game progress to localStorage with versioned keys.
// ABOUTME: Handles corrupt or missing save data by falling back to defaults.

const SAVE_KEY = "topgun_save_v1";

export interface SaveData {
  version: number;
  completedMissions: string[];
  unlockedAircraft: string[];
  missionScores: Record<string, number>;
}

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultSave(): SaveData {
  return {
    version: 1,
    completedMissions: [],
    unlockedAircraft: ["f-14"],
    missionScores: {},
  };
}

let storage: Storage = window.localStorage;

export const SaveManager = {
  setStorage(s: Storage): void {
    storage = s;
  },

  load(): SaveData {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    try {
      const parsed = JSON.parse(raw);
      const defaults = defaultSave();
      return {
        version: parsed.version ?? defaults.version,
        completedMissions: parsed.completedMissions ?? defaults.completedMissions,
        unlockedAircraft: parsed.unlockedAircraft ?? defaults.unlockedAircraft,
        missionScores: parsed.missionScores ?? defaults.missionScores,
      };
    } catch {
      return defaultSave();
    }
  },

  save(data: SaveData): void {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
  },
};
