import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { prisma } from "./client.js";
import { PrismaIndicatorObservationRepository } from "./indicator-observation.repository.js";

const repository = new PrismaIndicatorObservationRepository();

let testIndicatorId: string;

beforeEach(async () => {
  const indicator = await prisma.indicator.create({
    data: {
      code: "__test_indicator__",
      name: "Test Indicator",
      source: "test",
      type: "fx",
      description:
        "Indicator created only for indicator-observation.repository.test.ts",
      syncTtlMinutes: 60,
      refreshCooldownMinutes: 30,
    },
  });
  testIndicatorId = indicator.id;
});

afterEach(async () => {
  // onDelete: Cascade on IndicatorObservation removes any observations
  // created during the test too.
  await prisma.indicator.delete({ where: { id: testIndicatorId } });
});

test("upsertMany creates new observations", async () => {
  await repository.upsertMany(testIndicatorId, [
    { referenceDate: new Date("2026-07-01T00:00:00.000Z"), value: 5.1 },
    { referenceDate: new Date("2026-07-02T00:00:00.000Z"), value: 5.2 },
  ]);

  const rows = await prisma.indicatorObservation.findMany({
    where: { indicatorId: testIndicatorId },
    orderBy: { referenceDate: "asc" },
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].value.toNumber(), 5.1);
  assert.equal(rows[1].value.toNumber(), 5.2);
});

test("upsertMany updates the existing value instead of creating a duplicate", async () => {
  const referenceDate = new Date("2026-07-01T00:00:00.000Z");

  await repository.upsertMany(testIndicatorId, [
    { referenceDate, value: 5.1 },
  ]);

  const countBefore = await prisma.indicatorObservation.count({
    where: { indicatorId: testIndicatorId },
  });

  await repository.upsertMany(testIndicatorId, [
    { referenceDate, value: 5.9 },
  ]);

  const countAfter = await prisma.indicatorObservation.count({
    where: { indicatorId: testIndicatorId },
  });

  const row = await prisma.indicatorObservation.findUniqueOrThrow({
    where: {
      indicatorId_referenceDate: { indicatorId: testIndicatorId, referenceDate },
    },
  });

  assert.equal(countBefore, 1);
  assert.equal(countAfter, 1);
  assert.equal(row.value.toNumber(), 5.9);
});

test("preserves decimal precision when reading a persisted value back", async () => {
  await repository.upsertMany(testIndicatorId, [
    { referenceDate: new Date("2026-08-03T00:00:00.000Z"), value: 5.0723 },
  ]);

  const observations = await repository.findByIndicatorId(testIndicatorId);

  assert.equal(observations.length, 1);
  assert.equal(observations[0].value, 5.0723);
});
