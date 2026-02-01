// ABOUTME: Rotating sweep radar display for futuristic aircraft.
// ABOUTME: Contacts appear when the sweep line passes over them and fade over time.

import { AdvancedDynamicTexture, Ellipse, Rectangle, Control } from "@babylonjs/gui";
import type { Aircraft } from "./Aircraft";

const RADAR_SIZE = 150;
const BLIP_SIZE = 8;
const PLAYER_DOT_SIZE = 6;
const DEFAULT_RANGE = 1500;
const SWEEP_SPEED = Math.PI * 2 / 4; // Full rotation in 4 seconds
const SWEEP_WIDTH = Math.PI / 6; // 30 degree sweep beam
const FADE_RATE = 0.2; // Alpha units per second

export interface SweepBlip {
  screenX: number;
  screenY: number;
  visible: boolean;
  alpha: number;
  dot: Ellipse;
  bearing: number;
}

export class SweepRadar {
  range = DEFAULT_RANGE;
  playerDot: Ellipse;
  blips: SweepBlip[] = [];
  friendlyBlips: SweepBlip[] = [];
  sweepAngle = 0;

  private container: Rectangle;
  private sweepLine: Rectangle;
  private ui: { addControl: (c: unknown) => void };

  constructor() {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("sweepRadarUI") as unknown as {
      addControl: (c: unknown) => void;
    };

    this.container = new Rectangle();
    this.container.width = `${RADAR_SIZE}px`;
    this.container.height = `${RADAR_SIZE}px`;
    this.container.cornerRadius = RADAR_SIZE / 2;
    this.container.color = "#00ffcc";
    this.container.thickness = 1;
    this.container.background = "rgba(0, 20, 10, 0.6)";
    this.container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.container.paddingRight = "20px";
    this.container.paddingTop = "20px";
    this.container.isPointerBlocker = false;
    this.ui.addControl(this.container);

    // Sweep line indicator
    this.sweepLine = new Rectangle();
    this.sweepLine.width = "2px";
    this.sweepLine.height = `${RADAR_SIZE / 2}px`;
    this.sweepLine.color = "#00ffcc";
    this.sweepLine.background = "#00ffcc";
    this.sweepLine.thickness = 0;
    this.sweepLine.alpha = 0.6;
    this.container.addControl(this.sweepLine);

    // Player dot at center
    this.playerDot = new Ellipse();
    this.playerDot.width = `${PLAYER_DOT_SIZE}px`;
    this.playerDot.height = `${PLAYER_DOT_SIZE}px`;
    this.playerDot.color = "#ffffff";
    this.playerDot.background = "#ffffff";
    this.playerDot.thickness = 0;
    this.container.addControl(this.playerDot);
  }

  update(player: Aircraft, enemies: Aircraft[], friendlies: Aircraft[], dt: number): void {
    this.sweepAngle += SWEEP_SPEED * dt;

    // Rotate sweep line visually
    this.sweepLine.rotation = this.sweepAngle;

    this.syncBlipPool(enemies, this.blips, "#ff4444");
    this.syncBlipPool(friendlies, this.friendlyBlips, "#44ff44");

    const heading = player.mesh.rotation.y;
    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const halfSize = RADAR_SIZE / 2;

    this.updateBlips(enemies, this.blips, px, pz, heading, halfSize, dt);
    this.updateBlips(friendlies, this.friendlyBlips, px, pz, heading, halfSize, dt);
  }

  private updateBlips(
    aircraft: Aircraft[],
    blips: SweepBlip[],
    px: number,
    pz: number,
    heading: number,
    halfSize: number,
    dt: number,
  ): void {
    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);

    for (let i = 0; i < aircraft.length; i++) {
      const ac = aircraft[i];
      const blip = blips[i];

      if (!ac.alive) {
        blip.visible = false;
        blip.alpha = 0;
        blip.screenX = 0;
        blip.screenY = 0;
        blip.dot.isVisible = false;
        continue;
      }

      const dx = ac.mesh.position.x - px;
      const dz = ac.mesh.position.z - pz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > this.range) {
        blip.visible = false;
        blip.alpha = 0;
        blip.screenX = 0;
        blip.screenY = 0;
        blip.dot.isVisible = false;
        continue;
      }

      // Rotate by player heading
      const rx = dx * cosH - dz * sinH;
      const rz = dx * sinH + dz * cosH;

      // Compute bearing of this contact relative to sweep
      const contactBearing = Math.atan2(rx, -rz);
      blip.bearing = contactBearing;

      // Normalize sweep angle to [0, 2*PI)
      const normalizedSweep = ((this.sweepAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const normalizedBearing = ((contactBearing % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

      // Check if sweep beam is passing over this contact
      let angleDiff = normalizedSweep - normalizedBearing;
      if (angleDiff < 0) angleDiff += Math.PI * 2;
      if (angleDiff > Math.PI * 2) angleDiff -= Math.PI * 2;

      if (angleDiff < SWEEP_WIDTH) {
        // Sweep is passing over — reveal the contact
        blip.alpha = 1;
      } else {
        // Fade out over time
        blip.alpha = Math.max(0, blip.alpha - FADE_RATE * dt);
      }

      // Scale to radar pixel space
      const scale = (halfSize - BLIP_SIZE) / this.range;
      const sx = rx * scale;
      const sy = -rz * scale;

      blip.screenX = sx;
      blip.screenY = sy;
      blip.visible = blip.alpha > 0;
      blip.dot.left = `${sx}px`;
      blip.dot.top = `${sy}px`;
      blip.dot.isVisible = blip.alpha > 0;
      blip.dot.alpha = blip.alpha;
    }
  }

  private syncBlipPool(aircraft: Aircraft[], blips: SweepBlip[], color: string): void {
    while (blips.length < aircraft.length) {
      const dot = new Ellipse();
      dot.width = `${BLIP_SIZE}px`;
      dot.height = `${BLIP_SIZE}px`;
      dot.color = color;
      dot.background = color;
      dot.thickness = 0;
      dot.isVisible = false;
      dot.isPointerBlocker = false;
      dot.isHitTestVisible = false;
      this.container.addControl(dot);
      blips.push({ screenX: 0, screenY: 0, visible: false, alpha: 0, dot, bearing: 0 });
    }

    for (let i = aircraft.length; i < blips.length; i++) {
      blips[i].dot.isVisible = false;
      blips[i].visible = false;
      blips[i].alpha = 0;
    }
  }
}
