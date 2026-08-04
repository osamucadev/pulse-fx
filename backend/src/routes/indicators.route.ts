import { Router } from "express";
import type { Indicator } from "../generated/prisma/client.js";
import {
  toIndicatorDetail,
  toIndicatorSummary,
} from "../domain/entities/indicator.js";
import type { IndicatorObservationRepository } from "../domain/repositories/indicator-observation.repository.js";
import type { IndicatorRepository } from "../domain/repositories/indicator.repository.js";
import type { SyncRange } from "../domain/services/indicator-sync.service.js";
import { shouldSync } from "../domain/services/sync-policy.js";

export interface IndicatorsRouterDeps {
  indicatorRepository: IndicatorRepository;
  observationRepository: IndicatorObservationRepository;
  syncIndicator: (indicator: Indicator, range: SyncRange) => Promise<void>;
}

const SYNC_RANGE_DAYS = 90;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

function last90DaysRange(now: Date): SyncRange {
  return {
    startDate: new Date(now.getTime() - SYNC_RANGE_DAYS * DAY_IN_MS),
    endDate: now,
  };
}

export function createIndicatorsRouter(deps: IndicatorsRouterDeps): Router {
  const { indicatorRepository, observationRepository, syncIndicator } = deps;
  const indicatorsRouter = Router();

  /**
   * @openapi
   * /indicators:
   *   get:
   *     summary: List all indicators
   *     description: Returns the indicator catalog (USD/BRL, Selic, Fed Funds Rate). Reads only what is already persisted, never triggers an external sync.
   *     responses:
   *       200:
   *         description: List of indicators.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/IndicatorSummary'
   */
  indicatorsRouter.get("/indicators", async (_req, res) => {
    const indicators = await indicatorRepository.findAll();
    res.status(200).json(indicators.map(toIndicatorSummary));
  });

  /**
   * @openapi
   * /indicators/{code}:
   *   get:
   *     summary: Get a single indicator by code
   *     description: >
   *       Returns one indicator with its latest value and percentage
   *       variation. Before responding, checks whether its data is older
   *       than syncTtlMinutes; if so, fetches fresh data from the external
   *       source and persists it first (passive TTL sync).
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         example: usd_brl
   *         description: Indicator code (usd_brl, selic, fed_funds_rate).
   *     responses:
   *       200:
   *         description: The indicator, including its latest value and variation.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/IndicatorDetail'
   *       404:
   *         description: No indicator exists with the given code.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorMessage'
   *             example:
   *               message: 'Indicator "unknown" not found'
   */
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

    if (needsSync) {
      await syncIndicator(indicator, last90DaysRange(now));
    }

    const current = needsSync
      ? ((await indicatorRepository.findByCode(code)) ?? indicator)
      : indicator;
    const observations = await observationRepository.findByIndicatorId(
      current.id,
    );

    res.status(200).json(toIndicatorDetail(current, observations));
  });

  /**
   * @openapi
   * /indicators/{code}/refresh:
   *   post:
   *     summary: Force a sync for a single indicator
   *     description: >
   *       Forces a fresh fetch from the external source, bypassing the
   *       passive TTL, but still subject to refreshCooldownMinutes counted
   *       from the last real sync (not from the last refresh attempt).
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         example: usd_brl
   *         description: Indicator code (usd_brl, selic, fed_funds_rate).
   *     responses:
   *       200:
   *         description: Sync completed, returns the updated indicator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/IndicatorSummary'
   *       404:
   *         description: No indicator exists with the given code.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorMessage'
   *             example:
   *               message: 'Indicator "unknown" not found'
   *       429:
   *         description: The refresh cooldown has not expired yet.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 minutesRemaining:
   *                   type: integer
   *             example:
   *               message: Refresh cooldown has not expired yet
   *               minutesRemaining: 30
   */
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

  /**
   * @openapi
   * /indicators/{code}/favorite:
   *   patch:
   *     summary: Mark or unmark an indicator as favorite
   *     description: >
   *       Sets whether this indicator belongs to "My indicators". Single-user
   *       MVP: this is a plain flag on the indicator, not a user-indicator
   *       relation (see PLANNING.md).
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         example: usd_brl
   *         description: Indicator code (usd_brl, selic, fed_funds_rate).
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - isFavorite
   *             properties:
   *               isFavorite:
   *                 type: boolean
   *           example:
   *             isFavorite: true
   *     responses:
   *       200:
   *         description: Updated indicator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/IndicatorSummary'
   *       400:
   *         description: The request body is missing isFavorite or it isn't a boolean.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorMessage'
   *             example:
   *               message: '"isFavorite" must be a boolean'
   *       404:
   *         description: No indicator exists with the given code.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorMessage'
   *             example:
   *               message: 'Indicator "unknown" not found'
   */
  indicatorsRouter.patch("/indicators/:code/favorite", async (req, res) => {
    const { code } = req.params;
    const { isFavorite } = req.body ?? {};

    if (typeof isFavorite !== "boolean") {
      res.status(400).json({ message: '"isFavorite" must be a boolean' });
      return;
    }

    const indicator = await indicatorRepository.findByCode(code);

    if (!indicator) {
      res.status(404).json({ message: `Indicator "${code}" not found` });
      return;
    }

    await indicatorRepository.setFavorite(indicator.id, isFavorite);
    const updated = await indicatorRepository.findByCode(code);
    res.status(200).json(toIndicatorSummary(updated ?? indicator));
  });

  return indicatorsRouter;
}
