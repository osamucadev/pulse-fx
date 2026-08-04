import type { IndicatorRepository } from "../../domain/repositories/indicator.repository.js";
import type { Indicator } from "../../generated/prisma/client.js";
import { prisma } from "./client.js";

export class PrismaIndicatorRepository implements IndicatorRepository {
  findAll(): Promise<Indicator[]> {
    return prisma.indicator.findMany();
  }

  findByCode(code: string): Promise<Indicator | null> {
    return prisma.indicator.findUnique({ where: { code } });
  }

  async updateLastSyncedAt(indicatorId: string, syncedAt: Date): Promise<void> {
    await prisma.indicator.update({
      where: { id: indicatorId },
      data: { lastSyncedAt: syncedAt },
    });
  }

  async setFavorite(indicatorId: string, isFavorite: boolean): Promise<void> {
    await prisma.indicator.update({
      where: { id: indicatorId },
      data: { isFavorite },
    });
  }
}
