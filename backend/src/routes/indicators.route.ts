import { Router } from "express";
import { PrismaIndicatorRepository } from "../infra/prisma/indicator.repository.js";

export const indicatorsRouter = Router();

const indicatorRepository = new PrismaIndicatorRepository();

indicatorsRouter.get("/indicators", async (_req, res) => {
  const indicators = await indicatorRepository.findAll();
  res.status(200).json(indicators);
});
