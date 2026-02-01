// ABOUTME: Settings overlay with audio volume slider and graphics quality toggle.
// ABOUTME: Persists settings to localStorage via loadSettings/saveSettings helpers.

import type { Storage as GameStorage } from "./SaveManager";

const SETTINGS_KEY = "topgun_settings_v1";

export interface GameSettings {
  audioVolume: number;
  graphicsQuality: "low" | "medium" | "high";
}

export const DEFAULT_SETTINGS: GameSettings = {
  audioVolume: 0.8,
  graphicsQuality: "medium",
};

export function loadSettings(storage: GameStorage = window.localStorage as unknown as GameStorage): GameSettings {
  const raw = storage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw);
    return {
      audioVolume: typeof parsed.audioVolume === "number" ? parsed.audioVolume : DEFAULT_SETTINGS.audioVolume,
      graphicsQuality: ["low", "medium", "high"].includes(parsed.graphicsQuality)
        ? parsed.graphicsQuality
        : DEFAULT_SETTINGS.graphicsQuality,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings, storage: GameStorage = window.localStorage as unknown as GameStorage): void {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export class SettingsScene {
  private overlay: HTMLDivElement;
  private settings: GameSettings;

  constructor(container: HTMLElement, onBack: () => void, initialSettings?: GameSettings) {
    this.settings = initialSettings ? { ...initialSettings } : { ...DEFAULT_SETTINGS };

    this.overlay = document.createElement("div");
    this.overlay.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.92);color:#fff;font-family:sans-serif;z-index:100;";

    const panel = document.createElement("div");
    panel.style.cssText = "max-width:400px;width:100%;padding:40px;text-align:center;";

    const title = document.createElement("h1");
    title.textContent = "Settings";
    title.style.cssText = "font-size:32px;margin-bottom:32px;";
    panel.appendChild(title);

    // Audio volume
    const audioLabel = document.createElement("label");
    audioLabel.textContent = `Audio Volume: ${Math.round(this.settings.audioVolume * 100)}%`;
    audioLabel.style.cssText = "display:block;font-size:16px;margin-bottom:8px;";
    panel.appendChild(audioLabel);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(Math.round(this.settings.audioVolume * 100));
    slider.style.cssText = "width:100%;margin-bottom:24px;";
    slider.addEventListener("input", () => {
      this.settings.audioVolume = parseInt(slider.value, 10) / 100;
      audioLabel.textContent = `Audio Volume: ${slider.value}%`;
    });
    panel.appendChild(slider);

    // Graphics quality
    const gfxLabel = document.createElement("label");
    gfxLabel.textContent = "Graphics Quality:";
    gfxLabel.style.cssText = "display:block;font-size:16px;margin-bottom:8px;";
    panel.appendChild(gfxLabel);

    const select = document.createElement("select");
    select.style.cssText =
      "width:100%;padding:8px;font-size:16px;margin-bottom:32px;background:#333;color:#fff;border:1px solid #555;border-radius:4px;";
    for (const q of ["low", "medium", "high"] as const) {
      const opt = document.createElement("option");
      opt.value = q;
      opt.textContent = q.charAt(0).toUpperCase() + q.slice(1);
      if (q === this.settings.graphicsQuality) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => {
      this.settings.graphicsQuality = select.value as GameSettings["graphicsQuality"];
    });
    panel.appendChild(select);

    // Back button
    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    backBtn.style.cssText =
      "padding:12px 32px;font-size:18px;background:#555;color:#fff;border:none;cursor:pointer;border-radius:4px;";
    backBtn.addEventListener("click", onBack);
    panel.appendChild(backBtn);

    this.overlay.appendChild(panel);
    container.appendChild(this.overlay);
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  dispose(): void {
    this.overlay.remove();
  }
}
