// ABOUTME: TypeScript interfaces defining the mission JSON schema.
// ABOUTME: Describes theaters, objectives, enemy spawns, and player start positions.

export type Theater = "pacific" | "middleeast" | "europe" | "arctic";

export type ObjectiveType = "destroy_enemies" | "destroy_all" | "survive_time";

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

export interface PlayerStart {
  position: { x: number; y: number; z: number };
  heading: number;
}

export interface MissionData {
  id: string;
  title: string;
  description: string;
  theater: Theater;
  playerStart: PlayerStart;
  enemies: EnemySpawn[];
  objectives: ObjectiveData[];
}
