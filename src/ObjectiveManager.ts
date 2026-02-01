// ABOUTME: Tracks mission objective completion for destroy, survive, ground target, and carrier landing objectives.
// ABOUTME: Reports per-objective status with progress strings for HUD display.

import type { ObjectiveData } from "./MissionData";

export interface ObjectiveStatus {
  description: string;
  complete: boolean;
  progress: string;
}

export type MissionOutcome = "in_progress" | "success" | "failure";

export class ObjectiveManager {
  private kills = 0;
  private groundKills = 0;
  private elapsedTime = 0;
  private carrierLanded = false;
  private totalEnemies: number;
  private totalGroundTargets: number;
  private failed = false;

  constructor(
    private objectives: ObjectiveData[],
    totalEnemies = 0,
    totalGroundTargets = 0,
  ) {
    this.totalEnemies = totalEnemies;
    this.totalGroundTargets = totalGroundTargets;
  }

  get outcome(): MissionOutcome {
    if (this.failed) return "failure";
    if (this.allComplete()) return "success";
    return "in_progress";
  }

  setFailed(): void {
    this.failed = true;
  }

  recordKill(): void {
    this.kills++;
  }

  recordGroundKill(): void {
    this.groundKills++;
  }

  recordCarrierLanding(): void {
    this.carrierLanded = true;
  }

  update(dt: number): void {
    this.elapsedTime += dt;
  }

  allComplete(): boolean {
    return this.objectives.every((obj) => this.isComplete(obj));
  }

  getStatuses(): ObjectiveStatus[] {
    return this.objectives.map((obj) => ({
      description: obj.description,
      complete: this.isComplete(obj),
      progress: this.getProgress(obj),
    }));
  }

  private isComplete(obj: ObjectiveData): boolean {
    switch (obj.type) {
      case "destroy_enemies":
        return this.kills >= (obj.count ?? 0);
      case "destroy_all":
        return this.kills >= this.totalEnemies;
      case "survive_time":
        return this.elapsedTime >= (obj.timeSeconds ?? 0);
      case "destroy_ground_targets":
        return this.groundKills >= (obj.count ?? this.totalGroundTargets);
      case "carrier_landing":
        return this.carrierLanded;
    }
  }

  private getProgress(obj: ObjectiveData): string {
    switch (obj.type) {
      case "destroy_enemies":
        return `${this.kills}/${obj.count ?? 0}`;
      case "destroy_all":
        return `${this.kills}/${this.totalEnemies}`;
      case "survive_time":
        return `${Math.floor(this.elapsedTime)}/${obj.timeSeconds ?? 0}s`;
      case "destroy_ground_targets":
        return `${this.groundKills}/${obj.count ?? this.totalGroundTargets}`;
      case "carrier_landing":
        return this.carrierLanded ? "Landed" : "Pending";
    }
  }
}
