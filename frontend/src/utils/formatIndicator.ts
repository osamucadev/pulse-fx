import type { IndicatorType } from '../api/client'

export function formatIndicatorValue(type: IndicatorType, value: number): string {
  if (type === 'fx') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value)
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function formatLastValue(type: IndicatorType, lastValue: number | null): string {
  if (lastValue === null) {
    return 'Sem dados'
  }

  return formatIndicatorValue(type, lastValue)
}

export function formatReferenceDate(referenceDate: string | null): string {
  if (!referenceDate) {
    return 'Sem dados'
  }

  return new Date(referenceDate).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  })
}

export function formatVariation(variationPercent: number | null): string {
  if (variationPercent === null) {
    return 'Sem dados'
  }

  const sign = variationPercent > 0 ? '+' : ''
  return `${sign}${variationPercent.toFixed(2)}%`
}
