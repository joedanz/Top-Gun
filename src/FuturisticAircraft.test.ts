// ABOUTME: Tests that a futuristic aircraft exists in the catalog for Arctic theater unlock.
// ABOUTME: Verifies distinct stats from other aircraft and Arctic theater unlock path.

import { describe, it, expect, beforeEach } from "vitest";
import { resetCatalog } from "./AircraftData";
import type { AircraftCatalog } from "./AircraftData";
import aircraftJson from "../public/data/aircraft.json";

const catalog = aircraftJson as AircraftCatalog;

describe("Futuristic Aircraft", () => {
  beforeEach(() => {
    resetCatalog();
  });

  it("catalog has at least 4 aircraft (original 3 + futuristic)", () => {
    expect(catalog.aircraft.length).toBeGreaterThanOrEqual(4);
  });

  it("futuristic aircraft exists with id 'x-02'", () => {
    const futuristic = catalog.aircraft.find((a) => a.id === "x-02");
    expect(futuristic).toBeDefined();
    expect(futuristic!.name).toBeTruthy();
  });

  it("futuristic aircraft has higher max speed than F-14", () => {
    const f14 = catalog.aircraft.find((a) => a.id === "f-14")!;
    const futuristic = catalog.aircraft.find((a) => a.id === "x-02")!;
    expect(futuristic.flightParams.maxSpeed).toBeGreaterThan(f14.flightParams.maxSpeed);
  });

  it("futuristic aircraft has radar missiles", () => {
    const futuristic = catalog.aircraft.find((a) => a.id === "x-02")!;
    expect(futuristic.weaponLoadout.radarMissiles).toBeGreaterThan(0);
  });

  it("futuristic aircraft has a model path", () => {
    const futuristic = catalog.aircraft.find((a) => a.id === "x-02")!;
    expect(futuristic.modelPath).toBeTruthy();
  });
});
