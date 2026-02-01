// ABOUTME: TypeScript interfaces defining the mission JSON schema.
// ABOUTME: Describes theaters, objectives, enemy spawns, and player start positions.

export type Theater = "pacific" | "middleeast" | "europe" | "arctic";

export type ObjectiveType = "destroy_enemies" | "destroy_all" | "survive_time" | "destroy_ground_targets" | "carrier_landing";

export interface ObjectiveData {
  type: ObjectiveType;
  description: string;
  count?: number;
  timeSeconds?: number;
}

export interface EnemySpawn {
  position: { x: number; y: number; z: number };
  color?: { r: number; g: number; b: number };
}

export interface FormationSpawn {
  type: "wing" | "diamond";
  /** Indices into the enemies array: first is leader, rest are wingmen. */
  members: number[];
}

export interface PlayerStart {
  position: { x: number; y: number; z: number };
  heading: number;
}

export type GroundTargetType = "sam" | "bunker" | "vehicle" | "radar";

export interface GroundTargetSpawn {
  type: GroundTargetType;
  position: { x: number; y: number; z: number };
}

export interface MissionData {
  id: string;
  title: string;
  description: string;
  theater: Theater;
  playerStart: PlayerStart;
  enemies: EnemySpawn[];
  formations?: FormationSpawn[];
  groundTargets?: GroundTargetSpawn[];
  objectives: ObjectiveData[];
  /** AI difficulty level (1=easy, 2=medium, 3=hard). Defaults to 1. */
  aiDifficulty?: number;
  /** Index into enemies array identifying the boss. Absent for non-boss missions. */
  bossIndex?: number;
  /** Display name for the boss (shown on health bar). */
  bossName?: string;
  /** Boss health override (higher than standard enemies). */
  bossHealth?: number;
  /** Carrier placement for carrier operations missions. */
  carrier?: CarrierSpawn;
  /** When true, player starts on carrier deck (catapult takeoff). */
  startOnDeck?: boolean;
}

export interface CarrierSpawn {
  position: { x: number; y: number; z: number };
  heading?: number;
}
