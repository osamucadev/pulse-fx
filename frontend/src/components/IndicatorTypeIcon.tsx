import { DollarSign, Percent } from 'lucide-react'
import type { IndicatorType } from '../api/client'

interface IndicatorTypeIconProps {
  type: IndicatorType
  size?: number
}

export function IndicatorTypeIcon({ type, size = 14 }: IndicatorTypeIconProps) {
  const Icon = type === 'fx' ? DollarSign : Percent

  return <Icon size={size} className="shrink-0 text-gray-400" aria-hidden="true" />
}
