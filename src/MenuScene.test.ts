// ABOUTME: Tests for MenuScene — the main menu overlay.
// ABOUTME: Validates rendering of menu options and callback invocations.

import { describe, it, expect, vi, afterEach } from "vitest";
import { MenuScene } from "./MenuScene";

describe("MenuScene", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders game title", () => {
    const menu = new MenuScene(container, { onNewGame: vi.fn(), onContinue: vi.fn(), onSettings: vi.fn() });
    expect(container.textContent).toContain("TOP GUN");
    menu.dispose();
  });

  it("renders New Game button", () => {
    const menu = new MenuScene(container, { onNewGame: vi.fn(), onContinue: vi.fn(), onSettings: vi.fn() });
    const buttons = container.querySelectorAll("button");
    const labels = Array.from(buttons).map((b) => b.textContent);
    expect(labels).toContain("New Game");
    menu.dispose();
  });

  it("renders Continue button", () => {
    const menu = new MenuScene(container, { onNewGame: vi.fn(), onContinue: vi.fn(), onSettings: vi.fn() });
    const buttons = container.querySelectorAll("button");
    const labels = Array.from(buttons).map((b) => b.textContent);
    expect(labels).toContain("Continue");
    menu.dispose();
  });

  it("renders Settings button", () => {
    const menu = new MenuScene(container, { onNewGame: vi.fn(), onContinue: vi.fn(), onSettings: vi.fn() });
    const buttons = container.querySelectorAll("button");
    const labels = Array.from(buttons).map((b) => b.textContent);
    expect(labels).toContain("Settings");
    menu.dispose();
  });

  it("calls onNewGame when New Game is clicked", () => {
    const onNewGame = vi.fn();
    const menu = new MenuScene(container, { onNewGame, onContinue: vi.fn(), onSettings: vi.fn() });
    const btn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "New Game")!;
    btn.click();
    expect(onNewGame).toHaveBeenCalledOnce();
    menu.dispose();
  });

  it("calls onContinue when Continue is clicked", () => {
    const onContinue = vi.fn();
    const menu = new MenuScene(container, { onNewGame: vi.fn(), onContinue, onSettings: vi.fn() });
    const btn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Continue")!;
    btn.click();
    expect(onContinue).toHaveBeenCalledOnce();
    menu.dispose();
  });

  it("calls onSettings when Settings is clicked", () => {
    const onSettings = vi.fn();
    const menu = new MenuScene(container, { onNewGame: vi.fn(), onContinue: vi.fn(), onSettings });
    const btn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Settings")!;
    btn.click();
    expect(onSettings).toHaveBeenCalledOnce();
    menu.dispose();
  });

  it("dispose removes the overlay", () => {
    const menu = new MenuScene(container, { onNewGame: vi.fn(), onContinue: vi.fn(), onSettings: vi.fn() });
    expect(container.children.length).toBeGreaterThan(0);
    menu.dispose();
    expect(container.children.length).toBe(0);
  });
});
