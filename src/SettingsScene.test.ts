// ABOUTME: Tests for SettingsScene — audio volume and graphics quality settings overlay.
// ABOUTME: Validates rendering, interaction, persistence, and back navigation.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SettingsScene, GameSettings, loadSettings, saveSettings, DEFAULT_SETTINGS } from "./SettingsScene";
import type { Storage } from "./SaveManager";

function mockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  };
}

describe("SettingsScene", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders audio volume slider", () => {
    const scene = new SettingsScene(container, vi.fn());
    const slider = container.querySelector('input[type="range"]');
    expect(slider).not.toBeNull();
    scene.dispose();
  });

  it("renders graphics quality toggle", () => {
    const scene = new SettingsScene(container, vi.fn());
    const select = container.querySelector("select");
    expect(select).not.toBeNull();
    scene.dispose();
  });

  it("renders Back button", () => {
    const scene = new SettingsScene(container, vi.fn());
    const btn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Back");
    expect(btn).toBeDefined();
    scene.dispose();
  });

  it("calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    const scene = new SettingsScene(container, onBack);
    const btn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Back")!;
    btn.click();
    expect(onBack).toHaveBeenCalledOnce();
    scene.dispose();
  });

  it("dispose removes the overlay", () => {
    const scene = new SettingsScene(container, vi.fn());
    expect(container.children.length).toBeGreaterThan(0);
    scene.dispose();
    expect(container.children.length).toBe(0);
  });

  it("initializes with provided settings", () => {
    const settings: GameSettings = { audioVolume: 0.5, graphicsQuality: "high" };
    const scene = new SettingsScene(container, vi.fn(), settings);
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.value).toBe("50");
    scene.dispose();
  });

  it("getSettings returns current settings", () => {
    const scene = new SettingsScene(container, vi.fn(), { audioVolume: 0.75, graphicsQuality: "low" });
    const s = scene.getSettings();
    expect(s.audioVolume).toBe(0.75);
    expect(s.graphicsQuality).toBe("low");
    scene.dispose();
  });
});

describe("loadSettings / saveSettings", () => {
  it("returns defaults when no saved settings exist", () => {
    const storage = mockStorage();
    const settings = loadSettings(storage);
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips settings through save/load", () => {
    const storage = mockStorage();
    const settings: GameSettings = { audioVolume: 0.3, graphicsQuality: "high" };
    saveSettings(settings, storage);
    const loaded = loadSettings(storage);
    expect(loaded).toEqual(settings);
  });

  it("returns defaults for corrupt data", () => {
    const storage = mockStorage();
    storage.setItem("topgun_settings_v1", "not-json");
    const settings = loadSettings(storage);
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});
