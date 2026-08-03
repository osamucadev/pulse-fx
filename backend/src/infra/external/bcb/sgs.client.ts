const SGS_SELIC_TARGET_SERIES_CODE = 432;

export interface SelicRate {
  referenceDate: Date;
  rate: number;
}

interface SgsQuoteDto {
  data: string;
  valor: string;
}

export class SgsClientError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SgsClientError";
  }
}

function toSgsDateParam(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function buildSeriesUrl(
  seriesCode: number,
  startDate: Date,
  endDate: Date,
): string {
  const params = new URLSearchParams({
    formato: "json",
    dataInicial: toSgsDateParam(startDate),
    dataFinal: toSgsDateParam(endDate),
  });

  return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados?${params.toString()}`;
}

function toReferenceDate(data: string): Date {
  const [day, month, year] = data.split("/");
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

function isSgsResponse(body: unknown): body is SgsQuoteDto[] {
  return (
    Array.isArray(body) &&
    body.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SgsQuoteDto).data === "string" &&
        typeof (item as SgsQuoteDto).valor === "string",
    )
  );
}

export async function fetchSelicRates(
  startDate: Date,
  endDate: Date,
): Promise<SelicRate[]> {
  const url = buildSeriesUrl(SGS_SELIC_TARGET_SERIES_CODE, startDate, endDate);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new SgsClientError(`Failed to reach BCB SGS API at ${url}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new SgsClientError(
      `BCB SGS API returned ${response.status} ${response.statusText} for ${url}: ${body}`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new SgsClientError(
      `BCB SGS API returned a non-JSON response for ${url}`,
      { cause: error },
    );
  }

  if (!isSgsResponse(body)) {
    throw new SgsClientError(
      `BCB SGS API returned an unexpected response shape for ${url}: ${JSON.stringify(body)}`,
    );
  }

  return body.map((quote) => ({
    referenceDate: toReferenceDate(quote.data),
    rate: Number(quote.valor),
  }));
}
