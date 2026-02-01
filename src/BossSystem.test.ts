// ABOUTME: Tests for BossSystem — verifies phase transitions, special attacks, and health tracking.
// ABOUTME: Boss phases escalate behavior as health decreases.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BossSystem, BossPhase } from "./BossSystem";
import type { Aircraft } from "./Aircraft";
import type { AIInput } from "./AIInput";

function createMockAircraft(health = 100): Aircraft & { input: AIInput } {
  return {
    mesh: {
      position: { x: 0, y: 50, z: 100 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
    },
    speed: 50,
    health,
    alive: health > 0,
    input: {
      pitch: 0,
      yaw: 0,
      roll: 0,
      throttle: 0,
      fire: false,
      cycleTarget: false,
      lockOn: false,
      cycleWeapon: false,
      deployCountermeasure: false,
    },
    flightParams: undefined,
    damage: vi.fn(),
  } as unknown as Aircraft & { input: AIInput };
}

function createMockPlayer(): Aircraft {
  return {
    mesh: {
      position: { x: 0, y: 50, z: 0 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
    },
    speed: 50,
    health: 100,
    alive: true,
  } as unknown as Aircraft;
}

describe("BossSystem", () => {
  let boss: BossSystem;

  beforeEach(() => {
    vi.resetAllMocks();
    boss = new BossSystem();
  });

  it("starts in the normal phase", () => {
    expect(boss.phase).toBe(BossPhase.Normal);
  });

  it("returns full health ratio initially", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    expect(boss.getHealthRatio()).toBe(1);
  });

  it("transitions to enraged phase at 50% health", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    enemy.health = 100;
    boss.update(enemy, createMockPlayer(), 0.016);
    expect(boss.phase).toBe(BossPhase.Enraged);
  });

  it("transitions to desperate phase at 25% health", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    enemy.health = 50;
    boss.update(enemy, createMockPlayer(), 0.016);
    expect(boss.phase).toBe(BossPhase.Desperate);
  });

  it("tracks health ratio correctly", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    enemy.health = 150;
    boss.update(enemy, createMockPlayer(), 0.016);
    expect(boss.getHealthRatio()).toBeCloseTo(0.75);
  });

  it("reports boss as dead when health reaches 0", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    enemy.health = 0;
    enemy.alive = false;
    boss.update(enemy, createMockPlayer(), 0.016);
    expect(boss.isDead()).toBe(true);
  });

  it("boss is not dead while alive", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    expect(boss.isDead()).toBe(false);
  });

  it("enraged phase sets higher aggression (throttle boost)", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    enemy.health = 90; // triggers enraged
    boss.update(enemy, createMockPlayer(), 0.016);
    expect(boss.phase).toBe(BossPhase.Enraged);
    // In enraged phase, the boss should force fire=true when in range
    expect(boss.aggressionModifier).toBeGreaterThan(1);
  });

  it("desperate phase has even higher aggression", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    enemy.health = 40;
    boss.update(enemy, createMockPlayer(), 0.016);
    expect(boss.phase).toBe(BossPhase.Desperate);
    // Desperate (2.0) > Enraged (1.5)
    expect(boss.aggressionModifier).toBeGreaterThan(1.5);
  });

  it("special attack cooldown ticks down", () => {
    const enemy = createMockAircraft(200);
    boss.init(enemy);
    enemy.health = 90; // enraged
    // trigger one special attack cycle
    boss.update(enemy, createMockPlayer(), 0.016);
    const cooldownBefore = boss.specialAttackCooldown;
    boss.update(enemy, createMockPlayer(), 1.0);
    expect(boss.specialAttackCooldown).toBeLessThan(cooldownBefore);
  });

  it("does not transition phases when not initialized", () => {
    const enemy = createMockAircraft(50);
    // Not calling init — should stay in Normal
    boss.update(enemy, createMockPlayer(), 0.016);
    expect(boss.phase).toBe(BossPhase.Normal);
  });
});
