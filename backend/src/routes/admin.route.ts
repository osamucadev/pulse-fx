import { Router } from "express";
import type { IndicatorObservationRepository } from "../domain/repositories/indicator-observation.repository.js";
import type { IndicatorRepository } from "../domain/repositories/indicator.repository.js";

export interface AdminRouterDeps {
  indicatorRepository: IndicatorRepository;
  observationRepository: IndicatorObservationRepository;
}

export function createAdminRouter(deps: AdminRouterDeps): Router {
  const { indicatorRepository, observationRepository } = deps;
  const adminRouter = Router();

  /**
   * @openapi
   * /admin/reset:
   *   post:
   *     summary: Reset all synced data
   *     description: >
   *       Deletes every observation and clears lastSyncedAt on every
   *       indicator, returning the system to a freshly-seeded state (as if
   *       no sync had ever run). Exists only to support demos and
   *       re-evaluation of this MVP (see PLANNING.md): it has no
   *       authentication because the whole project is single-user without
   *       auth, the same reasoning already applied to favorites. This
   *       endpoint must never exist unprotected in a real production
   *       system.
   *     responses:
   *       200:
   *         description: All synced data was reset.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             example:
   *               message: All synced data has been reset.
   */
  adminRouter.post("/admin/reset", async (_req, res) => {
    await observationRepository.deleteAll();
    await indicatorRepository.resetAllSyncState();
    res.status(200).json({ message: "All synced data has been reset." });
  });

  return adminRouter;
}
