// ABOUTME: TypeScript interfaces and registry for data-driven aircraft definitions.
// ABOUTME: Loads aircraft stats from JSON so the flight model is not hardcoded per type.

import type { FlightParams } from "./FlightSystem";

export interface WeaponLoadout {
  gunAmmo: number;
  missiles: number;
  radarMissiles?: number;
  rockets?: number;
  bombs?: number;
}

export interface AircraftStats {
  id: string;
  name: string;
  flightParams: FlightParams;
  weaponLoadout: WeaponLoadout;
}

export interface AircraftCatalog {
  aircraft: AircraftStats[];
}

let catalog: AircraftCatalog | null = null;

export async function loadAircraftCatalog(url: string): Promise<AircraftCatalog> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load aircraft data: ${res.status}`);
  catalog = (await res.json()) as AircraftCatalog;
  return catalog;
}

export function getAircraftStats(id: string): AircraftStats {
  if (!catalog) throw new Error("Aircraft catalog not loaded");
  const stats = catalog.aircraft.find((a) => a.id === id);
  if (!stats) throw new Error(`Unknown aircraft: ${id}`);
  return stats;
}

export function getAircraftCatalog(): AircraftCatalog {
  if (!catalog) throw new Error("Aircraft catalog not loaded");
  return catalog;
}

export function resetCatalog(): void {
  catalog = null;
}
