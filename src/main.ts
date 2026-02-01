// ABOUTME: Entry point orchestrating the game flow: menu → briefing → hangar → fly → debrief.
// ABOUTME: Fetches mission JSON, loads aircraft catalog, and manages scene transitions.

import { Game } from "./Game";
import { BriefingScene } from "./BriefingScene";
import { DebriefScene } from "./DebriefScene";
import { HangarScene } from "./HangarScene";
import { MenuScene } from "./MenuScene";
import { SettingsScene, loadSettings, saveSettings } from "./SettingsScene";
import { ProgressionManager } from "./ProgressionManager";
import { loadAircraftCatalog, getAircraftCatalog } from "./AircraftData";
import type { MissionData } from "./MissionData";
import type { MissionResult } from "./DebriefScene";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const progression = new ProgressionManager();

function showMenu(): void {
  let menu: MenuScene | null = null;
  menu = new MenuScene(document.body, {
    onNewGame: () => {
      menu?.dispose();
      loadMissionAndBrief("/missions/pacific-01.json");
    },
    onContinue: () => {
      menu?.dispose();
      loadMissionAndBrief("/missions/pacific-01.json");
    },
    onSettings: () => {
      menu?.dispose();
      showSettings();
    },
  });
}

function showSettings(): void {
  const settings = loadSettings();
  let scene: SettingsScene | null = null;
  scene = new SettingsScene(document.body, () => {
    if (scene) {
      saveSettings(scene.getSettings());
    }
    scene?.dispose();
    showMenu();
  }, settings);
}

async function loadMissionAndBrief(missionUrl: string): Promise<void> {
  const response = await fetch(missionUrl);
  const mission: MissionData = await response.json();
  showBriefing(mission);
}

function showBriefing(mission: MissionData): void {
  let briefing: BriefingScene | null = null;
  briefing = new BriefingScene(mission, document.body, () => {
    briefing?.dispose();
    showHangar(mission);
  });
}

function showHangar(mission: MissionData): void {
  const catalog = getAircraftCatalog();
  const allIds = catalog.aircraft.map((a) => a.id);
  const lockedIds = progression.getLockedAircraftIds(allIds);
  let hangar: HangarScene | null = null;
  hangar = new HangarScene(catalog.aircraft, lockedIds, document.body, (aircraftId: string) => {
    hangar?.dispose();
    startMission(mission, aircraftId);
  });
}

function startMission(mission: MissionData, aircraftId: string): void {
  let game: Game | null = null;
  game = new Game(canvas, mission, (result: MissionResult) => {
    game?.dispose();
    game = null;
    progression.completeMission(mission.id, result);
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
      showMenu();
    },
  );
}

async function start(): Promise<void> {
  await loadAircraftCatalog("/data/aircraft.json");
  showMenu();
}

start();
