export interface ObservationInput {
  referenceDate: Date;
  value: number;
}

export interface IndicatorObservationRepository {
  upsertMany(
    indicatorId: string,
    observations: ObservationInput[],
  ): Promise<void>;
  /**
   * Returns observations ordered by referenceDate ascending, ready to feed
   * into calculateVariation directly.
   */
  findByIndicatorId(indicatorId: string): Promise<ObservationInput[]>;
}
