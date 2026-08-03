import type { Indicator } from "../../generated/prisma/client.js";

export interface IndicatorRepository {
  findAll(): Promise<Indicator[]>;
  findByCode(code: string): Promise<Indicator | null>;
}
