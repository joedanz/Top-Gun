// ABOUTME: Step-by-step tutorial that guides new players through flight controls.
// ABOUTME: Shows HTML overlay prompts and progresses based on player actions.

import type { Aircraft } from "./Aircraft";

export enum TutorialStep {
  Throttle = 0,
  Turn = 1,
  Shoot = 2,
  LockOn = 3,
  Complete = 4,
}

const SPEED_THRESHOLD = 20;
const HEADING_THRESHOLD = 0.5;

const STEP_PROMPTS: Record<Exclude<TutorialStep, TutorialStep.Complete>, string> = {
  [TutorialStep.Throttle]: "Hold Shift to increase throttle and gain speed",
  [TutorialStep.Turn]: "Use WASD to pitch and roll, Q/E to yaw",
  [TutorialStep.Shoot]: "Press Space to fire your guns at the target",
  [TutorialStep.LockOn]: "Hold R near an enemy to lock on, then fire a missile",
};

export class TutorialSystem {
  currentStep = TutorialStep.Throttle;
  private overlay: HTMLDivElement;
  private promptEl: HTMLParagraphElement;
  private initialHeading = 0;
  private headingCaptured = false;
  private enemiesSpawned = false;

  constructor(
    private container: HTMLElement,
    private onComplete: () => void,
    private onSpawnEnemies: () => void,
  ) {
    this.overlay = document.createElement("div");
    this.overlay.setAttribute("data-tutorial", "");
    this.overlay.style.cssText =
      "position:absolute;top:20px;left:50%;transform:translateX(-50%);z-index:200;background:rgba(0,0,0,0.7);color:#fff;font-family:sans-serif;padding:16px 32px;border-radius:8px;text-align:center;pointer-events:auto;";

    this.promptEl = document.createElement("p");
    this.promptEl.style.cssText = "font-size:18px;margin:0 0 12px 0;";
    this.promptEl.textContent = STEP_PROMPTS[TutorialStep.Throttle];
    this.overlay.appendChild(this.promptEl);

    const skipBtn = document.createElement("button");
    skipBtn.setAttribute("data-tutorial-skip", "");
    skipBtn.textContent = "Skip Tutorial (Esc)";
    skipBtn.style.cssText =
      "padding:6px 16px;font-size:14px;background:#555;color:#fff;border:none;cursor:pointer;border-radius:4px;";
    skipBtn.addEventListener("click", () => this.skip());
    this.overlay.appendChild(skipBtn);

    container.appendChild(this.overlay);
  }

  update(aircraft: Aircraft, _dt: number): void {
    if (this.currentStep === TutorialStep.Complete) return;

    switch (this.currentStep) {
      case TutorialStep.Throttle:
        if (aircraft.speed >= SPEED_THRESHOLD) {
          this.advance();
        }
        break;

      case TutorialStep.Turn:
        if (!this.headingCaptured) {
          this.initialHeading = aircraft.mesh.rotation.y;
          this.headingCaptured = true;
        }
        if (Math.abs(aircraft.mesh.rotation.y - this.initialHeading) >= HEADING_THRESHOLD) {
          this.spawnEnemiesIfNeeded();
          this.advance();
        }
        break;

      case TutorialStep.Shoot:
        if (aircraft.input.fire) {
          this.advance();
        }
        break;

      case TutorialStep.LockOn:
        if (aircraft.input.lockOn) {
          this.advance();
        }
        break;
    }
  }

  skip(): void {
    if (this.currentStep === TutorialStep.Complete) return;
    this.spawnEnemiesIfNeeded();
    this.currentStep = TutorialStep.Complete;
    this.removeOverlay();
    this.onComplete();
  }

  dispose(): void {
    this.removeOverlay();
  }

  private advance(): void {
    this.currentStep++;
    if (this.currentStep === TutorialStep.Complete) {
      this.removeOverlay();
      this.onComplete();
    } else {
      this.promptEl.textContent = STEP_PROMPTS[this.currentStep as Exclude<TutorialStep, TutorialStep.Complete>];
    }
  }

  private spawnEnemiesIfNeeded(): void {
    if (!this.enemiesSpawned) {
      this.enemiesSpawned = true;
      this.onSpawnEnemies();
    }
  }

  private removeOverlay(): void {
    this.overlay.remove();
  }
}
