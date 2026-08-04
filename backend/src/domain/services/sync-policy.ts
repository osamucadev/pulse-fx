export interface ShouldSyncParams {
  lastSyncedAt: Date | null;
  syncTtlMinutes: number;
  refreshCooldownMinutes: number;
  forced: boolean;
  now: Date;
}

export function shouldSync(params: ShouldSyncParams): boolean {
  const { lastSyncedAt, syncTtlMinutes, refreshCooldownMinutes, forced, now } =
    params;

  if (lastSyncedAt === null) {
    return true;
  }

  const elapsedMinutes =
    (now.getTime() - lastSyncedAt.getTime()) / (60 * 1000);
  const thresholdMinutes = forced ? refreshCooldownMinutes : syncTtlMinutes;

  return elapsedMinutes >= thresholdMinutes;
}
