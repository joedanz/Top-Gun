// ABOUTME: Tests for MusicManager — theater music playback, combat crossfade, volume control.
// ABOUTME: Validates ambient/combat music transitions and settings integration.

import { describe, it, expect, vi, beforeEach } from "vitest";

const MockSound = vi.hoisted(() => {
  const instances: any[] = [];
  class MS {
    static instances = instances;
    name: string;
    url: string;
    play = vi.fn();
    stop = vi.fn();
    dispose = vi.fn();
    setVolume = vi.fn();
    isPlaying = false;

    constructor(name: string, url: string) {
      this.name = name;
      this.url = url;
      MS.instances.push(this);
    }
  }
  return MS;
});

vi.mock("@babylonjs/core", () => ({
  Sound: MockSound,
}));

import { MusicManager } from "./MusicManager";
import type { Theater } from "./MissionData";

function makeScene(): never {
  return {} as never;
}

describe("MusicManager", () => {
  beforeEach(() => {
    MockSound.instances = [];
    vi.restoreAllMocks();
  });

  it("creates ambient and combat sounds for a theater", () => {
    const mgr = new MusicManager(makeScene());
    mgr.startTheater("pacific");
    expect(MockSound.instances).toHaveLength(2);
    expect(MockSound.instances[0].play).toHaveBeenCalled();
    expect(MockSound.instances[1].play).toHaveBeenCalled();
  });

  it("sets ambient volume to 1 and combat to 0 initially", () => {
    const mgr = new MusicManager(makeScene());
    mgr.startTheater("pacific");
    const ambient = MockSound.instances[0];
    const combat = MockSound.instances[1];
    expect(ambient.setVolume).toHaveBeenCalledWith(1);
    expect(combat.setVolume).toHaveBeenCalledWith(0);
  });

  it("crossfades to combat music when combat intensity is 1", () => {
    const mgr = new MusicManager(makeScene());
    mgr.startTheater("pacific");

    for (let i = 0; i < 100; i++) {
      mgr.update(0.1, 1);
    }

    expect(mgr["combatVolume"]).toBeGreaterThan(0.8);
    expect(mgr["ambientVolume"]).toBeLessThan(0.2);
  });

  it("crossfades back to ambient when combat intensity drops to 0", () => {
    const mgr = new MusicManager(makeScene());
    mgr.startTheater("pacific");

    for (let i = 0; i < 100; i++) mgr.update(0.1, 1);
    for (let i = 0; i < 100; i++) mgr.update(0.1, 0);

    expect(mgr["ambientVolume"]).toBeGreaterThan(0.8);
    expect(mgr["combatVolume"]).toBeLessThan(0.2);
  });

  it("respects master volume setting", () => {
    const mgr = new MusicManager(makeScene());
    mgr.setVolume(0.5);
    mgr.startTheater("pacific");

    const ambient = MockSound.instances[0];
    expect(ambient.setVolume).toHaveBeenCalledWith(0.5);
  });

  it("uses different audio paths per theater", () => {
    const mgr = new MusicManager(makeScene());
    mgr.startTheater("middleeast");
    expect(MockSound.instances[0].url).toContain("middleeast");
    expect(MockSound.instances[1].url).toContain("middleeast");
  });

  it("disposes old sounds when switching theater", () => {
    const mgr = new MusicManager(makeScene());
    mgr.startTheater("pacific");
    const oldAmbient = MockSound.instances[0];
    const oldCombat = MockSound.instances[1];

    mgr.startTheater("europe");
    expect(oldAmbient.stop).toHaveBeenCalled();
    expect(oldAmbient.dispose).toHaveBeenCalled();
    expect(oldCombat.stop).toHaveBeenCalled();
    expect(oldCombat.dispose).toHaveBeenCalled();
  });

  it("dispose stops and cleans up all sounds", () => {
    const mgr = new MusicManager(makeScene());
    mgr.startTheater("pacific");
    const ambient = MockSound.instances[0];
    const combat = MockSound.instances[1];

    mgr.dispose();
    expect(ambient.stop).toHaveBeenCalled();
    expect(ambient.dispose).toHaveBeenCalled();
    expect(combat.stop).toHaveBeenCalled();
    expect(combat.dispose).toHaveBeenCalled();
  });

  it("handles update before startTheater gracefully", () => {
    const mgr = new MusicManager(makeScene());
    expect(() => mgr.update(0.1, 0)).not.toThrow();
  });

  it("handles all four theaters", () => {
    const theaters: Theater[] = ["pacific", "middleeast", "europe", "arctic"];
    for (const theater of theaters) {
      MockSound.instances = [];
      const mgr = new MusicManager(makeScene());
      mgr.startTheater(theater);
      expect(MockSound.instances).toHaveLength(2);
      expect(MockSound.instances[0].url).toContain(theater);
    }
  });
});
