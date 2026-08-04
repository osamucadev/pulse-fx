import type { Indicator } from "../../generated/prisma/client.js";
import type { VariationObservation } from "../services/variation.js";
import { calculateVariation, type IndicatorType } from "../services/variation.js";

export type IndicatorSummary = Pick<
  Indicator,
  | "id"
  | "code"
  | "name"
  | "source"
  | "type"
  | "description"
  | "isFavorite"
  | "createdAt"
  | "updatedAt"
>;

export function toIndicatorSummary(indicator: Indicator): IndicatorSummary {
  const {
    id,
    code,
    name,
    source,
    type,
    description,
    isFavorite,
    createdAt,
    updatedAt,
  } = indicator;

  return {
    id,
    code,
    name,
    source,
    type,
    description,
    isFavorite,
    createdAt,
    updatedAt,
  };
}

export interface IndicatorWithVariation extends IndicatorSummary {
  lastValue: number | null;
  lastReferenceDate: Date | null;
  variationPercent: number | null;
}

export function toIndicatorWithVariation(
  indicator: Indicator,
  observations: VariationObservation[],
  lookback?: number,
): IndicatorWithVariation {
  const summary = toIndicatorSummary(indicator);
  const last = observations[observations.length - 1] ?? null;
  const variation = calculateVariation(
    indicator.type as IndicatorType,
    observations,
    lookback,
  );

  return {
    ...summary,
    lastValue: last ? last.value : null,
    lastReferenceDate: last ? last.referenceDate : null,
    variationPercent: variation ? variation.variationPercent : null,
  };
}

export interface IndicatorDetail extends IndicatorWithVariation {
  observations: VariationObservation[];
}

export function toIndicatorDetail(
  indicator: Indicator,
  observations: VariationObservation[],
  lookback?: number,
): IndicatorDetail {
  return {
    ...toIndicatorWithVariation(indicator, observations, lookback),
    observations,
  };
}
