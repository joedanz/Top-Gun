// ABOUTME: Manages boss enemy phase transitions and aggression scaling.
// ABOUTME: Boss escalates through Normal → Enraged → Desperate as health decreases.

import type { Aircraft } from "./Aircraft";

export enum BossPhase {
  Normal = "normal",
  Enraged = "enraged",
  Desperate = "desperate",
}

const ENRAGED_THRESHOLD = 0.5;
const DESPERATE_THRESHOLD = 0.25;

const AGGRESSION: Record<BossPhase, number> = {
  [BossPhase.Normal]: 1.0,
  [BossPhase.Enraged]: 1.5,
  [BossPhase.Desperate]: 2.0,
};

const SPECIAL_COOLDOWNS: Record<BossPhase, number> = {
  [BossPhase.Normal]: Infinity,
  [BossPhase.Enraged]: 8,
  [BossPhase.Desperate]: 4,
};

export class BossSystem {
  phase = BossPhase.Normal;
  aggressionModifier = 1.0;
  specialAttackCooldown = 0;

  private maxHealth = 0;
  private initialized = false;

  init(enemy: Aircraft): void {
    this.maxHealth = enemy.health;
    this._lastHealth = enemy.health;
    this.initialized = true;
  }

  getHealthRatio(): number {
    if (this.maxHealth <= 0) return 0;
    return this._lastHealth / this.maxHealth;
  }

  isDead(): boolean {
    return this.initialized && !this._lastAlive;
  }

  private _lastHealth = 0;
  private _lastAlive = true;

  update(enemy: Aircraft, _player: Aircraft, dt: number): void {
    if (!this.initialized) return;

    this._lastHealth = enemy.health;
    this._lastAlive = enemy.alive;

    const ratio = this.getHealthRatio();

    if (ratio <= DESPERATE_THRESHOLD) {
      this.phase = BossPhase.Desperate;
    } else if (ratio <= ENRAGED_THRESHOLD) {
      this.phase = BossPhase.Enraged;
    } else {
      this.phase = BossPhase.Normal;
    }

    this.aggressionModifier = AGGRESSION[this.phase];

    // Tick special attack cooldown
    if (this.specialAttackCooldown > 0) {
      this.specialAttackCooldown -= dt;
    }

    // Reset cooldown when it reaches zero in enraged/desperate phases
    if (this.specialAttackCooldown <= 0 && this.phase !== BossPhase.Normal) {
      this.specialAttackCooldown = SPECIAL_COOLDOWNS[this.phase];
    }
  }
}
