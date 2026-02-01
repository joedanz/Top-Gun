// ABOUTME: Manages background music with per-theater ambient and combat tracks.
// ABOUTME: Crossfades between ambient and combat music based on combat intensity.

import { Sound, type Scene } from "@babylonjs/core";
import type { Theater } from "./MissionData";

const CROSSFADE_SPEED = 2; // volume units per second

function musicPath(theater: Theater, type: "ambient" | "combat"): string {
  return `audio/music/${theater}-${type}.mp3`;
}

export class MusicManager {
  private scene: Scene;
  private ambientSound: Sound | null = null;
  private combatSound: Sound | null = null;
  private ambientVolume = 1;
  private combatVolume = 0;
  private masterVolume = 1;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  startTheater(theater: Theater): void {
    this.stopCurrent();

    this.ambientVolume = 1;
    this.combatVolume = 0;

    this.ambientSound = new Sound(
      `${theater}-ambient`,
      musicPath(theater, "ambient"),
      this.scene,
      null,
      { loop: true, spatialSound: false },
    );
    this.ambientSound.setVolume(this.ambientVolume * this.masterVolume);
    this.ambientSound.play();

    this.combatSound = new Sound(
      `${theater}-combat`,
      musicPath(theater, "combat"),
      this.scene,
      null,
      { loop: true, spatialSound: false },
    );
    this.combatSound.setVolume(0);
    this.combatSound.play();
  }

  /** Update crossfade. combatIntensity: 0 = peaceful, 1 = full combat. */
  update(dt: number, combatIntensity: number): void {
    if (!this.ambientSound || !this.combatSound) return;

    const target = Math.max(0, Math.min(1, combatIntensity));
    const step = CROSSFADE_SPEED * dt;

    // Lerp combat volume toward target
    if (this.combatVolume < target) {
      this.combatVolume = Math.min(this.combatVolume + step, target);
    } else if (this.combatVolume > target) {
      this.combatVolume = Math.max(this.combatVolume - step, target);
    }
    this.ambientVolume = 1 - this.combatVolume;

    this.ambientSound.setVolume(this.ambientVolume * this.masterVolume);
    this.combatSound.setVolume(this.combatVolume * this.masterVolume);
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  dispose(): void {
    this.stopCurrent();
  }

  private stopCurrent(): void {
    if (this.ambientSound) {
      this.ambientSound.stop();
      this.ambientSound.dispose();
      this.ambientSound = null;
    }
    if (this.combatSound) {
      this.combatSound.stop();
      this.combatSound.dispose();
      this.combatSound = null;
    }
  }
}
