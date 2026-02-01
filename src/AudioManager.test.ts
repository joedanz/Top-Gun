// ABOUTME: Tests for AudioManager — engine loop, weapon SFX, explosion SFX, spatial audio.
// ABOUTME: Verifies pitch modulation, distance attenuation, and volume control.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@babylonjs/core", () => {
  class MockSound {
    play = vi.fn(() => { this.isPlaying = true; });
    stop = vi.fn(() => { this.isPlaying = false; });
    dispose = vi.fn();
    setVolume = vi.fn();
    setPlaybackRate = vi.fn((rate: number) => { this._playbackRate = rate; });
    attachToMesh = vi.fn();
    _playbackRate = 1;
    isPlaying = false;
    loop = false;
    spatialSound = false;
    maxDistance = 500;
    rolloffFactor = 1;
    name: string;
    constructor(name: string, _url: string, _scene: unknown, _readyCallback?: unknown, options?: { loop?: boolean; spatialSound?: boolean; maxDistance?: number; rolloffFactor?: number }) {
      this.name = name;
      if (options?.loop) this.loop = true;
      if (options?.spatialSound) this.spatialSound = true;
      if (options?.maxDistance) this.maxDistance = options.maxDistance;
      if (options?.rolloffFactor) this.rolloffFactor = options.rolloffFactor;
    }
  }

  class MockScene {
    constructor(_engine?: unknown) {}
  }

  return {
    Sound: MockSound,
    Scene: MockScene,
    Vector3: class { constructor(public x = 0, public y = 0, public z = 0) {} },
  };
});

import { AudioManager } from "./AudioManager";
import { Scene } from "@babylonjs/core";

describe("AudioManager", () => {
  let scene: Scene;
  let audio: AudioManager;

  beforeEach(() => {
    vi.resetAllMocks();
    scene = new (Scene as unknown as new () => Scene)();
    audio = new AudioManager(scene);
  });

  describe("engine sound", () => {
    it("creates a looping engine sound", () => {
      audio.startEngine();
      expect(audio.engineSound).toBeDefined();
      expect(audio.engineSound!.loop).toBe(true);
    });

    it("modulates engine pitch based on throttle (0-1)", () => {
      audio.startEngine();
      audio.updateEngine(0.5);
      expect(audio.engineSound!.setPlaybackRate).toHaveBeenCalled();
      const rate = (audio.engineSound! as unknown as { _playbackRate: number })._playbackRate;
      expect(rate).toBeGreaterThan(0.5);
      expect(rate).toBeLessThanOrEqual(2.0);
    });

    it("has lowest pitch at zero throttle, highest at full", () => {
      audio.startEngine();
      audio.updateEngine(0);
      const lowRate = (audio.engineSound! as unknown as { _playbackRate: number })._playbackRate;
      audio.updateEngine(1);
      const highRate = (audio.engineSound! as unknown as { _playbackRate: number })._playbackRate;
      expect(highRate).toBeGreaterThan(lowRate);
    });

    it("stops engine sound on dispose", () => {
      audio.startEngine();
      audio.dispose();
      expect(audio.engineSound!.stop).toHaveBeenCalled();
      expect(audio.engineSound!.dispose).toHaveBeenCalled();
    });
  });

  describe("weapon SFX", () => {
    it("plays gun fire sound", () => {
      audio.playGunFire();
      expect(audio.gunFireSound).toBeDefined();
      expect(audio.gunFireSound!.play).toHaveBeenCalled();
    });

    it("plays missile launch sound", () => {
      audio.playMissileLaunch();
      expect(audio.missileLaunchSound).toBeDefined();
      expect(audio.missileLaunchSound!.play).toHaveBeenCalled();
    });

    it("plays explosion sound", () => {
      audio.playExplosion();
      expect(audio.explosionSound).toBeDefined();
      expect(audio.explosionSound!.play).toHaveBeenCalled();
    });
  });

  describe("spatial audio for enemies", () => {
    it("creates enemy engine sound with spatial audio enabled", () => {
      const mesh = { position: { x: 100, y: 50, z: 200 } };
      audio.addEnemyEngine(mesh as never);
      expect(audio.enemyEngineSounds.length).toBe(1);
      expect(audio.enemyEngineSounds[0].spatialSound).toBe(true);
    });

    it("attaches enemy engine to mesh for distance attenuation", () => {
      const mesh = { position: { x: 100, y: 50, z: 200 } };
      audio.addEnemyEngine(mesh as never);
      expect(audio.enemyEngineSounds[0].attachToMesh).toHaveBeenCalledWith(mesh);
    });
  });

  describe("master volume", () => {
    it("sets volume on all active sounds", () => {
      audio.startEngine();
      audio.setMasterVolume(0.5);
      expect(audio.masterVolume).toBe(0.5);
    });

    it("clamps volume to 0-1 range", () => {
      audio.setMasterVolume(-0.5);
      expect(audio.masterVolume).toBe(0);
      audio.setMasterVolume(1.5);
      expect(audio.masterVolume).toBe(1);
    });
  });

  describe("dispose", () => {
    it("disposes all sounds", () => {
      audio.startEngine();
      const mesh = { position: { x: 0, y: 0, z: 0 } };
      audio.addEnemyEngine(mesh as never);
      audio.dispose();
      expect(audio.engineSound!.dispose).toHaveBeenCalled();
      expect(audio.enemyEngineSounds[0].dispose).toHaveBeenCalled();
    });
  });
});
