// ABOUTME: Entry point that loads a mission briefing, then starts the game on launch.
// ABOUTME: Manages the briefing → gameplay scene transition.

import { Game } from "./Game";
import { BriefingScene } from "./BriefingScene";
import type { MissionData } from "./MissionData";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

async function start(): Promise<void> {
  const response = await fetch("/missions/pacific-01.json");
  const mission: MissionData = await response.json();

  let briefing: BriefingScene | null = null;
  briefing = new BriefingScene(mission, document.body, () => {
    briefing?.dispose();
    new Game(canvas);
  });
}

start();
