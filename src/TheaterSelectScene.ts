// ABOUTME: Campaign theater and mission selection overlay.
// ABOUTME: Shows 4 theaters with unlock states, completion progress, and expandable mission lists.

export interface MissionInfo {
  id: string;
  title: string;
  completed: boolean;
  unlocked: boolean;
}

export interface TheaterInfo {
  id: string;
  name: string;
  unlocked: boolean;
  missions: MissionInfo[];
  completedCount: number;
  totalCount: number;
}

export class TheaterSelectScene {
  private overlay: HTMLDivElement;
  private missionPanel: HTMLDivElement;

  constructor(
    theaters: TheaterInfo[],
    container: HTMLElement,
    onMissionSelect: (missionId: string) => void,
    onBack: () => void,
  ) {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText =
      "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.92);color:#fff;font-family:sans-serif;z-index:100;";

    const title = document.createElement("h1");
    title.textContent = "SELECT THEATER";
    title.style.cssText = "font-size:28px;letter-spacing:6px;margin-bottom:32px;";
    this.overlay.appendChild(title);

    const grid = document.createElement("div");
    grid.style.cssText = "display:flex;gap:16px;margin-bottom:24px;";

    for (const theater of theaters) {
      const card = document.createElement("div");
      card.setAttribute("data-theater-id", theater.id);
      card.style.cssText =
        `width:160px;padding:20px;border:2px solid ${theater.unlocked ? "#0a0" : "#555"};border-radius:8px;text-align:center;cursor:${theater.unlocked ? "pointer" : "default"};opacity:${theater.unlocked ? "1" : "0.4"};`;

      const name = document.createElement("h2");
      name.textContent = theater.name;
      name.style.cssText = "font-size:18px;margin-bottom:8px;";
      card.appendChild(name);

      if (theater.unlocked) {
        const progress = document.createElement("p");
        progress.textContent = `${theater.completedCount} / ${theater.totalCount}`;
        progress.style.cssText = "font-size:14px;color:#888;";
        card.appendChild(progress);
      } else {
        const locked = document.createElement("p");
        locked.textContent = "LOCKED";
        locked.style.cssText = "font-size:14px;color:#f44;";
        card.appendChild(locked);
      }

      card.addEventListener("click", () => {
        if (!theater.unlocked) return;
        this.showMissions(theater, onMissionSelect);
      });

      grid.appendChild(card);
    }

    this.overlay.appendChild(grid);

    this.missionPanel = document.createElement("div");
    this.missionPanel.style.cssText = "min-height:200px;width:400px;";
    this.overlay.appendChild(this.missionPanel);

    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    backBtn.setAttribute("data-action", "back");
    backBtn.style.cssText =
      "margin-top:16px;padding:10px 24px;font-size:16px;background:#555;color:#fff;border:none;cursor:pointer;border-radius:4px;";
    backBtn.addEventListener("click", onBack);
    this.overlay.appendChild(backBtn);

    container.appendChild(this.overlay);
  }

  private showMissions(theater: TheaterInfo, onMissionSelect: (id: string) => void): void {
    while (this.missionPanel.firstChild) {
      this.missionPanel.removeChild(this.missionPanel.firstChild);
    }

    const header = document.createElement("h3");
    header.textContent = `${theater.name} — Missions`;
    header.style.cssText = "font-size:18px;margin-bottom:12px;text-align:center;";
    this.missionPanel.appendChild(header);

    for (const mission of theater.missions) {
      const row = document.createElement("div");
      row.setAttribute("data-mission-id", mission.id);
      row.style.cssText =
        `padding:10px 16px;margin-bottom:6px;border:1px solid ${mission.unlocked ? "#0a0" : "#555"};border-radius:4px;cursor:${mission.unlocked ? "pointer" : "default"};opacity:${mission.unlocked ? "1" : "0.4"};display:flex;justify-content:space-between;`;

      const titleSpan = document.createElement("span");
      titleSpan.textContent = mission.title;
      row.appendChild(titleSpan);

      if (mission.completed) {
        const check = document.createElement("span");
        check.textContent = "✓";
        check.style.cssText = "color:#0a0;";
        row.appendChild(check);
      }

      row.addEventListener("click", () => {
        if (!mission.unlocked) return;
        onMissionSelect(mission.id);
      });

      this.missionPanel.appendChild(row);
    }
  }

  dispose(): void {
    this.overlay.remove();
  }
}
