// ABOUTME: Entry point orchestrating the mission loop: briefing → fly → debrief → menu/next.
// ABOUTME: Fetches mission JSON and manages scene transitions.

import { Game } from "./Game";
import { BriefingScene } from "./BriefingScene";
import { DebriefScene } from "./DebriefScene";
import type { MissionData } from "./MissionData";
import type { MissionResult } from "./DebriefScene";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

function showBriefing(mission: MissionData): void {
  let briefing: BriefingScene | null = null;
  briefing = new BriefingScene(mission, document.body, () => {
    briefing?.dispose();
    startMission(mission);
  });
}

function startMission(mission: MissionData): void {
  let game: Game | null = null;
  game = new Game(canvas, mission, (result: MissionResult) => {
    game?.dispose();
    game = null;
    showDebrief(result, mission);
  });
}

function showDebrief(result: MissionResult, mission: MissionData): void {
  let debrief: DebriefScene | null = null;
  debrief = new DebriefScene(
    result,
    document.body,
    () => {
      // Next mission — for now, replay the same mission
      debrief?.dispose();
      showBriefing(mission);
    },
    () => {
      // Return to menu — for now, restart briefing
      debrief?.dispose();
      showBriefing(mission);
    },
  );
}

async function start(): Promise<void> {
  const response = await fetch("/missions/pacific-01.json");
  const mission: MissionData = await response.json();
  showBriefing(mission);
}

start();
