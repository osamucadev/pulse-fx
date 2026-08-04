import type { Indicator } from "../../generated/prisma/client.js";

export interface IndicatorRepository {
  findAll(): Promise<Indicator[]>;
  findByCode(code: string): Promise<Indicator | null>;
  updateLastSyncedAt(indicatorId: string, syncedAt: Date): Promise<void>;
  setFavorite(indicatorId: string, isFavorite: boolean): Promise<void>;
  /**
   * Clears lastSyncedAt on every indicator. Used only by the
   * POST /admin/reset demo endpoint (see PLANNING.md).
   */
  resetAllSyncState(): Promise<void>;
}
