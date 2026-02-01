// ABOUTME: Post-mission debrief overlay showing kills, time, and pass/fail result.
// ABOUTME: Offers "Next Mission" and "Return to Menu" navigation buttons.

import type { Medal } from "./Scoring";

export interface MissionResult {
  missionTitle: string;
  outcome: "success" | "failure";
  kills: number;
  timeSeconds: number;
  score: number;
  medal: Medal;
  shotsFired: number;
  shotsHit: number;
  damageTaken: number;
}

export class DebriefScene {
  private overlay: HTMLDivElement;

  constructor(
    result: MissionResult,
    container: HTMLElement,
    onNextMission: () => void,
    onMenu: () => void,
  ) {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:#fff;font-family:sans-serif;z-index:100;";

    const panel = document.createElement("div");
    panel.style.cssText = "max-width:600px;padding:40px;text-align:center;";

    const heading = document.createElement("h1");
    heading.textContent =
      result.outcome === "success" ? "MISSION COMPLETE" : "MISSION FAILED";
    heading.style.cssText = `font-size:36px;margin-bottom:8px;color:${result.outcome === "success" ? "#0f0" : "#f44"};`;
    panel.appendChild(heading);

    const title = document.createElement("p");
    title.textContent = result.missionTitle;
    title.style.cssText =
      "font-size:18px;color:#888;letter-spacing:2px;margin-bottom:32px;";
    panel.appendChild(title);

    const stats = document.createElement("div");
    stats.style.cssText = "margin-bottom:32px;";

    const killStat = document.createElement("p");
    killStat.textContent = `Kills: ${result.kills}`;
    killStat.style.cssText = "font-size:20px;margin-bottom:8px;";
    stats.appendChild(killStat);

    const timeStat = document.createElement("p");
    timeStat.textContent = `Time: ${result.timeSeconds.toFixed(1)}s`;
    timeStat.style.cssText = "font-size:20px;margin-bottom:8px;";
    stats.appendChild(timeStat);

    const scoreStat = document.createElement("p");
    scoreStat.textContent = `Score: ${result.score}`;
    scoreStat.style.cssText = "font-size:20px;margin-bottom:8px;font-weight:bold;";
    stats.appendChild(scoreStat);

    if (result.medal !== "none") {
      const medalColors: Record<string, string> = { bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700" };
      const medalEl = document.createElement("p");
      medalEl.textContent = `${result.medal.toUpperCase()} MEDAL`;
      medalEl.setAttribute("data-medal", result.medal);
      medalEl.style.cssText = `font-size:24px;font-weight:bold;color:${medalColors[result.medal]};`;
      stats.appendChild(medalEl);
    }

    panel.appendChild(stats);

    const buttonRow = document.createElement("div");
    buttonRow.style.cssText = "display:flex;gap:16px;justify-content:center;";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Mission";
    nextBtn.style.cssText =
      "padding:12px 32px;font-size:18px;background:#0a0;color:#fff;border:none;cursor:pointer;border-radius:4px;";
    nextBtn.addEventListener("click", onNextMission);
    buttonRow.appendChild(nextBtn);

    const menuBtn = document.createElement("button");
    menuBtn.textContent = "Return to Menu";
    menuBtn.style.cssText =
      "padding:12px 32px;font-size:18px;background:#555;color:#fff;border:none;cursor:pointer;border-radius:4px;";
    menuBtn.addEventListener("click", onMenu);
    buttonRow.appendChild(menuBtn);

    panel.appendChild(buttonRow);
    this.overlay.appendChild(panel);
    container.appendChild(this.overlay);
  }

  dispose(): void {
    this.overlay.remove();
  }
}
