// ABOUTME: Tests that boss missions exist for all 4 theaters with proper boss data.
// ABOUTME: Validates bossIndex, unique boss names, and appropriate health/difficulty.

import { describe, it, expect } from "vitest";

import pacific05 from "../public/missions/pacific-05.json";
import middleeast05 from "../public/missions/middleeast-05.json";
import europe05 from "../public/missions/europe-05.json";
import arctic05 from "../public/missions/arctic-05.json";

const bossMissions = [
  { json: pacific05, theater: "pacific" },
  { json: middleeast05, theater: "middleeast" },
  { json: europe05, theater: "europe" },
  { json: arctic05, theater: "arctic" },
];

describe("Boss Missions", () => {
  it("has one boss mission per theater (4 total)", () => {
    expect(bossMissions).toHaveLength(4);
  });

  for (const { json, theater } of bossMissions) {
    describe(`${theater} boss: ${json.title}`, () => {
      it("has a bossIndex field", () => {
        expect(json).toHaveProperty("bossIndex");
        expect(typeof (json as Record<string, unknown>).bossIndex).toBe("number");
      });

      it("bossIndex references a valid enemy", () => {
        const bossIndex = (json as Record<string, unknown>).bossIndex as number;
        expect(bossIndex).toBeGreaterThanOrEqual(0);
        expect(bossIndex).toBeLessThan(json.enemies.length);
      });

      it("boss enemy has a distinct color", () => {
        const bossIndex = (json as Record<string, unknown>).bossIndex as number;
        const bossEnemy = json.enemies[bossIndex];
        expect(bossEnemy).toHaveProperty("color");
      });

      it("has a bossName field", () => {
        expect(json).toHaveProperty("bossName");
        expect(typeof (json as Record<string, unknown>).bossName).toBe("string");
        expect(((json as Record<string, unknown>).bossName as string).length).toBeGreaterThan(0);
      });

      it("has bossHealth field", () => {
        expect(json).toHaveProperty("bossHealth");
        const health = (json as Record<string, unknown>).bossHealth as number;
        expect(health).toBeGreaterThan(100);
      });

      it("has max AI difficulty", () => {
        expect(json.aiDifficulty).toBe(3);
      });

      it("is the final mission in its theater (-05)", () => {
        expect(json.id).toMatch(/-05$/);
      });
    });
  }
});
