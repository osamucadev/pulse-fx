import { prisma } from "../src/infra/prisma/client.js";

const indicators = [
  {
    code: "usd_brl",
    name: "Dólar Americano (PTAX)",
    source: "bcb",
    type: "fx",
    description:
      "Cotação de fechamento do dólar americano frente ao real, calculada pelo Banco Central através da pesquisa PTAX. É o indicador mais direto para quem quer acompanhar o câmbio no dia a dia, já que a fonte oferece o dado de fechamento pronto para uso, sem necessidade de cálculo adicional.",
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
  },
  {
    code: "selic",
    name: "Taxa Selic (Meta)",
    source: "bcb",
    type: "macro",
    description:
      "Meta da taxa Selic definida periodicamente pelo Copom (Comitê de Política Monetária do Banco Central), referência básica de juros da economia brasileira. Foi escolhida entre os indicadores macroeconômicos nacionais por ser uma série numérica direta, sem a complexidade de diferenciar mês de referência e mês de divulgação.",
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
  },
  {
    code: "fed_funds_rate",
    name: "Fed Funds Rate",
    source: "fred",
    type: "macro",
    description:
      "Taxa básica de juros dos Estados Unidos, definida pelo Federal Reserve (Fed), cumprindo o mesmo papel que a Selic desempenha na economia brasileira. Acompanhar essa taxa ao lado da Selic permite comparar a política monetária dos dois países e entender parte da pressão sobre o câmbio USD/BRL.",
    syncTtlMinutes: 60,
    refreshCooldownMinutes: 30,
  },
];

async function main() {
  for (const indicator of indicators) {
    await prisma.indicator.upsert({
      where: { code: indicator.code },
      update: indicator,
      create: indicator,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
