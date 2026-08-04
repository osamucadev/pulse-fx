export type IndicatorType = "fx" | "macro";

export interface VariationObservation {
  referenceDate: Date;
  value: number;
}

export interface VariationResult {
  current: number;
  reference: number;
  variationPercent: number;
}

const FX_LOOKBACK_OBSERVATIONS = 7;
const MACRO_LOOKBACK_MONTHS = 1;

export function defaultLookbackFor(type: IndicatorType): number {
  return type === "fx" ? FX_LOOKBACK_OBSERVATIONS : MACRO_LOOKBACK_MONTHS;
}

function monthsBefore(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() - months);
  return result;
}

function toVariationResult(
  current: number,
  reference: number,
): VariationResult {
  return {
    current,
    reference,
    variationPercent: ((current - reference) / reference) * 100,
  };
}

function calculateFxVariation(
  observations: VariationObservation[],
  lookback: number,
): VariationResult | null {
  const currentIndex = observations.length - 1;
  const referenceIndex = currentIndex - lookback;

  if (referenceIndex < 0) {
    return null;
  }

  return toVariationResult(
    observations[currentIndex].value,
    observations[referenceIndex].value,
  );
}

function calculateMacroVariation(
  observations: VariationObservation[],
  lookback: number,
): VariationResult | null {
  const current = observations[observations.length - 1];
  const targetDate = monthsBefore(current.referenceDate, lookback);

  for (let i = observations.length - 2; i >= 0; i--) {
    const observation = observations[i];
    if (observation.referenceDate.getTime() <= targetDate.getTime()) {
      return toVariationResult(current.value, observation.value);
    }
  }

  return null;
}

/**
 * Assumes `observations` is sorted by referenceDate ascending; the caller
 * is responsible for that ordering.
 *
 * `lookback` is the reference offset to compare the current value against:
 * positions back in the array for type "fx" (default 7, business days
 * since only trading days are persisted), or calendar months back for
 * type "macro" (default 1). See PLANNING.md for why this is configurable.
 */
export function calculateVariation(
  type: IndicatorType,
  observations: VariationObservation[],
  lookback?: number,
): VariationResult | null {
  if (observations.length === 0) {
    return null;
  }

  const effectiveLookback = lookback ?? defaultLookbackFor(type);

  return type === "fx"
    ? calculateFxVariation(observations, effectiveLookback)
    : calculateMacroVariation(observations, effectiveLookback);
}
