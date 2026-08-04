import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldSync } from "./sync-policy.js";

const NOW = new Date("2026-08-03T12:00:00.000Z");

test("returns true when the indicator was never synced", () => {
  const result = shouldSync({
    lastSyncedAt: null,
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
    forced: false,
    now: NOW,
  });

  assert.equal(result, true);
});

test("returns false when not forced and still within the TTL", () => {
  const result = shouldSync({
    lastSyncedAt: new Date("2026-08-03T11:30:00.000Z"), // 30 min ago
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
    forced: false,
    now: NOW,
  });

  assert.equal(result, false);
});

test("returns true when not forced and the TTL has elapsed", () => {
  const result = shouldSync({
    lastSyncedAt: new Date("2026-08-03T10:30:00.000Z"), // 90 min ago
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
    forced: false,
    now: NOW,
  });

  assert.equal(result, true);
});

test("returns false when forced but still within the refresh cooldown", () => {
  const result = shouldSync({
    lastSyncedAt: new Date("2026-08-03T11:45:00.000Z"), // 15 min ago
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
    forced: true,
    now: NOW,
  });

  assert.equal(result, false);
});

test("returns true when forced and the refresh cooldown has elapsed", () => {
  const result = shouldSync({
    lastSyncedAt: new Date("2026-08-03T11:00:00.000Z"), // 60 min ago
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
    forced: true,
    now: NOW,
  });

  assert.equal(result, true);
});
