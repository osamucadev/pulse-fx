import type { Indicator } from "../../generated/prisma/client.js";

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
