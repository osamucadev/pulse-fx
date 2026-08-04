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
