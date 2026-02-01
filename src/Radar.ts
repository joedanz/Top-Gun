// ABOUTME: 2D top-down radar minimap showing relative positions of enemies and friendlies.
// ABOUTME: Renders in a corner of the HUD with heading-up orientation and range scaling.

import { AdvancedDynamicTexture, Ellipse, Rectangle, Control } from "@babylonjs/gui";
import type { Aircraft } from "./Aircraft";

const RADAR_SIZE = 150;
const BLIP_SIZE = 8;
const PLAYER_DOT_SIZE = 6;
const DEFAULT_RANGE = 1500;

export interface RadarBlip {
  screenX: number;
  screenY: number;
  visible: boolean;
  dot: Ellipse;
}

export class Radar {
  range = DEFAULT_RANGE;
  playerDot: Ellipse;
  blips: RadarBlip[] = [];
  friendlyBlips: RadarBlip[] = [];

  private container: Rectangle;
  private ui: { addControl: (c: unknown) => void };

  constructor() {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("radarUI") as unknown as {
      addControl: (c: unknown) => void;
    };

    // Radar background circle
    this.container = new Rectangle();
    this.container.width = `${RADAR_SIZE}px`;
    this.container.height = `${RADAR_SIZE}px`;
    this.container.cornerRadius = RADAR_SIZE / 2;
    this.container.color = "#00ff88";
    this.container.thickness = 1;
    this.container.background = "rgba(0, 0, 0, 0.5)";
    this.container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.container.paddingRight = "20px";
    this.container.paddingTop = "20px";
    this.container.isPointerBlocker = false;
    this.ui.addControl(this.container);

    // Player dot at center
    this.playerDot = new Ellipse();
    this.playerDot.width = `${PLAYER_DOT_SIZE}px`;
    this.playerDot.height = `${PLAYER_DOT_SIZE}px`;
    this.playerDot.color = "#ffffff";
    this.playerDot.background = "#ffffff";
    this.playerDot.thickness = 0;
    this.container.addControl(this.playerDot);
  }

  update(player: Aircraft, enemies: Aircraft[], friendlies: Aircraft[]): void {
    this.syncBlipPool(enemies, this.blips, "#ff4444");
    this.syncBlipPool(friendlies, this.friendlyBlips, "#44ff44");

    const heading = player.mesh.rotation.y;
    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const halfSize = RADAR_SIZE / 2;

    this.updateBlips(enemies, this.blips, px, pz, heading, halfSize);
    this.updateBlips(friendlies, this.friendlyBlips, px, pz, heading, halfSize);
  }

  private updateBlips(
    aircraft: Aircraft[],
    blips: RadarBlip[],
    px: number,
    pz: number,
    heading: number,
    halfSize: number,
  ): void {
    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);

    for (let i = 0; i < aircraft.length; i++) {
      const ac = aircraft[i];
      const blip = blips[i];

      if (!ac.alive) {
        blip.visible = false;
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
        blip.screenX = 0;
        blip.screenY = 0;
        blip.dot.isVisible = false;
        continue;
      }

      // Rotate by player heading (heading-up display)
      const rx = dx * cosH - dz * sinH;
      const rz = dx * sinH + dz * cosH;

      // Scale to radar pixel space
      const scale = (halfSize - BLIP_SIZE) / this.range;
      const sx = rx * scale;
      const sy = -rz * scale; // Negative because screen Y is inverted

      blip.screenX = sx;
      blip.screenY = sy;
      blip.visible = true;
      blip.dot.left = `${sx}px`;
      blip.dot.top = `${sy}px`;
      blip.dot.isVisible = true;
    }
  }

  private syncBlipPool(aircraft: Aircraft[], blips: RadarBlip[], color: string): void {
    // Grow pool if needed
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
      blips.push({ screenX: 0, screenY: 0, visible: false, dot });
    }

    // Hide excess blips
    for (let i = aircraft.length; i < blips.length; i++) {
      blips[i].dot.isVisible = false;
      blips[i].visible = false;
    }
  }
}
