import { useQuery } from '@tanstack/react-query'
import { fetchAbilityDetail } from '@/lib/pokeapi'
import type { AbilityDetail } from '@/types/abilities'

const STALE_24H = 24 * 60 * 60 * 1000

export function useAbilityDetail(abilityId: number | string | undefined) {
  return useQuery<AbilityDetail>({
    queryKey: ['ability', abilityId],
    queryFn: () => fetchAbilityDetail(abilityId!),
    enabled: abilityId != null,
    staleTime: STALE_24H,
  })
}
