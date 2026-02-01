// ABOUTME: Scoring formula and medal threshold calculations.
// ABOUTME: Derives medal rank (Bronze, Silver, Gold) from mission score.

export type Medal = "none" | "bronze" | "silver" | "gold";

const KILL_SCORE = 500;
const TIME_BONUS_BASE = 1000;
const TIME_BONUS_DECAY = 10;
const ACCURACY_BONUS = 1000;
const LOW_DAMAGE_BONUS = 500;

export const MEDAL_THRESHOLDS = {
  bronze: 500,
  silver: 1500,
  gold: 2500,
} as const;

export interface ScoreBreakdown {
  kills: number;
  timeBonus: number;
  accuracyBonus: number;
  damagePenalty: number;
  total: number;
}

export function calculateScore(
  kills: number,
  timeSeconds: number,
  shotsFired: number,
  shotsHit: number,
  damageTaken: number,
): ScoreBreakdown {
  const killScore = kills * KILL_SCORE;
  const timeBonus = Math.max(0, TIME_BONUS_BASE - timeSeconds * TIME_BONUS_DECAY);
  const accuracy = shotsFired > 0 ? shotsHit / shotsFired : 0;
  const accuracyBonus = Math.round(accuracy * ACCURACY_BONUS);
  const damagePenalty = Math.round(damageTaken * 5);
  const total = Math.max(0, killScore + timeBonus + accuracyBonus - damagePenalty);
  return { kills: killScore, timeBonus, accuracyBonus, damagePenalty, total };
}

export function getMedal(score: number): Medal {
  if (score >= MEDAL_THRESHOLDS.gold) return "gold";
  if (score >= MEDAL_THRESHOLDS.silver) return "silver";
  if (score >= MEDAL_THRESHOLDS.bronze) return "bronze";
  return "none";
}
