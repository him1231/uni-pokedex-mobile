import { useQuery } from '@tanstack/react-query'
import { fetchTypeEffectiveness } from '@/lib/pokeapi'
import type { TypeEffectivenessEntry } from '@/types/pokemon'

export function useTypeEffectiveness(typeSlugs: string[]) {
  const key = [...typeSlugs].sort().join(',')
  return useQuery<TypeEffectivenessEntry[]>({
    queryKey: ['typeEffectiveness', key],
    queryFn: () => fetchTypeEffectiveness(typeSlugs),
    enabled: typeSlugs.length > 0,
    staleTime: Infinity,
  })
}
