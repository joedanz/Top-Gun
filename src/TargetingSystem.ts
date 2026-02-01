// ABOUTME: Manages target selection, reticle overlay, and lead indicator for deflection shooting.
// ABOUTME: Cycles targets with Tab key, projects target and lead positions to screen space.

import { AdvancedDynamicTexture, Ellipse, TextBlock } from "@babylonjs/gui";
import type { Scene, FreeCamera } from "@babylonjs/core";
import type { Aircraft } from "./Aircraft";

const PROJECTILE_SPEED = 500;
const RETICLE_SIZE = 60;
const LEAD_SIZE = 20;

export class TargetingSystem {
  currentTarget: Aircraft | null = null;
  leadPosition: { x: number; y: number; z: number } | null = null;
  reticleVisible = false;
  leadVisible = false;

  private targetIndex = -1;
  private prevCycleTarget = false;
  private ui: { addControl: (c: unknown) => void };
  private reticle: Ellipse;
  private leadMarker: Ellipse;
  private distanceText: TextBlock;
  private prevTargetPositions = new WeakMap<Aircraft, { x: number; y: number; z: number }>();

  constructor() {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("targetingUI") as unknown as { addControl: (c: unknown) => void };

    // Target reticle — diamond/bracket overlay
    this.reticle = new Ellipse();
    this.reticle.width = `${RETICLE_SIZE}px`;
    this.reticle.height = `${RETICLE_SIZE}px`;
    this.reticle.color = "#ffcc00";
    this.reticle.thickness = 2;
    this.reticle.isVisible = false;
    this.reticle.isPointerBlocker = false;
    this.reticle.isHitTestVisible = false;
    this.ui.addControl(this.reticle);

    // Lead indicator — small circle showing where to aim
    this.leadMarker = new Ellipse();
    this.leadMarker.width = `${LEAD_SIZE}px`;
    this.leadMarker.height = `${LEAD_SIZE}px`;
    this.leadMarker.color = "#ff4444";
    this.leadMarker.thickness = 2;
    this.leadMarker.isVisible = false;
    this.leadMarker.isPointerBlocker = false;
    this.leadMarker.isHitTestVisible = false;
    this.ui.addControl(this.leadMarker);

    // Distance readout inside reticle
    this.distanceText = new TextBlock();
    this.distanceText.color = "#ffcc00";
    this.distanceText.fontSize = 12;
    this.distanceText.text = "";
    this.reticle.addControl(this.distanceText);
  }

  update(player: Aircraft, enemies: Aircraft[], camera: FreeCamera | null): void {
    // Filter to alive enemies
    const alive = enemies.filter((e) => e.alive);

    // Handle target selection
    if (alive.length === 0) {
      this.currentTarget = null;
      this.targetIndex = -1;
      this.reticleVisible = false;
      this.leadVisible = false;
      this.reticle.isVisible = false;
      this.leadMarker.isVisible = false;
      this.leadPosition = null;
      return;
    }

    // Auto-select nearest if no target
    if (this.currentTarget === null || !this.currentTarget.alive) {
      this.selectNearest(player, alive);
    }

    // Cycle target on Tab press (edge-triggered)
    const cyclePressed = player.input.cycleTarget;
    if (cyclePressed && !this.prevCycleTarget) {
      this.targetIndex = (this.targetIndex + 1) % alive.length;
      this.currentTarget = alive[this.targetIndex];
    }
    this.prevCycleTarget = cyclePressed;

    // Ensure target is still in alive list
    if (this.currentTarget && !alive.includes(this.currentTarget)) {
      this.selectNearest(player, alive);
    }

    if (!this.currentTarget) {
      this.reticleVisible = false;
      this.leadVisible = false;
      this.reticle.isVisible = false;
      this.leadMarker.isVisible = false;
      this.leadPosition = null;
      return;
    }

    this.reticleVisible = true;

    // Compute distance
    const tp = this.currentTarget.mesh.position;
    const pp = player.mesh.position;
    const dx = tp.x - pp.x;
    const dy = tp.y - pp.y;
    const dz = tp.z - pp.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    this.distanceText.text = `${Math.round(dist)}m`;

    // Compute lead position based on target velocity and bullet travel time
    const bulletTime = dist / PROJECTILE_SPEED;

    // Estimate target velocity from position delta (stored from previous frame)
    const prev = this.prevTargetPositions.get(this.currentTarget);
    if (prev) {
      const vx = (tp.x - prev.x);
      const vy = (tp.y - prev.y);
      const vz = (tp.z - prev.z);

      // Lead position = target position + velocity * bulletTravelTime
      // velocity is already per-frame, scale by bulletTime / assumed dt
      // Simpler: use target's speed and heading
      this.leadPosition = {
        x: tp.x + vx * bulletTime * 60, // rough scale assuming ~60fps frame deltas
        y: tp.y + vy * bulletTime * 60,
        z: tp.z + vz * bulletTime * 60,
      };
      this.leadVisible = true;
    } else {
      // First frame — use target speed and heading for lead
      const tRot = this.currentTarget.mesh.rotation.y;
      const tSpeed = this.currentTarget.speed;
      this.leadPosition = {
        x: tp.x + Math.sin(tRot) * tSpeed * bulletTime,
        y: tp.y,
        z: tp.z + Math.cos(tRot) * tSpeed * bulletTime,
      };
      this.leadVisible = true;
    }

    // Store position for next frame velocity calculation
    this.prevTargetPositions.set(this.currentTarget, { x: tp.x, y: tp.y, z: tp.z });

    // Project to screen space if camera available
    if (camera) {
      this.projectToScreen(camera, tp, this.reticle);
      if (this.leadPosition) {
        this.projectToScreen(camera, this.leadPosition, this.leadMarker);
      }
    }

    this.reticle.isVisible = this.reticleVisible;
    this.leadMarker.isVisible = this.leadVisible;
  }

  private selectNearest(player: Aircraft, alive: Aircraft[]): void {
    const pp = player.mesh.position;
    let minDist = Infinity;
    let nearest = 0;

    for (let i = 0; i < alive.length; i++) {
      const ep = alive[i].mesh.position;
      const dx = ep.x - pp.x;
      const dy = ep.y - pp.y;
      const dz = ep.z - pp.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }

    this.targetIndex = nearest;
    this.currentTarget = alive[nearest];
  }

  private projectToScreen(
    camera: FreeCamera,
    worldPos: { x: number; y: number; z: number },
    control: Ellipse,
  ): void {
    // Use Babylon's scene to project — approximate with camera direction check
    const scene = camera.getScene?.();
    if (!scene) return;

    const engine = scene.getEngine?.();
    if (!engine) return;

    const w = engine.getRenderWidth?.() ?? 1920;
    const h = engine.getRenderHeight?.() ?? 1080;

    // Check if target is in front of camera
    const camPos = camera.position;
    const toTarget = {
      x: worldPos.x - camPos.x,
      y: worldPos.y - camPos.y,
      z: worldPos.z - camPos.z,
    };

    // Get camera forward from target
    const camTarget = camera.getTarget?.();
    if (!camTarget) return;

    const camFwd = {
      x: camTarget.x - camPos.x,
      y: camTarget.y - camPos.y,
      z: camTarget.z - camPos.z,
    };

    const dot = toTarget.x * camFwd.x + toTarget.y * camFwd.y + toTarget.z * camFwd.z;
    if (dot <= 0) {
      control.isVisible = false;
      return;
    }

    // Simple perspective projection
    const fwdLen = Math.sqrt(camFwd.x ** 2 + camFwd.y ** 2 + camFwd.z ** 2);
    const fwd = { x: camFwd.x / fwdLen, y: camFwd.y / fwdLen, z: camFwd.z / fwdLen };

    // Project onto camera plane
    const projDist = toTarget.x * fwd.x + toTarget.y * fwd.y + toTarget.z * fwd.z;
    if (projDist < 1) {
      control.isVisible = false;
      return;
    }

    // Get right and up vectors (approximate)
    const right = { x: fwd.z, y: 0, z: -fwd.x };
    const rLen = Math.sqrt(right.x ** 2 + right.z ** 2) || 1;
    right.x /= rLen;
    right.z /= rLen;

    const up = {
      x: fwd.y * right.z - fwd.z * right.y,
      y: fwd.z * right.x - fwd.x * right.z,
      z: fwd.x * right.y - fwd.y * right.x,
    };

    const screenX = (toTarget.x * right.x + toTarget.y * right.y + toTarget.z * right.z) / projDist;
    const screenY = -(toTarget.x * up.x + toTarget.y * up.y + toTarget.z * up.z) / projDist;

    // Map to GUI coordinates (center = 0,0, range depends on FOV)
    const fovScale = w / 2;
    control.left = `${screenX * fovScale}px`;
    control.top = `${screenY * fovScale}px`;
    control.isVisible = true;
  }
}
