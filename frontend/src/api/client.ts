export type IndicatorType = 'fx' | 'macro'

export interface Indicator {
  id: string
  code: string
  name: string
  source: string
  type: IndicatorType
  description: string
  isFavorite: boolean
  lastValue: number | null
  lastReferenceDate: string | null
  variationPercent: number | null
  createdAt: string
  updatedAt: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchIndicators(): Promise<Indicator[]> {
  const response = await fetch(`${API_BASE_URL}/indicators`)

  if (!response.ok) {
    throw new Error(`Failed to fetch indicators: ${response.status}`)
  }

  return response.json()
}

export type SyncResult =
  | { status: 'success' }
  | { status: 'cooldown'; minutesRemaining: number }
  | { status: 'error'; message: string }

export async function syncIndicator(code: string): Promise<SyncResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/indicators/${code}/refresh`, {
      method: 'POST',
    })

    if (response.status === 429) {
      const body: { minutesRemaining: number } = await response.json()
      return { status: 'cooldown', minutesRemaining: body.minutesRemaining }
    }

    if (!response.ok) {
      return {
        status: 'error',
        message: `Failed to sync indicator "${code}": ${response.status}`,
      }
    }

    return { status: 'success' }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : `Failed to sync indicator "${code}"`,
    }
  }
}
