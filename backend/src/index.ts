import express from "express";
import { indicatorsRouter } from "./routes/indicators.route.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(indicatorsRouter);

app.listen(port, () => {
  console.log(`Pulse FX API listening on port ${port}`);
});
