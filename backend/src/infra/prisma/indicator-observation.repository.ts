import type {
  IndicatorObservationRepository,
  ObservationInput,
} from "../../domain/repositories/indicator-observation.repository.js";
import { prisma } from "./client.js";

export class PrismaIndicatorObservationRepository
  implements IndicatorObservationRepository
{
  async upsertMany(
    indicatorId: string,
    observations: ObservationInput[],
  ): Promise<void> {
    // Wrapped in a transaction so a batch of observations (e.g. a whole
    // sync run) is all-or-nothing: if one upsert fails partway through,
    // none of the others are committed either, avoiding a half-written
    // history for the indicator.
    await prisma.$transaction(
      observations.map((observation) =>
        prisma.indicatorObservation.upsert({
          where: {
            indicatorId_referenceDate: {
              indicatorId,
              referenceDate: observation.referenceDate,
            },
          },
          update: {
            value: observation.value,
          },
          create: {
            indicatorId,
            referenceDate: observation.referenceDate,
            value: observation.value,
          },
        }),
      ),
    );
  }
}
