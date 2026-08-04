import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import request from "supertest";
import type { Indicator } from "../generated/prisma/client.js";
import type { IndicatorObservationRepository } from "../domain/repositories/indicator-observation.repository.js";
import type { IndicatorRepository } from "../domain/repositories/indicator.repository.js";
import { createIndicatorsRouter } from "./indicators.route.js";

function createSpy<Args extends unknown[], Result>(
  impl: (...args: Args) => Result,
) {
  const calls: Args[] = [];
  const spy = (...args: Args): Result => {
    calls.push(args);
    return impl(...args);
  };
  spy.calls = calls;
  return spy;
}

function buildIndicator(overrides: Partial<Indicator> = {}): Indicator {
  return {
    id: "indicator-1",
    code: "usd_brl",
    name: "Dólar Americano (PTAX)",
    source: "bcb",
    type: "fx",
    description: "test indicator",
    lastSyncedAt: null,
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
    isFavorite: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function buildApp(
  indicator: Indicator,
  syncIndicator: (indicator: Indicator, range: unknown) => Promise<void>,
) {
  const indicatorRepository: IndicatorRepository = {
    findAll: async () => [indicator],
    findByCode: async (code) => (code === indicator.code ? indicator : null),
    updateLastSyncedAt: async () => {},
    setFavorite: async () => {},
    resetAllSyncState: async () => {},
  };

  const observationRepository: IndicatorObservationRepository = {
    upsertMany: async () => {},
    findByIndicatorId: async () => [],
    deleteAll: async () => {},
  };

  const app = express();
  app.use(express.json());
  app.use(
    createIndicatorsRouter({
      indicatorRepository,
      observationRepository,
      syncIndicator: syncIndicator as never,
    }),
  );
  return app;
}

test("GET /indicators/:code does not sync when the TTL has not elapsed", async () => {
  const syncIndicator = createSpy(async () => {});
  const indicator = buildIndicator({
    lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago, TTL is 60 min
  });
  const app = buildApp(indicator, syncIndicator);

  const response = await request(app).get("/indicators/usd_brl");

  assert.equal(response.status, 200);
  assert.equal(syncIndicator.calls.length, 0);
});

test("GET /indicators/:code syncs when the TTL has elapsed", async () => {
  const syncIndicator = createSpy(async () => {});
  const indicator = buildIndicator({
    lastSyncedAt: new Date(Date.now() - 90 * 60 * 1000), // 90 min ago, past the 60 min TTL
  });
  const app = buildApp(indicator, syncIndicator);

  const response = await request(app).get("/indicators/usd_brl");

  assert.equal(response.status, 200);
  assert.equal(syncIndicator.calls.length, 1);
});
