import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { IndicatorNotFoundError } from '../api/client'
import { IndicatorChart } from '../components/IndicatorChart'
import { IndicatorSuggestions } from '../components/IndicatorSuggestions'
import { VariationBadge } from '../components/VariationBadge'
import { useIndicatorDetail } from '../hooks/useIndicatorDetail'
import { formatLastValue, formatReferenceDate } from '../utils/formatIndicator'

export function IndicatorDetailPage() {
  const { code } = useParams<{ code: string }>()
  const { data: indicator, isLoading, error } = useIndicatorDetail(code ?? '')

  const backLink = (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
    >
      <ArrowLeft size={16} />
      Voltar ao dashboard
    </Link>
  )

  if (isLoading) {
    return (
      <div className="p-8">
        {backLink}
        <p className="mt-4 text-center text-gray-500">Carregando indicador...</p>
      </div>
    )
  }

  if (error) {
    if (error instanceof IndicatorNotFoundError) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-8 text-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Indicador não encontrado</h1>
            <p className="mt-2 text-sm text-gray-500">
              Não encontramos nenhum indicador com o código &quot;{code}&quot;.
            </p>
          </div>

          <Link
            to="/"
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
      <div className="p-8">
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

  return (
    <div className="p-8">
      {backLink}

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-400">{indicator.code}</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">{indicator.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">{indicator.description}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs text-gray-400">Último valor</p>
          <p className="text-3xl font-semibold text-gray-900">
            {formatLastValue(indicator.type, indicator.lastValue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Data de referência</p>
          <p className="text-sm text-gray-700">
            {formatReferenceDate(indicator.lastReferenceDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Variação</p>
          <div className="text-sm font-medium">
            <VariationBadge variationPercent={indicator.variationPercent} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <IndicatorChart observations={indicator.observations} type={indicator.type} />
      </div>

      <p className="mt-4 max-w-2xl text-xs text-gray-400">
        O histórico exibido cobre os últimos 90 dias corridos.
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
