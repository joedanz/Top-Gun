// ABOUTME: Tests for aircraft data loading and registry functions.
// ABOUTME: Verifies catalog loading, lookup, and error handling.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadAircraftCatalog, getAircraftStats, getAircraftCatalog, resetCatalog } from "./AircraftData";
import type { AircraftCatalog } from "./AircraftData";

const MOCK_CATALOG: AircraftCatalog = {
  aircraft: [
    {
      id: "f-14",
      name: "F-14 Tomcat",
      flightParams: {
        maxSpeed: 260,
        acceleration: 50,
        deceleration: 30,
        turnRate: 1.6,
        stallThreshold: 25,
        stallNoseDrop: 0.8,
        stallSpeedRecovery: 15,
        altitudeFloor: 2,
      },
      weaponLoadout: { gunAmmo: 200, missiles: 6 },
    },
    {
      id: "p-51",
      name: "P-51 Mustang",
      flightParams: {
        maxSpeed: 140,
        acceleration: 25,
        deceleration: 20,
        turnRate: 2.8,
        stallThreshold: 15,
        stallNoseDrop: 0.6,
        stallSpeedRecovery: 12,
        altitudeFloor: 2,
      },
      weaponLoadout: { gunAmmo: 300, missiles: 0 },
    },
    {
      id: "fa-18",
      name: "F/A-18 Super Hornet",
      flightParams: {
        maxSpeed: 220,
        acceleration: 45,
        deceleration: 35,
        turnRate: 2.2,
        stallThreshold: 20,
        stallNoseDrop: 0.8,
        stallSpeedRecovery: 15,
        altitudeFloor: 2,
      },
      weaponLoadout: { gunAmmo: 250, missiles: 4 },
    },
  ],
};

describe("AircraftData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetCatalog();
  });

  describe("loadAircraftCatalog", () => {
    it("loads and parses aircraft catalog from URL", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_CATALOG),
      }));

      const result = await loadAircraftCatalog("/data/aircraft.json");
      expect(result.aircraft).toHaveLength(3);
      expect(result.aircraft[0].id).toBe("f-14");
    });

    it("throws on fetch failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }));

      await expect(loadAircraftCatalog("/data/aircraft.json")).rejects.toThrow("Failed to load aircraft data: 404");
    });
  });

  describe("getAircraftStats", () => {
    it("throws if catalog not loaded", () => {
      expect(() => getAircraftStats("f-14")).toThrow("Aircraft catalog not loaded");
    });

    it("returns stats for a known aircraft after loading", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_CATALOG),
      }));
      await loadAircraftCatalog("/data/aircraft.json");

      const stats = getAircraftStats("f-14");
      expect(stats.name).toBe("F-14 Tomcat");
      expect(stats.flightParams.maxSpeed).toBe(260);
      expect(stats.weaponLoadout.missiles).toBe(6);
    });

    it("throws for unknown aircraft id", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_CATALOG),
      }));
      await loadAircraftCatalog("/data/aircraft.json");

      expect(() => getAircraftStats("sr-71")).toThrow("Unknown aircraft: sr-71");
    });
  });

  describe("getAircraftCatalog", () => {
    it("throws if catalog not loaded", () => {
      expect(() => getAircraftCatalog()).toThrow("Aircraft catalog not loaded");
    });

    it("returns full catalog after loading", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_CATALOG),
      }));
      await loadAircraftCatalog("/data/aircraft.json");

      const cat = getAircraftCatalog();
      expect(cat.aircraft).toHaveLength(3);
      expect(cat.aircraft.map((a) => a.id)).toEqual(["f-14", "p-51", "fa-18"]);
    });
  });

  describe("aircraft stat variety", () => {
    it("P-51 is slowest but most agile", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_CATALOG),
      }));
      await loadAircraftCatalog("/data/aircraft.json");

      const f14 = getAircraftStats("f-14");
      const p51 = getAircraftStats("p-51");
      const fa18 = getAircraftStats("fa-18");

      // P-51 slowest
      expect(p51.flightParams.maxSpeed).toBeLessThan(fa18.flightParams.maxSpeed);
      expect(p51.flightParams.maxSpeed).toBeLessThan(f14.flightParams.maxSpeed);

      // P-51 tightest turns
      expect(p51.flightParams.turnRate).toBeGreaterThan(fa18.flightParams.turnRate);
      expect(p51.flightParams.turnRate).toBeGreaterThan(f14.flightParams.turnRate);

      // F-14 fastest
      expect(f14.flightParams.maxSpeed).toBeGreaterThan(fa18.flightParams.maxSpeed);
    });
  });
});
