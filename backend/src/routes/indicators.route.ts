import { Router } from "express";
import { toIndicatorSummary } from "../domain/entities/indicator.js";
import { PrismaIndicatorRepository } from "../infra/prisma/indicator.repository.js";

export const indicatorsRouter = Router();

const indicatorRepository = new PrismaIndicatorRepository();

indicatorsRouter.get("/indicators", async (_req, res) => {
  const indicators = await indicatorRepository.findAll();
  res.status(200).json(indicators.map(toIndicatorSummary));
});
