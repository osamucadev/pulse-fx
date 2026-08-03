import type { Indicator } from "../../generated/prisma/client.js";
import { fetchUsdBrlRates } from "../../infra/external/bcb/ptax.client.js";
import { fetchSelicRates } from "../../infra/external/bcb/sgs.client.js";
import { fetchFedFundsRate } from "../../infra/external/fred/fred.client.js";
import { PrismaIndicatorObservationRepository } from "../../infra/prisma/indicator-observation.repository.js";
import { PrismaIndicatorRepository } from "../../infra/prisma/indicator.repository.js";
import type { ObservationInput } from "../repositories/indicator-observation.repository.js";

export interface SyncRange {
  startDate: Date;
  endDate: Date;
}

const indicatorRepository = new PrismaIndicatorRepository();
const observationRepository = new PrismaIndicatorObservationRepository();

async function fetchObservations(
  indicator: Indicator,
  range: SyncRange,
): Promise<ObservationInput[]> {
  switch (indicator.code) {
    case "usd_brl": {
      const rates = await fetchUsdBrlRates(range.startDate, range.endDate);
      return rates.map((rate) => ({
        referenceDate: rate.referenceDate,
        value: rate.sellRate,
      }));
    }
    case "selic": {
      const rates = await fetchSelicRates(range.startDate, range.endDate);
      return rates.map((rate) => ({
        referenceDate: rate.referenceDate,
        value: rate.rate,
      }));
    }
    case "fed_funds_rate": {
      const rates = await fetchFedFundsRate(range.startDate, range.endDate);
      return rates.map((rate) => ({
        referenceDate: rate.referenceDate,
        value: rate.rate,
      }));
    }
    default:
      throw new Error(
        `No external data source mapped for indicator code "${indicator.code}"`,
      );
  }
}

export async function syncIndicator(
  indicator: Indicator,
  range: SyncRange,
): Promise<void> {
  const observations = await fetchObservations(indicator, range);
  await observationRepository.upsertMany(indicator.id, observations);
  await indicatorRepository.updateLastSyncedAt(indicator.id, new Date());
}
