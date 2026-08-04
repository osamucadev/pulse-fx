import { Router } from "express";
import type { Indicator } from "../generated/prisma/client.js";
import {
  toIndicatorDetail,
  toIndicatorSummary,
  toIndicatorWithVariation,
} from "../domain/entities/indicator.js";
import type { IndicatorObservationRepository } from "../domain/repositories/indicator-observation.repository.js";
import type { IndicatorRepository } from "../domain/repositories/indicator.repository.js";
import type { SyncRange } from "../domain/services/indicator-sync.service.js";
import { shouldSync } from "../domain/services/sync-policy.js";
import {
  defaultLookbackFor,
  type IndicatorType,
  type VariationObservation,
} from "../domain/services/variation.js";

export interface IndicatorsRouterDeps {
  indicatorRepository: IndicatorRepository;
  observationRepository: IndicatorObservationRepository;
  syncIndicator: (indicator: Indicator, range: SyncRange) => Promise<void>;
}

// Approximate calendar-day span needed to reach the variation reference
// point for a given type + lookback. Used only to size the `observations`
// display window, never the variation calculation itself (which always
// runs against the full persisted history, see toIndicatorDetail below,
// so this approximation being off by a few days never affects the actual
// numbers, only how much chart context is shown).
//
// fx's lookback counts business-day positions in the persisted (trading
// days only) observations, so this converts it to an approximate calendar
// span using the standard ~5-trading-days-per-7-calendar-days ratio.
// macro's lookback is already calendar months, converted using a safe
// 31-day upper bound per month.
function referenceSpanDaysFor(type: string, lookback: number): number {
  return type === "fx" ? Math.ceil((lookback * 7) / 5) : lookback * 31;
}

// Extra context on top of the minimum span needed to reach the reference
// point, so it doesn't sit right at the chart's left edge: 30% more time,
// plus a flat 5-day floor so small lookbacks (e.g. fx's 7-business-day
// default) still get a few extra days of visible margin, not just a
// fraction of an already-small span.
const WINDOW_MARGIN_FACTOR = 1.3;
const WINDOW_MARGIN_FLOOR_DAYS = 5;

function dynamicHistoryWindowDays(type: string, lookback: number): number {
  const span = referenceSpanDaysFor(type, lookback);
  return Math.ceil(span * WINDOW_MARGIN_FACTOR) + WINDOW_MARGIN_FLOOR_DAYS;
}

// How far back syncIndicator fetches from the external source. This is
// intentionally a separate, larger concern than the observations display
// window above: the `lookback` query param lets the frontend request a
// variation reference point further back than the display window ever
// shows (macro presets go up to 6 months), and the database needs to
// actually hold that much history for the calculation to find a
// reference observation instead of returning null.
//
// Differentiated by indicator type rather than a single shared value (see
// PLANNING.md for the reasoning): fx's largest preset is 30 business days
// (~42 calendar days), so its existing 90-day range already has plenty of
// margin and doesn't need to grow. macro's largest preset is 6 months
// (~183 days), so it gets a larger range with margin to spare.
const FX_SYNC_RANGE_DAYS = 90;
const MACRO_SYNC_RANGE_DAYS = 200;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

function syncRangeDaysFor(type: string): number {
  return type === "fx" ? FX_SYNC_RANGE_DAYS : MACRO_SYNC_RANGE_DAYS;
}

function syncRangeFor(indicator: Indicator, now: Date): SyncRange {
  const rangeDays = syncRangeDaysFor(indicator.type);
  return {
    startDate: new Date(now.getTime() - rangeDays * DAY_IN_MS),
    endDate: now,
  };
}

function withinHistoryWindow(
  observations: VariationObservation[],
  now: Date,
  windowDays: number,
): VariationObservation[] {
  const cutoff = now.getTime() - windowDays * DAY_IN_MS;
  return observations.filter(
    (observation) => observation.referenceDate.getTime() >= cutoff,
  );
}

// Returns undefined when the query param wasn't provided (caller should use
// the variation default), a positive integer when it's valid, or null when
// it was provided but isn't a positive integer.
function parseLookback(raw: unknown): number | null | undefined {
  if (raw === undefined) {
    return undefined;
  }

  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number(raw);
  return parsed > 0 ? parsed : null;
}

export function createIndicatorsRouter(deps: IndicatorsRouterDeps): Router {
  const { indicatorRepository, observationRepository, syncIndicator } = deps;
  const indicatorsRouter = Router();

  /**
   * @openapi
   * /indicators:
   *   get:
   *     summary: List all indicators
   *     description: >
   *       Returns the indicator catalog (USD/BRL, Selic, Fed Funds Rate)
   *       with each one's latest value and percentage variation. Reads
   *       only what is already persisted, never triggers an external sync.
   *     responses:
   *       200:
   *         description: List of indicators, including latest value and variation.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/IndicatorWithVariation'
   */
  indicatorsRouter.get("/indicators", async (_req, res) => {
    const indicators = await indicatorRepository.findAll();
    const summaries = await Promise.all(
      indicators.map(async (indicator) => {
        const observations = await observationRepository.findByIndicatorId(
          indicator.id,
        );
        return toIndicatorWithVariation(indicator, observations);
      }),
    );
    res.status(200).json(summaries);
  });

  /**
   * @openapi
   * /indicators/{code}:
   *   get:
   *     summary: Get a single indicator by code
   *     description: >
   *       Returns one indicator with its latest value, percentage
   *       variation, and observation history sized to comfortably show
   *       the variation's reference point. Before responding, checks
   *       whether its data is older than syncTtlMinutes; if so, fetches
   *       fresh data from the external source and persists it first
   *       (passive TTL sync).
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         example: usd_brl
   *         description: Indicator code (usd_brl, selic, fed_funds_rate).
   *       - in: query
   *         name: lookback
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *         example: 15
   *         description: >
   *           Overrides the reference offset used to calculate
   *           variationPercent: positions back in the observation history
   *           for type "fx" (default 7, business days), or calendar
   *           months back for type "macro" (default 1). The observations
   *           history window is always sized dynamically from this
   *           effective value (the one given here, or the type's default
   *           when omitted) plus context margin, never a separate fixed
   *           window. See PLANNING.md.
   *     responses:
   *       200:
   *         description: The indicator, including its latest value, variation, and observation history.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/IndicatorDetail'
   *       400:
   *         description: The lookback query param was provided but isn't a positive integer.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorMessage'
   *             example:
   *               message: '"lookback" must be a positive integer'
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

    const lookback = parseLookback(req.query.lookback);
    if (lookback === null) {
      res.status(400).json({ message: '"lookback" must be a positive integer' });
      return;
    }

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
      await syncIndicator(indicator, syncRangeFor(indicator, now));
    }

    const current = needsSync
      ? ((await indicatorRepository.findByCode(code)) ?? indicator)
      : indicator;
    // The variation reference point can fall further back than the
    // observations window below (e.g. a 6-month macro lookback), so it's
    // calculated against the full observation set, not the windowed one.
    const allObservations = await observationRepository.findByIndicatorId(
      current.id,
    );
    const detail = toIndicatorDetail(current, allObservations, lookback);
    // The window is always derived from the effective lookback (the one
    // from the query param, or the type's own default when it's absent),
    // never a separate fixed value - otherwise the very first load (no
    // `lookback` param yet) would show a window inconsistent with the
    // variationPercent already being calculated against that same default.
    const effectiveLookback =
      lookback ?? defaultLookbackFor(current.type as IndicatorType);
    const windowDays = dynamicHistoryWindowDays(current.type, effectiveLookback);
    const observations = withinHistoryWindow(allObservations, now, windowDays);

    res.status(200).json({ ...detail, observations });
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

    await syncIndicator(indicator, syncRangeFor(indicator, now));
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
