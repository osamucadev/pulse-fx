import type { Step } from 'react-joyride'

export interface TourStep extends Step {
  route: string
}

// Fixed indicator used to anchor the steps that live on the detail page,
// so the tour always has a real, predictable target to navigate to.
export const TOUR_INDICATOR_CODE = 'usd_brl'

export const tourSteps: TourStep[] = [
  {
    route: '/',
    target: '[data-tour="app-title"]',
    title: 'Bem-vindo ao Pulse FX',
    content:
      'O Pulse FX acompanha câmbio (USD/BRL) e indicadores macroeconômicos (Selic, Fed Funds Rate) a partir de fontes públicas. Este tour rápido mostra como usar o painel.',
    placement: 'bottom',
  },
  {
    route: '/',
    target: '[data-tour="dashboard-grid"]',
    title: 'Seus indicadores',
    content:
      'Cada card mostra o nome do indicador, o último valor conhecido, a data de referência e a variação percentual em relação a um período anterior.',
    placement: 'top',
  },
  {
    route: '/',
    target: '[data-tour="variation-icon"]',
    title: 'Variação',
    content:
      'A seta e a cor indicam a direção da variação: verde e para cima é alta, vermelho e para baixo é queda, cinza é estável ou sem dado suficiente pra comparar.',
    placement: 'right',
  },
  {
    route: '/',
    target: '[data-tour="favorite-star"]',
    title: 'Favoritos',
    content:
      'Clique na estrela pra marcar um indicador como favorito. Essa escolha é salva no backend, não só no seu navegador.',
    placement: 'left',
  },
  {
    route: '/',
    target: '[data-tour="view-details"]',
    title: 'Detalhes do indicador',
    content: 'Clique aqui pra abrir o histórico completo e o gráfico de evolução de um indicador.',
    placement: 'top',
  },
  {
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
  },
  {
    route: `/indicators/${TOUR_INDICATOR_CODE}`,
    target: '[data-tour="lookback-select"]',
    title: 'Intervalo de comparação',
    content:
      'Escolha contra qual período no passado a variação percentual é calculada. As opções mudam de acordo com o tipo do indicador.',
    placement: 'top',
  },
  {
    route: `/indicators/${TOUR_INDICATOR_CODE}`,
    target: '[data-tour="detail-refresh"]',
    title: 'Sincronizar manualmente',
    content:
      'Force uma busca nova na fonte externa a qualquer momento. Existe um intervalo mínimo entre sincronizações pra evitar chamadas descontroladas.',
    placement: 'bottom',
  },
  {
    route: '/',
    target: '[data-tour="app-footer"]',
    title: 'Rodapé',
    content:
      'Aqui você encontra o disclaimer educacional, a página "Sobre" com as decisões técnicas do projeto, e o botão pra reiniciar os dados sincronizados.',
    placement: 'top',
  },
]
