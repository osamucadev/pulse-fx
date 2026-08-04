import swaggerJsdoc from "swagger-jsdoc";

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pulse FX API",
      version: "0.1.0",
      description:
        "API do Pulse FX: cotação USD/BRL e indicadores macroeconômicos (Selic, Fed Funds Rate) a partir de fontes públicas (BCB, FRED).",
    },
    components: {
      schemas: {
        IndicatorSummary: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            code: { type: "string" },
            name: { type: "string" },
            source: { type: "string" },
            type: { type: "string" },
            description: { type: "string" },
            isFavorite: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          example: {
            id: "9168688f-ad26-4751-9321-856eb060b574",
            code: "usd_brl",
            name: "Dólar Americano (PTAX)",
            source: "bcb",
            type: "fx",
            description:
              "Cotação de fechamento do dólar americano frente ao real, calculada pelo Banco Central através da pesquisa PTAX.",
            isFavorite: false,
            createdAt: "2026-08-03T23:23:29.102Z",
            updatedAt: "2026-08-04T00:11:40.930Z",
          },
        },
        IndicatorWithVariation: {
          allOf: [
            { $ref: "#/components/schemas/IndicatorSummary" },
            {
              type: "object",
              properties: {
                lastValue: {
                  type: "number",
                  nullable: true,
                  description: "Most recent persisted value, or null if the indicator has no observations yet.",
                },
                lastReferenceDate: {
                  type: "string",
                  format: "date",
                  nullable: true,
                  description: "Reference date of lastValue, or null if the indicator has no observations yet.",
                },
                variationPercent: {
                  type: "number",
                  nullable: true,
                  description: "Percentage variation against the reference window for the indicator's type (7 business-day observations for fx, 1 calendar month for macro), or null if there isn't enough history yet.",
                },
              },
            },
          ],
          example: {
            id: "9168688f-ad26-4751-9321-856eb060b574",
            code: "usd_brl",
            name: "Dólar Americano (PTAX)",
            source: "bcb",
            type: "fx",
            description:
              "Cotação de fechamento do dólar americano frente ao real, calculada pelo Banco Central através da pesquisa PTAX.",
            isFavorite: false,
            createdAt: "2026-08-03T23:23:29.102Z",
            updatedAt: "2026-08-04T00:11:40.930Z",
            lastValue: 5.4321,
            lastReferenceDate: "2026-08-03",
            variationPercent: 1.85,
          },
        },
        IndicatorDetail: {
          allOf: [
            { $ref: "#/components/schemas/IndicatorWithVariation" },
            {
              type: "object",
              properties: {
                observations: {
                  type: "array",
                  description: "Observation history for the last 90 days (same window used for external sync), ordered by referenceDate ascending.",
                  items: {
                    type: "object",
                    properties: {
                      referenceDate: { type: "string", format: "date" },
                      value: { type: "number" },
                    },
                  },
                },
              },
            },
          ],
          example: {
            id: "9168688f-ad26-4751-9321-856eb060b574",
            code: "usd_brl",
            name: "Dólar Americano (PTAX)",
            source: "bcb",
            type: "fx",
            description:
              "Cotação de fechamento do dólar americano frente ao real, calculada pelo Banco Central através da pesquisa PTAX.",
            isFavorite: false,
            createdAt: "2026-08-03T23:23:29.102Z",
            updatedAt: "2026-08-04T00:11:40.930Z",
            lastValue: 5.4321,
            lastReferenceDate: "2026-08-03",
            variationPercent: 1.85,
            observations: [
              { referenceDate: "2026-07-31", value: 5.42 },
              { referenceDate: "2026-08-01", value: 5.4321 },
            ],
          },
        },
        ErrorMessage: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
  },
  // Both src (dev, via tsx) and dist (production build) patterns are
  // included since swagger-jsdoc reads JSDoc comments straight from
  // whichever files actually exist at runtime, and that differs between
  // `npm run dev` and the compiled Docker image.
  apis: [
    "./src/routes/*.ts",
    "./src/index.ts",
    "./dist/routes/*.js",
    "./dist/index.js",
  ],
});
