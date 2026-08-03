const FRED_OBSERVATIONS_URL =
  "https://api.stlouisfed.org/fred/series/observations";
const FEDFUNDS_SERIES_ID = "FEDFUNDS";
const MISSING_VALUE_MARKER = ".";

export interface FedFundsRate {
  referenceDate: Date;
  rate: number;
}

interface FredObservationDto {
  date: string;
  value: string;
}

interface FredObservationsResponseDto {
  observations: FredObservationDto[];
}

export class FredClientError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "FredClientError";
  }
}

function getApiKey(): string {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new FredClientError(
      "Missing required environment variable FRED_API_KEY",
    );
  }
  return apiKey;
}

function toFredDateParam(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildObservationsUrl(
  apiKey: string,
  startDate: Date,
  endDate: Date,
): string {
  const params = new URLSearchParams({
    series_id: FEDFUNDS_SERIES_ID,
    api_key: apiKey,
    file_type: "json",
    observation_start: toFredDateParam(startDate),
    observation_end: toFredDateParam(endDate),
  });

  return `${FRED_OBSERVATIONS_URL}?${params.toString()}`;
}

function redactApiKey(url: string): string {
  const redacted = new URL(url);
  redacted.searchParams.set("api_key", "REDACTED");
  return redacted.toString();
}

function toReferenceDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function isFredObservationsResponse(
  body: unknown,
): body is FredObservationsResponseDto {
  return (
    typeof body === "object" &&
    body !== null &&
    Array.isArray((body as FredObservationsResponseDto).observations)
  );
}

export async function fetchFedFundsRate(
  startDate: Date,
  endDate: Date,
): Promise<FedFundsRate[]> {
  const apiKey = getApiKey();
  const url = buildObservationsUrl(apiKey, startDate, endDate);
  const safeUrl = redactApiKey(url);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new FredClientError(`Failed to reach FRED API at ${safeUrl}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new FredClientError(
      `FRED API returned ${response.status} ${response.statusText} for ${safeUrl}: ${body}`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new FredClientError(
      `FRED API returned a non-JSON response for ${safeUrl}`,
      { cause: error },
    );
  }

  if (!isFredObservationsResponse(body)) {
    throw new FredClientError(
      `FRED API returned an unexpected response shape for ${safeUrl}: ${JSON.stringify(body)}`,
    );
  }

  return body.observations
    .filter((observation) => observation.value !== MISSING_VALUE_MARKER)
    .map((observation) => ({
      referenceDate: toReferenceDate(observation.date),
      rate: Number(observation.value),
    }));
}
