import type { Step } from 'react-joyride'
import type { Indicator } from '../api/client'

export interface TourStep extends Step {
  id: string
  route: string
}

// Fixed indicators used to anchor the steps that live on the detail page
// or need a specific "still missing data" card, so the tour always has a
// real, predictable target to navigate to.
export const TOUR_INDICATOR_CODE = 'usd_brl'
export const SECOND_TOUR_INDICATOR_CODE = 'selic'

const welcomeStep: TourStep = {
  id: 'welcome',
  route: '/',
  target: '[data-tour="app-title"]',
  title: 'Bem-vindo ao Pulse FX',
  content:
    'O Pulse FX acompanha câmbio (USD/BRL) e indicadores macroeconômicos (Selic, Fed Funds Rate) a partir de fontes públicas. Este tour rápido mostra como usar o painel.',
  placement: 'bottom',
}

const dashboardGridStep: TourStep = {
  id: 'dashboard-grid',
  route: '/',
  target: '[data-tour="dashboard-grid"]',
  title: 'Seus indicadores',
  content:
    'Cada card mostra o nome do indicador, o último valor conhecido, a data de referência e a variação percentual em relação a um período anterior.',
  placement: 'top',
}

const syncBannerStep: TourStep = {
  id: 'sync-banner',
  route: '/',
  target: '[data-tour="sync-banner"]',
  title: 'Ainda sem dados?',
  content:
    'Indicadores que nunca foram sincronizados com as fontes externas (BCB, FRED) aparecem como "Sem dados" nos cards. O botão "Sincronizar agora" deste aviso busca os valores reais de uma vez para todos eles.',
  placement: 'bottom',
}

const variationIconStep: TourStep = {
  id: 'variation-icon',
  route: '/',
  target: '[data-tour="variation-icon"]',
  title: 'Variação',
  content:
    'A seta e a cor indicam a direção da variação: verde e para cima é alta, vermelho e para baixo é queda, cinza é estável ou sem dado suficiente pra comparar.',
  placement: 'right',
}

const favoriteStarStep: TourStep = {
  id: 'favorite-star',
  route: '/',
  target: '[data-tour="favorite-star"]',
  title: 'Favoritos',
  content:
    'Clique na estrela pra marcar um indicador como favorito. Essa escolha é salva no backend, não só no seu navegador.',
  placement: 'left',
}

const viewDetailsStep: TourStep = {
  id: 'view-details',
  route: '/',
  target: '[data-tour="view-details"]',
  title: 'Detalhes do indicador',
  content: 'Clique aqui pra abrir o histórico completo e o gráfico de evolução de um indicador.',
  placement: 'top',
}

const chartStep: TourStep = {
  id: 'indicator-chart',
  route: `/indicators/${TOUR_INDICATOR_CODE}`,
  target: '[data-tour="indicator-chart"]',
  title: 'Histórico',
  content:
    'O gráfico mostra a evolução do indicador ao longo do tempo, com uma janela ajustada automaticamente pro intervalo de comparação escolhido.',
  placement: 'top',
  // This is the first step after a route change plus an async fetch
  // (the indicator detail query), so it needs more time than the
  // library's 1s default before it gives up waiting for the target.
  targetWaitTimeout: 8000,
}

const lookbackStep: TourStep = {
  id: 'lookback-select',
  route: `/indicators/${TOUR_INDICATOR_CODE}`,
  target: '[data-tour="lookback-select"]',
  title: 'Intervalo de comparação',
  content:
    'Escolha contra qual período no passado a variação percentual é calculada. As opções mudam de acordo com o tipo do indicador.',
  placement: 'top',
}

const detailRefreshStep: TourStep = {
  id: 'detail-refresh',
  route: `/indicators/${TOUR_INDICATOR_CODE}`,
  target: '[data-tour="detail-refresh"]',
  title: 'Sincronizar manualmente',
  content:
    'Force uma busca nova na fonte externa a qualquer momento. Existe um intervalo mínimo entre sincronizações pra evitar chamadas descontroladas.',
  placement: 'bottom',
}

const footerDisclaimerStep: TourStep = {
  id: 'footer-disclaimer',
  route: '/',
  target: '[data-tour="footer-disclaimer"]',
  title: 'Aviso legal',
  content:
    'Este projeto tem finalidade educacional e de demonstração técnica. As informações exibidas não constituem recomendação de investimento.',
  placement: 'top',
}

const footerActionsStep: TourStep = {
  id: 'footer-actions',
  route: '/',
  target: '[data-tour="footer-actions"]',
  title: 'Mais opções',
  content:
    '"Sobre" leva às decisões técnicas do projeto. "Revisitar tour" reabre este guia a qualquer momento. "Reiniciar teste" apaga os dados sincronizados de todos os indicadores, pra recomeçar a demonstração do zero.',
  placement: 'top',
}

const secondIndicatorTipStep: TourStep = {
  id: 'second-indicator-tip',
  route: '/',
  target: '[data-tour="second-indicator-tip"]',
  title: 'Um indicador de cada vez',
  content:
    'A sincronização acontece indicador por indicador, não em massa: você acabou de ver como funciona no Dólar. Pra atualizar este ou qualquer outro, é o mesmo processo: entre no detalhe e clique em "Sincronizar" quando quiser.',
  placement: 'top',
}

/**
 * Builds the tour's step list from the current indicator data, dropping
 * steps that don't apply right now: the sync banner step only makes
 * sense if at least one indicator has no data yet, and the closing
 * "second indicator" tip only makes sense if SECOND_TOUR_INDICATOR_CODE
 * specifically still has no data (it's the one the tour points at).
 */
export function buildTourSteps(indicators: Indicator[]): TourStep[] {
  const hasMissingData = indicators.some((indicator) => indicator.lastValue === null)
  const secondIndicatorHasMissingData = indicators.some(
    (indicator) => indicator.code === SECOND_TOUR_INDICATOR_CODE && indicator.lastValue === null,
  )

  return [
    welcomeStep,
    dashboardGridStep,
    ...(hasMissingData ? [syncBannerStep] : []),
    variationIconStep,
    favoriteStarStep,
    viewDetailsStep,
    chartStep,
    lookbackStep,
    detailRefreshStep,
    footerDisclaimerStep,
    footerActionsStep,
    ...(secondIndicatorHasMissingData ? [secondIndicatorTipStep] : []),
  ]
}
