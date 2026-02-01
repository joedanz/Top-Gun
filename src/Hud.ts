// ABOUTME: Heads-up display showing flight instruments and combat information.
// ABOUTME: Renders speed, altitude, heading, active weapon, ammo, and health using Babylon GUI.

import { AdvancedDynamicTexture, TextBlock, StackPanel, Control } from "@babylonjs/gui";
import type { Aircraft } from "./Aircraft";
import { WeaponType, type WeaponManager } from "./WeaponManager";
import type { CountermeasureSystem } from "./CountermeasureSystem";

const FONT_SIZE = 16;
const TEXT_COLOR = "#00ff88";

const WEAPON_LABELS: Record<WeaponType, string> = {
  [WeaponType.Guns]: "GUN",
  [WeaponType.HeatSeeking]: "AIM-9",
  [WeaponType.RadarGuided]: "AIM-120",
  [WeaponType.Rockets]: "RKT",
  [WeaponType.Bombs]: "BOMB",
};

function createLabel(text: string): TextBlock {
  const tb = new TextBlock();
  tb.text = text;
  tb.color = TEXT_COLOR;
  tb.fontSize = FONT_SIZE;
  tb.height = "24px";
  tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  return tb;
}

export class Hud {
  speedText: TextBlock;
  altitudeText: TextBlock;
  headingText: TextBlock;
  weaponText: TextBlock;
  ammoText: TextBlock;
  healthText: TextBlock;
  cmText: TextBlock;

  constructor() {
    const ui = AdvancedDynamicTexture.CreateFullscreenUI("hudUI");

    const panel = new StackPanel();
    panel.width = "200px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.paddingBottom = "20px";
    panel.paddingLeft = "20px";
    panel.isPointerBlocker = false;
    ui.addControl(panel);

    this.speedText = createLabel("SPD: 0");
    this.altitudeText = createLabel("ALT: 0");
    this.headingText = createLabel("HDG: 0°");
    this.weaponText = createLabel("WPN: GUN");
    this.ammoText = createLabel("AMMO: 0");
    this.healthText = createLabel("HP: 100");
    this.cmText = createLabel("FLR: 30 CHF: 30");

    panel.addControl(this.speedText);
    panel.addControl(this.altitudeText);
    panel.addControl(this.headingText);
    panel.addControl(this.weaponText);
    panel.addControl(this.ammoText);
    panel.addControl(this.healthText);
    panel.addControl(this.cmText);
  }

  update(aircraft: Aircraft, weapons: WeaponManager, countermeasures?: CountermeasureSystem): void {
    const speed = Math.round(aircraft.speed);
    const altitude = Math.round(aircraft.mesh.position.y);

    // Convert rotation.y (radians) to degrees, normalized to 0-360
    let headingDeg = Math.round((aircraft.mesh.rotation.y * 180) / Math.PI) % 360;
    if (headingDeg < 0) headingDeg += 360;

    const activeWeapon = weapons.activeWeapon;
    const ammo = weapons.getAmmo(activeWeapon);

    this.speedText.text = `SPD: ${speed}`;
    this.altitudeText.text = `ALT: ${altitude}`;
    this.headingText.text = `HDG: ${headingDeg}°`;
    this.weaponText.text = `WPN: ${WEAPON_LABELS[activeWeapon]}`;
    this.ammoText.text = `AMMO: ${ammo}`;
    this.healthText.text = `HP: ${aircraft.health}`;

    if (countermeasures) {
      this.cmText.text = `FLR: ${countermeasures.flareAmmo} CHF: ${countermeasures.chaffAmmo}`;
    }
  }
}
