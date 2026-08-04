import { useQuery } from '@tanstack/react-query'
import { fetchIndicatorDetail } from '../api/client'

export function useIndicatorDetail(code: string, lookback?: number) {
  return useQuery({
    queryKey: ['indicators', code, lookback],
    queryFn: () => fetchIndicatorDetail(code, lookback),
  })
}
