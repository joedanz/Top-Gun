// ABOUTME: Tests for CreditsScene — scrolling credits overlay after campaign completion.
// ABOUTME: Validates rendering, scroll behavior, and return-to-menu callback.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CreditsScene } from "./CreditsScene";

describe("CreditsScene", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders a credits overlay", () => {
    const scene = new CreditsScene(container, vi.fn());
    expect(container.querySelector("[data-credits]")).not.toBeNull();
    scene.dispose();
  });

  it("displays project title", () => {
    const scene = new CreditsScene(container, vi.fn());
    expect(container.textContent).toContain("TOP GUN");
    scene.dispose();
  });

  it("displays attribution text", () => {
    const scene = new CreditsScene(container, vi.fn());
    expect(container.textContent).toContain("Built with Babylon.js");
    scene.dispose();
  });

  it("has a return to menu button", () => {
    const scene = new CreditsScene(container, vi.fn());
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("Main Menu");
    scene.dispose();
  });

  it("calls onMenu callback when button is clicked", () => {
    const onMenu = vi.fn();
    const scene = new CreditsScene(container, onMenu);
    const btn = container.querySelector("button")!;
    btn.click();
    expect(onMenu).toHaveBeenCalledOnce();
    scene.dispose();
  });

  it("dispose removes the overlay from the container", () => {
    const scene = new CreditsScene(container, vi.fn());
    expect(container.children.length).toBeGreaterThan(0);
    scene.dispose();
    expect(container.children.length).toBe(0);
  });

  it("displays a thank you message", () => {
    const scene = new CreditsScene(container, vi.fn());
    expect(container.textContent).toContain("Thank you for playing");
    scene.dispose();
  });

  it("credits content has scroll animation", () => {
    const scene = new CreditsScene(container, vi.fn());
    const credits = container.querySelector("[data-credits]") as HTMLElement;
    expect(credits.querySelector("[data-scroll]")).not.toBeNull();
    scene.dispose();
  });
});
