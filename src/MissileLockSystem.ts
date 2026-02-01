// ABOUTME: Manages missile lock-on state machine and missile launching/tracking.
// ABOUTME: Holds lock-on key to acquire lock, then fire to launch a homing missile.

import type { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, Ellipse, TextBlock } from "@babylonjs/gui";
import type { Aircraft } from "./Aircraft";
import { Missile } from "./Missile";

const LOCK_TIME = 2.0; // seconds to achieve lock
const LOCK_CONE = Math.PI / 6; // 30-degree half-angle cone
const DEFAULT_MISSILE_AMMO = 4;

export enum LockState {
  Idle = "idle",
  Locking = "locking",
  Locked = "locked",
}

export class MissileLockSystem {
  state = LockState.Idle;
  lockProgress = 0;
  missiles: Missile[] = [];
  ammo: number;

  private scene: Scene;
  private prevFire = false;
  private lockIndicator: Ellipse;
  private lockText: TextBlock;

  constructor(scene: Scene, ammo = DEFAULT_MISSILE_AMMO) {
    this.scene = scene;
    this.ammo = ammo;

    const ui = AdvancedDynamicTexture.CreateFullscreenUI("missileLockUI") as unknown as { addControl: (c: unknown) => void };

    this.lockIndicator = new Ellipse();
    this.lockIndicator.width = "80px";
    this.lockIndicator.height = "80px";
    this.lockIndicator.color = "#ff4444";
    this.lockIndicator.thickness = 3;
    this.lockIndicator.isVisible = false;
    this.lockIndicator.isPointerBlocker = false;
    this.lockIndicator.isHitTestVisible = false;
    ui.addControl(this.lockIndicator);

    this.lockText = new TextBlock();
    this.lockText.color = "#ff4444";
    this.lockText.fontSize = 14;
    this.lockText.text = "";
    this.lockIndicator.addControl(this.lockText);
  }

  update(player: Aircraft, target: Aircraft | null, dt: number): void {
    // Update existing missiles
    for (const m of this.missiles) {
      m.update(dt);
    }
    this.missiles = this.missiles.filter((m) => m.alive);

    // No target — reset to idle
    if (!target || !target.alive) {
      this.state = LockState.Idle;
      this.lockProgress = 0;
      this.lockIndicator.isVisible = false;
      this.prevFire = player.input.fire;
      return;
    }

    const lockHeld = player.input.lockOn;

    if (!lockHeld) {
      this.state = LockState.Idle;
      this.lockProgress = 0;
      this.lockIndicator.isVisible = false;
      this.prevFire = player.input.fire;
      return;
    }

    // Check if target is within lock cone
    if (!this.isInLockCone(player, target)) {
      this.state = LockState.Idle;
      this.lockProgress = 0;
      this.lockIndicator.isVisible = false;
      this.prevFire = player.input.fire;
      return;
    }

    // Advance lock-on
    if (this.state === LockState.Idle || this.state === LockState.Locking) {
      this.lockProgress += dt;
      if (this.lockProgress >= LOCK_TIME) {
        this.state = LockState.Locked;
        this.lockProgress = LOCK_TIME;
      } else {
        this.state = LockState.Locking;
      }
    }

    // Fire missile on fire press (edge-triggered) when locked
    const firePressed = player.input.fire && !this.prevFire;
    if (this.state === LockState.Locked && firePressed && this.ammo > 0) {
      const pos = player.mesh.position;
      const rot = player.mesh.rotation;
      this.missiles.push(
        new Missile(
          this.scene,
          { x: pos.x, y: pos.y, z: pos.z },
          { x: rot.x, y: rot.y, z: rot.z },
          target,
        ),
      );
      this.ammo--;
      // Reset to idle after firing
      this.state = LockState.Idle;
      this.lockProgress = 0;
    }

    // Update HUD indicator
    this.lockIndicator.isVisible = this.state !== LockState.Idle;
    if (this.state === LockState.Locking) {
      const pct = Math.round((this.lockProgress / LOCK_TIME) * 100);
      this.lockText.text = `${pct}%`;
      this.lockIndicator.color = "#ffcc00";
    } else if (this.state === LockState.Locked) {
      this.lockText.text = "LOCK";
      this.lockIndicator.color = "#ff0000";
    }

    this.prevFire = player.input.fire;
  }

  private isInLockCone(player: Aircraft, target: Aircraft): boolean {
    const pp = player.mesh.position;
    const tp = target.mesh.position;
    const dx = tp.x - pp.x;
    const dz = tp.z - pp.z;

    // Player forward direction from yaw
    const fwdX = Math.sin(player.mesh.rotation.y);
    const fwdZ = Math.cos(player.mesh.rotation.y);

    const dot = dx * fwdX + dz * fwdZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.001) return true;

    const angle = Math.acos(Math.min(1, Math.max(-1, dot / dist)));
    return angle <= LOCK_CONE;
  }
}
