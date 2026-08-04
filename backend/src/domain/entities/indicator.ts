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
  | "createdAt"
  | "updatedAt"
>;

export function toIndicatorSummary(indicator: Indicator): IndicatorSummary {
  const { id, code, name, source, type, description, createdAt, updatedAt } =
    indicator;

  return { id, code, name, source, type, description, createdAt, updatedAt };
}

export interface IndicatorDetail extends IndicatorSummary {
  lastValue: number | null;
  lastReferenceDate: Date | null;
  variationPercent: number | null;
}

export function toIndicatorDetail(
  indicator: Indicator,
  observations: VariationObservation[],
): IndicatorDetail {
  const summary = toIndicatorSummary(indicator);
  const last = observations[observations.length - 1] ?? null;
  const variation = calculateVariation(
    indicator.type as IndicatorType,
    observations,
  );

  return {
    ...summary,
    lastValue: last ? last.value : null,
    lastReferenceDate: last ? last.referenceDate : null,
    variationPercent: variation ? variation.variationPercent : null,
  };
}
