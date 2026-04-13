import { useQuery } from '@tanstack/react-query'
import { fetchMoveDetail } from '@/lib/pokeapi'
import type { MoveDetail } from '@/types/moves'

const STALE_24H = 24 * 60 * 60 * 1000

export function useMoveDetail(moveId: number | string | undefined) {
  return useQuery<MoveDetail>({
    queryKey: ['move', moveId],
    queryFn: () => fetchMoveDetail(moveId!),
    enabled: moveId != null,
    staleTime: STALE_24H,
  })
}
