// ABOUTME: Manages all game audio — engine loops, weapon SFX, explosions, spatial audio.
// ABOUTME: Engine pitch varies with throttle; enemy sounds attenuate with distance via Babylon spatial audio.

import { Sound, type Scene, type AbstractMesh } from "@babylonjs/core";

const ENGINE_PITCH_MIN = 0.6;
const ENGINE_PITCH_MAX = 1.8;

export class AudioManager {
  engineSound: Sound | null = null;
  gunFireSound: Sound | null = null;
  missileLaunchSound: Sound | null = null;
  explosionSound: Sound | null = null;
  enemyEngineSounds: Sound[] = [];
  masterVolume = 1;

  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  startEngine(): void {
    this.engineSound = new Sound("engine", "audio/engine-loop.mp3", this.scene, null, {
      loop: true,
      spatialSound: false,
    });
    this.engineSound.play();
  }

  updateEngine(throttle: number): void {
    if (!this.engineSound) return;
    this.engineSound.setPlaybackRate(ENGINE_PITCH_MIN + throttle * (ENGINE_PITCH_MAX - ENGINE_PITCH_MIN));
  }

  playGunFire(): void {
    if (!this.gunFireSound) {
      this.gunFireSound = new Sound("gunfire", "audio/gunfire.mp3", this.scene, null, {
        loop: false,
        spatialSound: false,
      });
    }
    this.gunFireSound.play();
  }

  playMissileLaunch(): void {
    if (!this.missileLaunchSound) {
      this.missileLaunchSound = new Sound("missile", "audio/missile-launch.mp3", this.scene, null, {
        loop: false,
        spatialSound: false,
      });
    }
    this.missileLaunchSound.play();
  }

  playExplosion(): void {
    if (!this.explosionSound) {
      this.explosionSound = new Sound("explosion", "audio/explosion.mp3", this.scene, null, {
        loop: false,
        spatialSound: false,
      });
    }
    this.explosionSound.play();
  }

  addEnemyEngine(mesh: AbstractMesh): void {
    const sound = new Sound("enemy-engine", "audio/engine-loop.mp3", this.scene, null, {
      loop: true,
      spatialSound: true,
      maxDistance: 500,
      rolloffFactor: 2,
    });
    sound.attachToMesh(mesh);
    sound.play();
    this.enemyEngineSounds.push(sound);
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  dispose(): void {
    if (this.engineSound) {
      this.engineSound.stop();
      this.engineSound.dispose();
    }
    if (this.gunFireSound) this.gunFireSound.dispose();
    if (this.missileLaunchSound) this.missileLaunchSound.dispose();
    if (this.explosionSound) this.explosionSound.dispose();
    for (const s of this.enemyEngineSounds) {
      s.stop();
      s.dispose();
    }
  }
}
