import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Minus, Star, TrendingDown, TrendingUp } from 'lucide-react'
import { toggleFavorite, type Indicator } from '../api/client'

interface IndicatorCardProps {
  indicator: Indicator
}

function formatLastValue(indicator: Indicator): string {
  if (indicator.lastValue === null) {
    return 'Sem dados'
  }

  if (indicator.type === 'fx') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(indicator.lastValue)
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(indicator.lastValue / 100)
}

function formatReferenceDate(lastReferenceDate: string | null): string {
  if (!lastReferenceDate) {
    return 'Sem dados'
  }

  return new Date(lastReferenceDate).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  })
}

function formatVariation(variationPercent: number | null): string {
  if (variationPercent === null) {
    return 'Sem dados'
  }

  const sign = variationPercent > 0 ? '+' : ''
  return `${sign}${variationPercent.toFixed(2)}%`
}

function VariationBadge({ variationPercent }: { variationPercent: number | null }) {
  if (variationPercent === null || variationPercent === 0) {
    return (
      <span className="flex items-center gap-1 text-gray-400">
        <Minus size={16} />
        {formatVariation(variationPercent)}
      </span>
    )
  }

  if (variationPercent > 0) {
    return (
      <span className="flex items-center gap-1 text-success">
        <TrendingUp size={16} />
        {formatVariation(variationPercent)}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-danger">
      <TrendingDown size={16} />
      {formatVariation(variationPercent)}
    </span>
  )
}

export function IndicatorCard({ indicator }: IndicatorCardProps) {
  const queryClient = useQueryClient()

  const favoriteMutation = useMutation({
    mutationFn: (nextIsFavorite: boolean) => toggleFavorite(indicator.code, nextIsFavorite),
    onMutate: async (nextIsFavorite) => {
      await queryClient.cancelQueries({ queryKey: ['indicators'] })

      const previousIndicators = queryClient.getQueryData<Indicator[]>(['indicators'])

      queryClient.setQueryData<Indicator[]>(['indicators'], (old) =>
        old?.map((item) =>
          item.code === indicator.code ? { ...item, isFavorite: nextIsFavorite } : item,
        ),
      )

      return { previousIndicators }
    },
    onError: (error, _nextIsFavorite, context) => {
      console.error(`Failed to update favorite for indicator "${indicator.code}"`, error)

      if (context?.previousIndicators) {
        queryClient.setQueryData(['indicators'], context.previousIndicators)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] })
    },
  })

  return (
    <div
      className={`relative rounded-lg border p-4 shadow-sm ${
        indicator.isFavorite ? 'border-primary' : 'border-gray-200'
      }`}
    >
      <button
        type="button"
        onClick={() => favoriteMutation.mutate(!indicator.isFavorite)}
        disabled={favoriteMutation.isPending}
        aria-label={indicator.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        className="absolute right-3 top-3 text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Star size={20} fill={indicator.isFavorite ? 'currentColor' : 'none'} />
      </button>
      <h2 className="pr-8 text-sm font-medium text-gray-500">{indicator.name}</h2>
      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {formatLastValue(indicator)}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {formatReferenceDate(indicator.lastReferenceDate)}
      </p>
      <div className="mt-2 text-sm font-medium">
        <VariationBadge variationPercent={indicator.variationPercent} />
      </div>
    </div>
  )
}
