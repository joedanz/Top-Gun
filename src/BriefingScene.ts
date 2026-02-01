// ABOUTME: Pre-mission briefing overlay showing mission name, description, objectives, and theater.
// ABOUTME: Renders as an HTML/CSS overlay and calls onLaunch when the player starts the mission.

import type { MissionData } from "./MissionData";

export class BriefingScene {
  private overlay: HTMLDivElement;

  constructor(
    mission: MissionData,
    container: HTMLElement,
    onLaunch: () => void,
  ) {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:#fff;font-family:sans-serif;z-index:100;";

    const panel = document.createElement("div");
    panel.style.cssText = "max-width:600px;padding:40px;text-align:center;";

    const theater = document.createElement("p");
    theater.textContent = mission.theater.toUpperCase();
    theater.style.cssText = "letter-spacing:4px;font-size:14px;color:#888;margin-bottom:8px;";
    panel.appendChild(theater);

    const title = document.createElement("h1");
    title.textContent = mission.title;
    title.style.cssText = "font-size:36px;margin-bottom:16px;";
    panel.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = mission.description;
    desc.style.cssText = "font-size:16px;color:#ccc;margin-bottom:24px;line-height:1.5;";
    panel.appendChild(desc);

    const objHeader = document.createElement("h2");
    objHeader.textContent = "Objectives";
    objHeader.style.cssText = "font-size:20px;margin-bottom:12px;";
    panel.appendChild(objHeader);

    const objList = document.createElement("ul");
    objList.style.cssText = "list-style:none;padding:0;margin-bottom:32px;";
    for (const obj of mission.objectives) {
      const li = document.createElement("li");
      li.textContent = `▸ ${obj.description}`;
      li.style.cssText = "font-size:16px;color:#0f0;margin-bottom:6px;";
      objList.appendChild(li);
    }
    panel.appendChild(objList);

    const button = document.createElement("button");
    button.textContent = "Launch Mission";
    button.style.cssText =
      "padding:12px 32px;font-size:18px;background:#0a0;color:#fff;border:none;cursor:pointer;border-radius:4px;";
    button.addEventListener("click", onLaunch);
    panel.appendChild(button);

    this.overlay.appendChild(panel);
    container.appendChild(this.overlay);
  }

  dispose(): void {
    this.overlay.remove();
  }
}
