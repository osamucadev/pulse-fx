import { Router } from "express";
import { toIndicatorSummary } from "../domain/entities/indicator.js";
import type { SyncRange } from "../domain/services/indicator-sync.service.js";
import { syncIndicator } from "../domain/services/indicator-sync.service.js";
import { shouldSync } from "../domain/services/sync-policy.js";
import { PrismaIndicatorRepository } from "../infra/prisma/indicator.repository.js";

export const indicatorsRouter = Router();

const indicatorRepository = new PrismaIndicatorRepository();

const SYNC_RANGE_DAYS = 90;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

function last90DaysRange(now: Date): SyncRange {
  return {
    startDate: new Date(now.getTime() - SYNC_RANGE_DAYS * DAY_IN_MS),
    endDate: now,
  };
}

indicatorsRouter.get("/indicators", async (_req, res) => {
  const indicators = await indicatorRepository.findAll();
  res.status(200).json(indicators.map(toIndicatorSummary));
});

indicatorsRouter.get("/indicators/:code", async (req, res) => {
  const { code } = req.params;
  const indicator = await indicatorRepository.findByCode(code);

  if (!indicator) {
    res.status(404).json({ message: `Indicator "${code}" not found` });
    return;
  }

  const now = new Date();
  const needsSync = shouldSync({
    lastSyncedAt: indicator.lastSyncedAt,
    syncTtlMinutes: indicator.syncTtlMinutes,
    refreshCooldownMinutes: indicator.refreshCooldownMinutes,
    forced: false,
    now,
  });

  if (!needsSync) {
    res.status(200).json(toIndicatorSummary(indicator));
    return;
  }

  await syncIndicator(indicator, last90DaysRange(now));
  const updated = await indicatorRepository.findByCode(code);
  res.status(200).json(toIndicatorSummary(updated ?? indicator));
});

indicatorsRouter.post("/indicators/:code/refresh", async (req, res) => {
  const { code } = req.params;
  const indicator = await indicatorRepository.findByCode(code);

  if (!indicator) {
    res.status(404).json({ message: `Indicator "${code}" not found` });
    return;
  }

  const now = new Date();
  const canSync = shouldSync({
    lastSyncedAt: indicator.lastSyncedAt,
    syncTtlMinutes: indicator.syncTtlMinutes,
    refreshCooldownMinutes: indicator.refreshCooldownMinutes,
    forced: true,
    now,
  });

  if (!canSync) {
    // shouldSync only returns false here when lastSyncedAt is set (a
    // never-synced indicator always returns true), so this read is safe.
    const cooldownEndsAt =
      indicator.lastSyncedAt!.getTime() +
      indicator.refreshCooldownMinutes * MINUTE_IN_MS;
    const minutesRemaining = Math.ceil(
      (cooldownEndsAt - now.getTime()) / MINUTE_IN_MS,
    );

    res.status(429).json({
      message: "Refresh cooldown has not expired yet",
      minutesRemaining,
    });
    return;
  }

  await syncIndicator(indicator, last90DaysRange(now));
  const updated = await indicatorRepository.findByCode(code);
  res.status(200).json(toIndicatorSummary(updated ?? indicator));
});
