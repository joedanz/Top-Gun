// ABOUTME: Manages game progression — scoring, mission unlocks, and aircraft unlocks.
// ABOUTME: Persists state via SaveManager; provides milestone-based unlock logic.

import { SaveManager } from "./SaveManager";
import type { SaveData } from "./SaveManager";
import type { MissionResult } from "./DebriefScene";
import type { Theater } from "./MissionData";
import { calculateScore, getMedal } from "./Scoring";
import type { Medal } from "./Scoring";

const THEATER_MISSIONS: Record<string, string[]> = {
  pacific: ["pacific-01", "pacific-02", "pacific-03", "pacific-04", "pacific-05"],
  middleeast: ["middleeast-01", "middleeast-02", "middleeast-03", "middleeast-04", "middleeast-05"],
  europe: ["europe-01", "europe-02", "europe-03", "europe-04", "europe-05"],
  arctic: ["arctic-01", "arctic-02", "arctic-03", "arctic-04", "arctic-05"],
};

const THEATER_AIRCRAFT_UNLOCKS: Record<string, string> = {
  pacific: "fa-18",
  middleeast: "p-51",
};

const MISSION_ORDER = [
  "pacific-01",
  "pacific-02",
  "pacific-03",
  "pacific-04",
  "pacific-05",
  "middleeast-01",
  "middleeast-02",
  "middleeast-03",
  "middleeast-04",
  "middleeast-05",
  "europe-01",
  "europe-02",
  "europe-03",
  "europe-04",
  "europe-05",
  "arctic-01",
  "arctic-02",
  "arctic-03",
  "arctic-04",
  "arctic-05",
];

export class ProgressionManager {
  private data: SaveData;

  constructor() {
    this.data = SaveManager.load();
  }

  calculateScore(result: MissionResult): number {
    if (result.outcome === "failure") return 0;
    return result.score;
  }

  completeMission(missionId: string, result: MissionResult): void {
    if (result.outcome === "failure") return;
    if (!this.data.completedMissions.includes(missionId)) {
      this.data.completedMissions.push(missionId);
    }
    const score = result.score;
    const existing = this.data.missionScores[missionId] ?? 0;
    if (score > existing) {
      this.data.missionScores[missionId] = score;
    }
    SaveManager.save(this.data);
  }

  getMissionMedal(missionId: string): Medal {
    return getMedal(this.getMissionScore(missionId));
  }

  completeTheater(theater: Theater): void {
    const aircraftId = THEATER_AIRCRAFT_UNLOCKS[theater];
    if (aircraftId && !this.data.unlockedAircraft.includes(aircraftId)) {
      this.data.unlockedAircraft.push(aircraftId);
    }
    SaveManager.save(this.data);
  }

  isMissionCompleted(missionId: string): boolean {
    return this.data.completedMissions.includes(missionId);
  }

  getMissionScore(missionId: string): number {
    return this.data.missionScores[missionId] ?? 0;
  }

  isMissionUnlocked(missionId: string): boolean {
    const idx = MISSION_ORDER.indexOf(missionId);
    if (idx <= 0) return true;
    const prev = MISSION_ORDER[idx - 1];
    return this.data.completedMissions.includes(prev);
  }

  getLockedAircraftIds(allIds: string[]): string[] {
    return allIds.filter((id) => !this.data.unlockedAircraft.includes(id));
  }

  isTheaterUnlocked(theater: string): boolean {
    if (theater === "pacific" || theater === "middleeast") return true;
    if (theater === "europe") {
      return this.isTheaterComplete("pacific") || this.isTheaterComplete("middleeast");
    }
    if (theater === "arctic") {
      return this.isTheaterComplete("europe");
    }
    return false;
  }

  isTheaterComplete(theater: string): boolean {
    const missions = THEATER_MISSIONS[theater] ?? [];
    return missions.length > 0 && missions.every((id) => this.data.completedMissions.includes(id));
  }

  getTheaterProgress(theater: string): { completed: number; total: number } {
    const missions = THEATER_MISSIONS[theater] ?? [];
    const completed = missions.filter((id) => this.data.completedMissions.includes(id)).length;
    return { completed, total: missions.length };
  }
}
