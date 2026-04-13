import { useQuery } from '@tanstack/react-query'
import { fetchPokemonDetail } from '@/lib/pokeapi'
import type { PokemonDetail } from '@/types/pokemon'
import type { AbilitySummary } from '@/types/abilities'
import type { MoveSummary } from '@/types/moves'
import { useAbilitiesList, useMovesList } from './usePokemonList'

const STALE_24H = 24 * 60 * 60 * 1000

export function usePokemonDetail(pokemonId: number | string | undefined) {
  const { data: abilitiesList, isSuccess: abilitiesReady } = useAbilitiesList()
  const { data: movesList, isSuccess: movesReady } = useMovesList()

  return useQuery<PokemonDetail>({
    queryKey: ['pokemon', pokemonId],
    queryFn: () => {
      const abilityMap = new Map<number, AbilitySummary>(
        (abilitiesList ?? []).map((a) => [a.id, a]),
      )
      const moveMap = new Map<string, MoveSummary>(
        (movesList ?? []).map((m) => [m.slug, m]),
      )
      return fetchPokemonDetail(pokemonId!, abilityMap, moveMap)
    },
    enabled: pokemonId != null && abilitiesReady && movesReady,
    staleTime: STALE_24H,
  })
}
