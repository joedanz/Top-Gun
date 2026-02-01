// ABOUTME: Entry point orchestrating the mission loop: briefing → hangar → fly → debrief.
// ABOUTME: Fetches mission JSON, loads aircraft catalog, and manages scene transitions.

import { Game } from "./Game";
import { BriefingScene } from "./BriefingScene";
import { DebriefScene } from "./DebriefScene";
import { HangarScene } from "./HangarScene";
import { loadAircraftCatalog, getAircraftCatalog } from "./AircraftData";
import type { MissionData } from "./MissionData";
import type { MissionResult } from "./DebriefScene";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

function showBriefing(mission: MissionData): void {
  let briefing: BriefingScene | null = null;
  briefing = new BriefingScene(mission, document.body, () => {
    briefing?.dispose();
    showHangar(mission);
  });
}

function showHangar(mission: MissionData): void {
  const catalog = getAircraftCatalog();
  let hangar: HangarScene | null = null;
  hangar = new HangarScene(catalog.aircraft, [], document.body, (aircraftId: string) => {
    hangar?.dispose();
    startMission(mission, aircraftId);
  });
}

function startMission(mission: MissionData, aircraftId: string): void {
  let game: Game | null = null;
  game = new Game(canvas, mission, (result: MissionResult) => {
    game?.dispose();
    game = null;
    showDebrief(result, mission);
  }, aircraftId);
}

function showDebrief(result: MissionResult, mission: MissionData): void {
  let debrief: DebriefScene | null = null;
  debrief = new DebriefScene(
    result,
    document.body,
    () => {
      debrief?.dispose();
      showBriefing(mission);
    },
    () => {
      debrief?.dispose();
      showBriefing(mission);
    },
  );
}

async function start(): Promise<void> {
  await loadAircraftCatalog("/data/aircraft.json");
  const response = await fetch("/missions/pacific-01.json");
  const mission: MissionData = await response.json();
  showBriefing(mission);
}

start();
