export interface ObservationInput {
  referenceDate: Date;
  value: number;
}

export interface IndicatorObservationRepository {
  upsertMany(
    indicatorId: string,
    observations: ObservationInput[],
  ): Promise<void>;
}
