import { useQueryClient } from '@tanstack/react-query'
import { syncIndicator } from '../api/client'
import { useIndicators } from '../hooks/useIndicators'
import { CardSkeleton } from './CardSkeleton'
import { IndicatorCard } from './IndicatorCard'
import { SyncBanner } from './SyncBanner'

export function Dashboard() {
  const { data: indicators, isLoading, isError } = useIndicators()
  const queryClient = useQueryClient()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-danger">
        Não foi possível carregar os indicadores. Tente novamente mais tarde.
      </p>
    )
  }

  const hasMissingData = indicators?.some((indicator) => indicator.lastValue === null) ?? false

  async function handleSync() {
    if (!indicators) {
      return
    }

    const results = await Promise.all(
      indicators.map((indicator) => syncIndicator(indicator.code)),
    )

    await queryClient.invalidateQueries({ queryKey: ['indicators'] })

    if (results.some((result) => result.status === 'error')) {
      throw new Error('Algumas sincronizações falharam')
    }
  }

  return (
    <>
      <SyncBanner hasMissingData={hasMissingData} onSync={handleSync} />
      <div
        data-tour="dashboard-grid"
        className="animate-fade-in grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {indicators?.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
    </>
  )
}
