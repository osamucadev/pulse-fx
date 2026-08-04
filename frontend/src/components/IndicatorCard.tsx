import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { toggleFavorite, type Indicator } from '../api/client'
import { TOUR_INDICATOR_CODE } from '../tour/steps'
import { formatLastValue, formatReferenceDate } from '../utils/formatIndicator'
import { IndicatorTypeIcon } from './IndicatorTypeIcon'
import { VariationBadge } from './VariationBadge'

interface IndicatorCardProps {
  indicator: Indicator
}

export function IndicatorCard({ indicator }: IndicatorCardProps) {
  const queryClient = useQueryClient()
  // The guided tour needs a single, predictable card to point at; the
  // rest of the cards don't get these attributes.
  const isTourCard = indicator.code === TOUR_INDICATOR_CODE

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
    onSuccess: (_data, nextIsFavorite) => {
      toast.success(
        nextIsFavorite
          ? `${indicator.name} adicionado aos favoritos`
          : `${indicator.name} removido dos favoritos`,
      )
    },
    onError: (error, _nextIsFavorite, context) => {
      console.error(`Failed to update favorite for indicator "${indicator.code}"`, error)
      toast.error(`Não foi possível atualizar o favorito de ${indicator.name}`)

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
      className={`relative rounded-lg border p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md ${
        indicator.isFavorite ? 'border-primary' : 'border-gray-200'
      }`}
    >
      <button
        type="button"
        data-tour={isTourCard ? 'favorite-star' : undefined}
        onClick={() => favoriteMutation.mutate(!indicator.isFavorite)}
        disabled={favoriteMutation.isPending}
        aria-label={indicator.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        className="absolute right-3 top-3 text-primary transition-transform duration-150 ease-in-out hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Star size={20} fill={indicator.isFavorite ? 'currentColor' : 'none'} />
      </button>
      <h2 className="flex items-center gap-1.5 pr-8 text-sm font-medium text-gray-500">
        <IndicatorTypeIcon type={indicator.type} />
        {indicator.name}
      </h2>
      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {formatLastValue(indicator.type, indicator.lastValue)}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        <span className="font-medium">Ref.:</span> {formatReferenceDate(indicator.lastReferenceDate)}
      </p>
      <div data-tour={isTourCard ? 'variation-icon' : undefined} className="mt-2 text-sm font-medium">
        <VariationBadge variationPercent={indicator.variationPercent} />
      </div>
      <Link
        to={`/indicators/${indicator.code}`}
        viewTransition
        data-tour={isTourCard ? 'view-details' : undefined}
        className="mt-3 inline-block text-sm font-medium text-primary transition-colors hover:text-primary-hover"
      >
        Ver detalhes
      </Link>
    </div>
  )
}
