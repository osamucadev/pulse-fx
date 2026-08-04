import { Link } from 'react-router-dom'
import { useIndicators } from '../hooks/useIndicators'
import { formatLastValue } from '../utils/formatIndicator'

interface IndicatorSuggestionsProps {
  excludeCode?: string
}

export function IndicatorSuggestions({ excludeCode }: IndicatorSuggestionsProps) {
  const { data: indicators } = useIndicators()

  const suggestions = indicators?.filter((indicator) => indicator.code !== excludeCode) ?? []

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {suggestions.map((indicator) => (
        <Link
          key={indicator.id}
          to={`/indicators/${indicator.code}`}
          className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-left transition-colors hover:border-primary-light-alt hover:bg-primary-light"
        >
          <p className="text-xs font-medium text-gray-400">{indicator.name}</p>
          <p className="mt-1 text-sm font-semibold text-gray-700">
            {formatLastValue(indicator.type, indicator.lastValue)}
          </p>
        </Link>
      ))}
    </div>
  )
}
