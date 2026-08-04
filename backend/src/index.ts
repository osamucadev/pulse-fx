import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./infra/openapi/spec.js";
import { indicatorsRouter } from "./routes/indicators.route.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

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

app.listen(port, () => {
  console.log(`Pulse FX API listening on port ${port}`);
});
