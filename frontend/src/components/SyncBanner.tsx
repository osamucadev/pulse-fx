import { useState } from 'react'

interface SyncBannerProps {
  hasMissingData: boolean
  onSync: () => Promise<void>
}

export function SyncBanner({ hasMissingData, onSync }: SyncBannerProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSync() {
    setIsSyncing(true)
    setError(null)

    try {
      await onSync()
    } catch {
      setError('Não foi possível sincronizar agora. Tente novamente.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div
      aria-hidden={!hasMissingData}
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        hasMissingData ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="flex flex-col gap-3 border-b border-primary-light-alt bg-primary-light px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Alguns indicadores ainda não foram sincronizados com as fontes de dados. Isso é
          normal na primeira execução do projeto.
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-danger">{error}</span>}
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>
        </div>
      </div>
    </div>
  )
}
