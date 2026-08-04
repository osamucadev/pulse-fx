import { useQuery } from '@tanstack/react-query'
import { fetchIndicators } from '../api/client'

export function useIndicators() {
  return useQuery({
    queryKey: ['indicators'],
    queryFn: fetchIndicators,
  })
}
