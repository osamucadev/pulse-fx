import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toggleFavorite, type Indicator } from '../api/client'
import { formatLastValue, formatReferenceDate } from '../utils/formatIndicator'
import { VariationBadge } from './VariationBadge'

interface IndicatorCardProps {
  indicator: Indicator
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
        {formatLastValue(indicator.type, indicator.lastValue)}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {formatReferenceDate(indicator.lastReferenceDate)}
      </p>
      <div className="mt-2 text-sm font-medium">
        <VariationBadge variationPercent={indicator.variationPercent} />
      </div>
      <Link
        to={`/indicators/${indicator.code}`}
        className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary-hover"
      >
        Ver detalhes
      </Link>
    </div>
  )
}
