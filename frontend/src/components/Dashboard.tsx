import { useIndicators } from '../hooks/useIndicators'
import { IndicatorCard } from './IndicatorCard'

export function Dashboard() {
  const { data: indicators, isLoading, isError } = useIndicators()

  if (isLoading) {
    return <p className="p-8 text-center text-gray-500">Carregando indicadores...</p>
  }

  if (isError) {
    return (
      <p className="p-8 text-center text-danger">
        Não foi possível carregar os indicadores. Tente novamente mais tarde.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-3">
      {indicators?.map((indicator) => (
        <IndicatorCard key={indicator.id} indicator={indicator} />
      ))}
    </div>
  )
}
