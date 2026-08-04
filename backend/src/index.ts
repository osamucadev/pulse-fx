import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { syncIndicator } from "./domain/services/indicator-sync.service.js";
import { openApiSpec } from "./infra/openapi/spec.js";
import { PrismaIndicatorObservationRepository } from "./infra/prisma/indicator-observation.repository.js";
import { PrismaIndicatorRepository } from "./infra/prisma/indicator.repository.js";
import { createAdminRouter } from "./routes/admin.route.js";
import { createIndicatorsRouter } from "./routes/indicators.route.js";

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const indicatorRepository = new PrismaIndicatorRepository();
const observationRepository = new PrismaIndicatorObservationRepository();

const indicatorsRouter = createIndicatorsRouter({
  indicatorRepository,
  observationRepository,
  syncIndicator,
});

const adminRouter = createAdminRouter({
  indicatorRepository,
  observationRepository,
});

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Confirms the API process is up and responding. Does not check the database connection.
 *     responses:
 *       200:
 *         description: The service is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(indicatorsRouter);
app.use(adminRouter);

app.listen(port, () => {
  console.log(`Pulse FX API listening on port ${port}`);
});
