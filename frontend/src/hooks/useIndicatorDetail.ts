import { useQuery } from '@tanstack/react-query'
import { fetchIndicatorDetail } from '../api/client'

export function useIndicatorDetail(code: string) {
  return useQuery({
    queryKey: ['indicators', code],
    queryFn: () => fetchIndicatorDetail(code),
  })
}
