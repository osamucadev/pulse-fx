import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateVariation } from "./variation.js";

function daysFrom(startIso: string, count: number): Date[] {
  const start = new Date(startIso);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(start.getTime());
    date.setUTCDate(date.getUTCDate() + i);
    return date;
  });
}

test("fx: returns a positive variation using the observation 7 positions back", () => {
  const dates = daysFrom("2026-07-20T00:00:00.000Z", 8);
  const observations = dates.map((referenceDate, i) => ({
    referenceDate,
    value: i === 0 ? 5.0 : 5.0, // reference (index 0) fixed at 5.00
  }));
  observations[7].value = 5.25; // current (index 7, 7 positions after index 0)

  const result = calculateVariation("fx", observations);

  assert.deepEqual(result, {
    current: 5.25,
    reference: 5.0,
    variationPercent: 5,
  });
});

test("fx: returns a negative variation using the observation 7 positions back", () => {
  const dates = daysFrom("2026-07-20T00:00:00.000Z", 8);
  const observations = dates.map((referenceDate) => ({
    referenceDate,
    value: 5.0,
  }));
  observations[7].value = 4.75; // current drops from the 5.00 reference

  const result = calculateVariation("fx", observations);

  assert.deepEqual(result, {
    current: 4.75,
    reference: 5.0,
    variationPercent: -5,
  });
});

test("fx: returns null when there are fewer than 8 observations", () => {
  const dates = daysFrom("2026-07-27T00:00:00.000Z", 5);
  const observations = dates.map((referenceDate) => ({
    referenceDate,
    value: 5.0,
  }));

  const result = calculateVariation("fx", observations);

  assert.equal(result, null);
});

test("macro: uses the observation exactly 1 calendar month back when it exists", () => {
  const dates = daysFrom("2026-07-01T00:00:00.000Z", 34); // 2026-07-01 .. 2026-08-03
  const observations = dates.map((referenceDate) => ({
    referenceDate,
    value: 14.25,
  }));
  // 2026-07-03 is exactly one month before the last date, 2026-08-03.
  const julyThirdIndex = 2;
  observations[julyThirdIndex].value = 14.5;
  observations[observations.length - 1].value = 14.0; // current

  const result = calculateVariation("macro", observations);

  assert.deepEqual(result, {
    current: 14.0,
    reference: 14.5,
    variationPercent: ((14.0 - 14.5) / 14.5) * 100,
  });
});

test("macro: falls back to the last known value when the exact date is missing (calendar gap)", () => {
  const allDates = daysFrom("2026-07-01T00:00:00.000Z", 36); // 2026-07-01 .. 2026-08-05
  const skippedIso = "2026-07-05T00:00:00.000Z";
  const dates = allDates.filter(
    (date) => date.toISOString() !== skippedIso,
  );

  const observations = dates.map((referenceDate) => ({
    referenceDate,
    value: 14.25,
  }));

  const julyFourthIndex = observations.findIndex(
    (o) => o.referenceDate.toISOString() === "2026-07-04T00:00:00.000Z",
  );
  const julySixthIndex = observations.findIndex(
    (o) => o.referenceDate.toISOString() === "2026-07-06T00:00:00.000Z",
  );
  observations[julyFourthIndex].value = 14.5; // should be picked (last known before the gap)
  observations[julySixthIndex].value = 13.0; // should NOT be picked (after the target date)
  observations[observations.length - 1].value = 14.0; // current, 2026-08-05

  const result = calculateVariation("macro", observations);

  assert.deepEqual(result, {
    current: 14.0,
    reference: 14.5,
    variationPercent: ((14.0 - 14.5) / 14.5) * 100,
  });
});

test("macro: returns null when no observation exists before the target date", () => {
  const dates = daysFrom("2026-07-20T00:00:00.000Z", 14); // 2026-07-20 .. 2026-08-02
  const observations = dates.map((referenceDate) => ({
    referenceDate,
    value: 14.25,
  }));

  const result = calculateVariation("macro", observations);

  assert.equal(result, null);
});

test("fx: supports a custom lookback (3 positions back instead of the default 7)", () => {
  const dates = daysFrom("2026-07-20T00:00:00.000Z", 4); // only 4 observations
  const observations = dates.map((referenceDate) => ({
    referenceDate,
    value: 5.0,
  }));
  observations[3].value = 5.5; // current, 3 positions after index 0

  // The default lookback (7) would return null here, since there aren't
  // enough observations; a custom lookback of 3 fits within the array.
  const result = calculateVariation("fx", observations, 3);

  assert.deepEqual(result, {
    current: 5.5,
    reference: 5.0,
    variationPercent: 10,
  });
});

test("macro: supports a custom lookback (3 calendar months back instead of the default 1)", () => {
  const dates = daysFrom("2026-05-01T00:00:00.000Z", 95); // 2026-05-01 .. 2026-08-03
  const observations = dates.map((referenceDate) => ({
    referenceDate,
    value: 14.25,
  }));
  // 2026-05-03 is exactly three months before the last date, 2026-08-03.
  const mayThirdIndex = 2;
  observations[mayThirdIndex].value = 15.0;
  observations[observations.length - 1].value = 14.0; // current

  const result = calculateVariation("macro", observations, 3);

  assert.deepEqual(result, {
    current: 14.0,
    reference: 15.0,
    variationPercent: ((14.0 - 15.0) / 15.0) * 100,
  });
});
