import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { IndicatorNotFoundError, syncIndicator, type IndicatorType } from '../api/client'
import { IndicatorChart } from '../components/IndicatorChart'
import { IndicatorDetailSkeleton } from '../components/IndicatorDetailSkeleton'
import { IndicatorSuggestions } from '../components/IndicatorSuggestions'
import { IndicatorTypeIcon } from '../components/IndicatorTypeIcon'
import { VariationBadge } from '../components/VariationBadge'
import { useIndicatorDetail } from '../hooks/useIndicatorDetail'
import { formatLastValue, formatReferenceDate } from '../utils/formatIndicator'

const FX_LOOKBACK_OPTIONS = [
  { value: 7, label: '7 dias úteis (padrão)' },
  { value: 15, label: '15 dias úteis' },
  { value: 30, label: '30 dias úteis' },
]

const MACRO_LOOKBACK_OPTIONS = [
  { value: 1, label: '1 mês (padrão)' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
]

function lookbackOptionsFor(type: IndicatorType) {
  return type === 'fx' ? FX_LOOKBACK_OPTIONS : MACRO_LOOKBACK_OPTIONS
}

function formatLookbackLabel(type: IndicatorType, value: number): string {
  if (type === 'fx') {
    return `${value} dias úteis`
  }
  return value === 1 ? '1 mês' : `${value} meses`
}

const backLink = (
  <Link
    to="/"
    viewTransition
    className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
  >
    <ArrowLeft size={16} />
    Voltar ao dashboard
  </Link>
)

// Keyed by `code` from the parent (see IndicatorDetailPage below) so that
// navigating between indicators (same route, different param) fully
// remounts this component instead of carrying over stale `lookback` state
// from the previous indicator, which may not be a valid preset for the
// new one's type.
function IndicatorDetailView({ code }: { code: string }) {
  const [lookback, setLookback] = useState<number | undefined>(undefined)
  const [isSyncing, setIsSyncing] = useState(false)
  const queryClient = useQueryClient()
  const { data: indicator, isLoading, error } = useIndicatorDetail(code, lookback)

  async function handleSync() {
    setIsSyncing(true)

    try {
      const result = await syncIndicator(code)

      if (result.status === 'success') {
        await queryClient.invalidateQueries({ queryKey: ['indicators'] })
        toast.success('Indicador atualizado')
      } else if (result.status === 'cooldown') {
        toast.info(`Aguarde ${result.minutesRemaining} min para sincronizar novamente`)
      } else {
        toast.error('Não foi possível sincronizar o indicador')
      }
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        {backLink}
        <div className="mt-4">
          <IndicatorDetailSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    if (error instanceof IndicatorNotFoundError) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Indicador não encontrado</h1>
            <p className="mt-2 text-sm text-gray-500">
              Não encontramos nenhum indicador com o código &quot;{code}&quot;.
            </p>
          </div>

          <Link
            to="/"
            viewTransition
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <ArrowLeft size={16} />
            Voltar ao dashboard
          </Link>

          <div className="w-full max-w-3xl">
            <p className="text-sm font-medium text-gray-500">
              Ou veja um dos indicadores disponíveis:
            </p>
            <div className="mt-3">
              <IndicatorSuggestions />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        {backLink}
        <p className="mt-4 text-center text-danger">
          Não foi possível carregar o indicador. Tente novamente mais tarde.
        </p>
      </div>
    )
  }

  if (!indicator) {
    return null
  }

  const lookbackOptions = lookbackOptionsFor(indicator.type)
  const selectedLookback = lookback ?? lookbackOptions[0].value

  return (
    <div>
      {backLink}

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-400">{indicator.code}</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-gray-900">
          <IndicatorTypeIcon type={indicator.type} size={20} />
          {indicator.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">{indicator.description}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <div className="flex items-end gap-3">
          <div>
            <p className="text-xs text-gray-400">Último valor</p>
            <p className="text-3xl font-semibold text-gray-900">
              {formatLastValue(indicator.type, indicator.lastValue)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            aria-label="Sincronizar indicador"
            className="mb-1 inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
        <div>
          <p className="text-xs text-gray-400">Data de referência</p>
          <p className="text-sm text-gray-700">
            {formatReferenceDate(indicator.lastReferenceDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">
            Variação ({formatLookbackLabel(indicator.type, selectedLookback)})
          </p>
          <div className="text-sm font-medium">
            <VariationBadge variationPercent={indicator.variationPercent} />
          </div>
        </div>
        <div>
          <label htmlFor="lookback" className="block text-xs text-gray-400">
            Comparar com
          </label>
          <select
            id="lookback"
            value={selectedLookback}
            onChange={(event) => setLookback(Number(event.target.value))}
            className="mt-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-300 focus:border-primary focus:outline-none"
          >
            {lookbackOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8">
        <IndicatorChart observations={indicator.observations} type={indicator.type} />
      </div>

      <p className="mt-4 max-w-2xl text-xs text-gray-400">
        O histórico exibido acompanha o intervalo de comparação selecionado (
        {formatLookbackLabel(indicator.type, selectedLookback)}), com uma margem de contexto
        antes do ponto de referência.
        {indicator.type === 'macro' &&
          ' Indicadores macroeconômicos não têm publicação diária: o valor exibido em cada data é o último dado conhecido divulgado pela fonte (BCB ou FRED), não uma interpolação.'}
      </p>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-gray-500">Outros indicadores</h2>
        <div className="mt-3">
          <IndicatorSuggestions excludeCode={indicator.code} />
        </div>
      </div>
    </div>
  )
}

export function IndicatorDetailPage() {
  const { code } = useParams<{ code: string }>()

  return <IndicatorDetailView key={code} code={code ?? ''} />
}
