// ABOUTME: Static manifest of all campaign missions organized by theater.
// ABOUTME: Provides mission metadata for theater selection without fetching individual JSON files.

import type { Theater } from "./MissionData";

export interface MissionEntry {
  id: string;
  title: string;
  jsonPath: string;
}

export interface TheaterManifest {
  id: Theater;
  name: string;
  missions: MissionEntry[];
}

export const CAMPAIGN_THEATERS: TheaterManifest[] = [
  {
    id: "pacific",
    name: "Pacific",
    missions: [
      { id: "pacific-01", title: "First Sortie", jsonPath: "/missions/pacific-01.json" },
      { id: "pacific-02", title: "Carrier Quals", jsonPath: "/missions/pacific-02.json" },
      { id: "pacific-03", title: "Island Defense", jsonPath: "/missions/pacific-03.json" },
      { id: "pacific-04", title: "Fleet Escort", jsonPath: "/missions/pacific-04.json" },
      { id: "pacific-05", title: "Storm Warning", jsonPath: "/missions/pacific-05.json" },
    ],
  },
  {
    id: "middleeast",
    name: "Middle East",
    missions: [
      { id: "middleeast-01", title: "Desert Strike", jsonPath: "/missions/middleeast-01.json" },
      { id: "middleeast-02", title: "SAM Suppression", jsonPath: "/missions/middleeast-02.json" },
      { id: "middleeast-03", title: "Convoy Intercept", jsonPath: "/missions/middleeast-03.json" },
      { id: "middleeast-04", title: "Radar Knockout", jsonPath: "/missions/middleeast-04.json" },
      { id: "middleeast-05", title: "Sandstorm Assault", jsonPath: "/missions/middleeast-05.json" },
    ],
  },
  {
    id: "europe",
    name: "Europe",
    missions: [
      { id: "europe-01", title: "High Altitude Intercept", jsonPath: "/missions/europe-01.json" },
      { id: "europe-02", title: "Stealth Recon", jsonPath: "/missions/europe-02.json" },
      { id: "europe-03", title: "Escort Duty", jsonPath: "/missions/europe-03.json" },
      { id: "europe-04", title: "Air Superiority", jsonPath: "/missions/europe-04.json" },
      { id: "europe-05", title: "Fortress Strike", jsonPath: "/missions/europe-05.json" },
    ],
  },
  {
    id: "arctic",
    name: "Arctic",
    missions: [
      { id: "arctic-01", title: "Cold Front", jsonPath: "/missions/arctic-01.json" },
      { id: "arctic-02", title: "Ice Station", jsonPath: "/missions/arctic-02.json" },
      { id: "arctic-03", title: "Aurora Borealis", jsonPath: "/missions/arctic-03.json" },
      { id: "arctic-04", title: "Frozen Airfield", jsonPath: "/missions/arctic-04.json" },
      { id: "arctic-05", title: "Final Countdown", jsonPath: "/missions/arctic-05.json" },
    ],
  },
];
