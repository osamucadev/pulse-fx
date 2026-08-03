const PTAX_PERIOD_URL =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)";

export interface UsdBrlRate {
  referenceDate: Date;
  buyRate: number;
  sellRate: number;
}

interface PtaxQuoteDto {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
}

interface PtaxPeriodResponseDto {
  value: PtaxQuoteDto[];
}

export class PtaxClientError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PtaxClientError";
  }
}

function toPtaxDateParam(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${month}-${day}-${year}`;
}

function buildPeriodUrl(startDate: Date, endDate: Date): string {
  const params = new URLSearchParams({
    "@dataInicial": `'${toPtaxDateParam(startDate)}'`,
    "@dataFinalCotacao": `'${toPtaxDateParam(endDate)}'`,
    $format: "json",
  });

  return `${PTAX_PERIOD_URL}?${params.toString()}`;
}

function toReferenceDate(dataHoraCotacao: string): Date {
  const [datePart] = dataHoraCotacao.split(" ");
  return new Date(`${datePart}T00:00:00.000Z`);
}

function isPtaxPeriodResponse(body: unknown): body is PtaxPeriodResponseDto {
  return (
    typeof body === "object" &&
    body !== null &&
    Array.isArray((body as PtaxPeriodResponseDto).value)
  );
}

export async function fetchUsdBrlRates(
  startDate: Date,
  endDate: Date,
): Promise<UsdBrlRate[]> {
  const url = buildPeriodUrl(startDate, endDate);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new PtaxClientError(
      `Failed to reach BCB PTAX API at ${url}`,
      { cause: error },
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new PtaxClientError(
      `BCB PTAX API returned ${response.status} ${response.statusText} for ${url}: ${body}`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new PtaxClientError(
      `BCB PTAX API returned a non-JSON response for ${url}`,
      { cause: error },
    );
  }

  if (!isPtaxPeriodResponse(body)) {
    throw new PtaxClientError(
      `BCB PTAX API returned an unexpected response shape for ${url}: ${JSON.stringify(body)}`,
    );
  }

  return body.value.map((quote) => ({
    referenceDate: toReferenceDate(quote.dataHoraCotacao),
    buyRate: quote.cotacaoCompra,
    sellRate: quote.cotacaoVenda,
  }));
}
