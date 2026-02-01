// ABOUTME: Aircraft selection overlay showing available aircraft with stats.
// ABOUTME: Renders as HTML/CSS overlay; locked aircraft shown but not selectable.

import type { AircraftStats } from "./AircraftData";

export class HangarScene {
  private overlay: HTMLDivElement;

  constructor(
    aircraft: AircraftStats[],
    lockedIds: string[],
    container: HTMLElement,
    onSelect: (aircraftId: string) => void,
  ) {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText =
      "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);color:#fff;font-family:sans-serif;z-index:100;";

    const title = document.createElement("h1");
    title.textContent = "Select Aircraft";
    title.style.cssText = "font-size:32px;margin-bottom:32px;letter-spacing:2px;";
    this.overlay.appendChild(title);

    const grid = document.createElement("div");
    grid.style.cssText = "display:flex;gap:24px;flex-wrap:wrap;justify-content:center;";

    for (const ac of aircraft) {
      const locked = lockedIds.includes(ac.id);
      const card = document.createElement("div");
      card.setAttribute("data-aircraft-id", ac.id);
      card.style.cssText = `width:220px;padding:24px;border:2px solid ${locked ? "#444" : "#666"};border-radius:8px;text-align:center;opacity:${locked ? "0.5" : "1"};transition:border-color 0.2s;`;

      const name = document.createElement("h2");
      name.textContent = ac.name;
      name.style.cssText = "font-size:18px;margin-bottom:16px;";
      card.appendChild(name);

      if (locked) {
        const lockLabel = document.createElement("p");
        lockLabel.textContent = "LOCKED";
        lockLabel.style.cssText = "color:#f44;font-size:14px;font-weight:bold;margin-bottom:12px;";
        card.appendChild(lockLabel);
      }

      const stats = document.createElement("div");
      stats.style.cssText = "font-size:13px;color:#aaa;text-align:left;margin-bottom:16px;line-height:1.8;";
      const statLines = [
        `Speed: ${ac.flightParams.maxSpeed}`,
        `Agility: ${ac.flightParams.turnRate}`,
        `Ammo: ${ac.weaponLoadout.gunAmmo}`,
        `Missiles: ${ac.weaponLoadout.missiles}`,
      ];
      for (const line of statLines) {
        const p = document.createElement("p");
        p.textContent = line;
        p.style.margin = "0";
        stats.appendChild(p);
      }
      card.appendChild(stats);

      if (!locked) {
        const btn = document.createElement("button");
        btn.textContent = "Select";
        btn.style.cssText =
          "padding:8px 24px;font-size:14px;background:#0a0;color:#fff;border:none;cursor:pointer;border-radius:4px;";
        btn.addEventListener("click", () => {
          const allCards = grid.querySelectorAll("[data-aircraft-id]");
          for (const c of allCards) {
            (c as HTMLElement).style.borderColor = lockedIds.includes(
              c.getAttribute("data-aircraft-id")!,
            )
              ? "#444"
              : "#666";
          }
          card.style.borderColor = "rgb(0, 170, 0)";
          onSelect(ac.id);
        });
        card.appendChild(btn);
      }

      grid.appendChild(card);
    }

    this.overlay.appendChild(grid);
    container.appendChild(this.overlay);
  }

  dispose(): void {
    this.overlay.remove();
  }
}
