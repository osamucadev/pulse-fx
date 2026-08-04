import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { formatVariation } from '../utils/formatIndicator'

interface VariationBadgeProps {
  variationPercent: number | null
}

export function VariationBadge({ variationPercent }: VariationBadgeProps) {
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
