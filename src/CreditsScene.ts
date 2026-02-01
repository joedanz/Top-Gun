// ABOUTME: Scrolling credits overlay shown after completing the final campaign mission.
// ABOUTME: Displays project attribution and returns to the main menu.

export class CreditsScene {
  private overlay: HTMLDivElement;

  constructor(container: HTMLElement, onMenu: () => void) {
    this.overlay = document.createElement("div");
    this.overlay.setAttribute("data-credits", "");
    this.overlay.style.cssText =
      "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.95);color:#fff;font-family:sans-serif;z-index:100;overflow:hidden;";

    const scroll = document.createElement("div");
    scroll.setAttribute("data-scroll", "");
    scroll.style.cssText =
      "text-align:center;animation:creditsScroll 20s linear forwards;";

    const entries: Array<[string, string]> = [
      ["TOP GUN", "font-size:48px;font-weight:bold;color:#ffd700;margin-bottom:32px;letter-spacing:4px;"],
      ["A 3D Arcade Flight Combat Game", "font-size:18px;color:#aaa;margin-bottom:48px;"],
      ["Built with Babylon.js & TypeScript", "font-size:16px;color:#888;margin-bottom:48px;"],
      ["— DESIGN & DEVELOPMENT —", "font-size:14px;color:#666;margin-bottom:8px;letter-spacing:2px;"],
      ["Joe & Claude", "font-size:20px;margin-bottom:48px;"],
      ["— ENGINE —", "font-size:14px;color:#666;margin-bottom:8px;letter-spacing:2px;"],
      ["Babylon.js", "font-size:20px;margin-bottom:48px;"],
      ["— BUILD TOOLS —", "font-size:14px;color:#666;margin-bottom:8px;letter-spacing:2px;"],
      ["Vite + TypeScript", "font-size:20px;margin-bottom:48px;"],
      ["— TESTING —", "font-size:14px;color:#666;margin-bottom:8px;letter-spacing:2px;"],
      ["Vitest", "font-size:20px;margin-bottom:48px;"],
      ["Thank you for playing!", "font-size:24px;color:#0f0;margin-bottom:16px;margin-top:32px;"],
    ];

    for (const [text, style] of entries) {
      const p = document.createElement("p");
      p.textContent = text;
      p.style.cssText = style;
      scroll.appendChild(p);
    }

    this.overlay.appendChild(scroll);

    const btn = document.createElement("button");
    btn.textContent = "Main Menu";
    btn.style.cssText =
      "position:absolute;bottom:40px;padding:12px 32px;font-size:18px;background:#555;color:#fff;border:none;cursor:pointer;border-radius:4px;z-index:101;";
    btn.addEventListener("click", onMenu);
    this.overlay.appendChild(btn);

    // Inject keyframe animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes creditsScroll {
        0% { transform: translateY(100vh); }
        100% { transform: translateY(-100%); }
      }
    `;
    this.overlay.appendChild(style);

    container.appendChild(this.overlay);
  }

  dispose(): void {
    this.overlay.remove();
  }
}
