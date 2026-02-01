// ABOUTME: Entry point orchestrating the game flow: menu → theater select → briefing → hangar → fly → debrief.
// ABOUTME: Fetches mission JSON, loads aircraft catalog, and manages scene transitions.

import { Game } from "./Game";
import { BriefingScene } from "./BriefingScene";
import { DebriefScene } from "./DebriefScene";
import { HangarScene } from "./HangarScene";
import { MenuScene } from "./MenuScene";
import { TheaterSelectScene } from "./TheaterSelectScene";
import { SettingsScene, loadSettings, saveSettings } from "./SettingsScene";
import { ProgressionManager } from "./ProgressionManager";
import { loadAircraftCatalog, getAircraftCatalog } from "./AircraftData";
import { CAMPAIGN_THEATERS } from "./MissionManifest";
import type { MissionData } from "./MissionData";
import type { MissionResult } from "./DebriefScene";
import type { TheaterInfo } from "./TheaterSelectScene";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const progression = new ProgressionManager();

function showMenu(): void {
  let menu: MenuScene | null = null;
  menu = new MenuScene(document.body, {
    onNewGame: () => {
      menu?.dispose();
      showTheaterSelect();
    },
    onContinue: () => {
      menu?.dispose();
      showTheaterSelect();
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

function buildTheaterInfos(): TheaterInfo[] {
  return CAMPAIGN_THEATERS.map((t) => {
    const unlocked = progression.isTheaterUnlocked(t.id);
    const progress = progression.getTheaterProgress(t.id);
    return {
      id: t.id,
      name: t.name,
      unlocked,
      missions: unlocked
        ? t.missions.map((m) => ({
            id: m.id,
            title: m.title,
            completed: progression.isMissionCompleted(m.id),
            unlocked: progression.isMissionUnlocked(m.id),
            medal: progression.getMissionMedal(m.id),
          }))
        : [],
      completedCount: progress.completed,
      totalCount: progress.total,
    };
  });
}

function showTheaterSelect(): void {
  const theaters = buildTheaterInfos();
  let scene: TheaterSelectScene | null = null;

  const missionLookup = new Map<string, string>();
  for (const t of CAMPAIGN_THEATERS) {
    for (const m of t.missions) {
      missionLookup.set(m.id, m.jsonPath);
    }
  }

  scene = new TheaterSelectScene(
    theaters,
    document.body,
    (missionId: string) => {
      const jsonPath = missionLookup.get(missionId);
      if (!jsonPath) return;
      scene?.dispose();
      loadMissionAndBrief(jsonPath);
    },
    () => {
      scene?.dispose();
      showMenu();
    },
  );
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

async function startMission(mission: MissionData, aircraftId: string): Promise<void> {
  let game: Game | null = null;
  game = new Game(canvas, mission, (result: MissionResult) => {
    game?.dispose();
    game = null;
    progression.completeMission(mission.id, result);
    showDebrief(result, mission);
  }, aircraftId);

  await game.loadModels(aircraftId);
}

function showDebrief(result: MissionResult, mission: MissionData): void {
  let debrief: DebriefScene | null = null;
  debrief = new DebriefScene(
    result,
    document.body,
    () => {
      debrief?.dispose();
      showTheaterSelect();
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
