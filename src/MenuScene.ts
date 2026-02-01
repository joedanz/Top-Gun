// ABOUTME: Main menu overlay with New Game, Continue, and Settings buttons.
// ABOUTME: Renders as an HTML/CSS overlay and dispatches navigation callbacks.

export interface MenuCallbacks {
  onNewGame: () => void;
  onContinue: () => void;
  onSettings: () => void;
}

export class MenuScene {
  private overlay: HTMLDivElement;

  constructor(container: HTMLElement, callbacks: MenuCallbacks) {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.92);color:#fff;font-family:sans-serif;z-index:100;";

    const panel = document.createElement("div");
    panel.style.cssText = "text-align:center;";

    const title = document.createElement("h1");
    title.textContent = "TOP GUN";
    title.style.cssText =
      "font-size:64px;margin-bottom:8px;letter-spacing:8px;color:#fff;";
    panel.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.textContent = "MAVERICK";
    subtitle.style.cssText =
      "font-size:18px;letter-spacing:6px;color:#888;margin-bottom:48px;";
    panel.appendChild(subtitle);

    const buttonStyle =
      "display:block;width:240px;margin:0 auto 16px;padding:14px 0;font-size:18px;border:none;cursor:pointer;border-radius:4px;";

    const newGameBtn = document.createElement("button");
    newGameBtn.textContent = "New Game";
    newGameBtn.style.cssText = buttonStyle + "background:#0a0;color:#fff;";
    newGameBtn.addEventListener("click", callbacks.onNewGame);
    panel.appendChild(newGameBtn);

    const continueBtn = document.createElement("button");
    continueBtn.textContent = "Continue";
    continueBtn.style.cssText = buttonStyle + "background:#07a;color:#fff;";
    continueBtn.addEventListener("click", callbacks.onContinue);
    panel.appendChild(continueBtn);

    const settingsBtn = document.createElement("button");
    settingsBtn.textContent = "Settings";
    settingsBtn.style.cssText = buttonStyle + "background:#555;color:#fff;";
    settingsBtn.addEventListener("click", callbacks.onSettings);
    panel.appendChild(settingsBtn);

    this.overlay.appendChild(panel);
    container.appendChild(this.overlay);
  }

  dispose(): void {
    this.overlay.remove();
  }
}
