import { useQuery } from '@tanstack/react-query'
import type { PokemonSummary, HomeTransferData } from '@/types/pokemon'
import type { MoveSummary } from '@/types/moves'
import type { AbilitySummary } from '@/types/abilities'
import { getVersionTags, isChampionAvailable } from '@/data/versionExclusives'

const BASE_URL = import.meta.env.BASE_URL as string

async function loadPokemonList(): Promise<PokemonSummary[]> {
  const res = await fetch(`${BASE_URL}data/pokedex-summary.json`)
  if (!res.ok) throw new Error('圖鑑資料載入失敗')
  const data: Omit<PokemonSummary, 'versionTags' | 'championAvailable'>[] = await res.json()
  return data.map((p) => ({
    ...p,
    versionTags: getVersionTags(p.speciesId || p.id),
    championAvailable: isChampionAvailable(p.speciesId || p.id),
  }))
}

async function loadAbilitiesList(): Promise<AbilitySummary[]> {
  const res = await fetch(`${BASE_URL}data/abilities-summary.json`)
  if (!res.ok) throw new Error('特性資料載入失敗')
  return res.json()
}

async function loadMovesList(): Promise<MoveSummary[]> {
  const res = await fetch(`${BASE_URL}data/moves-summary.json`)
  if (!res.ok) throw new Error('招式資料載入失敗')
  return res.json()
}

export function usePokemonList() {
  return useQuery<PokemonSummary[]>({
    queryKey: ['pokemonList'],
    queryFn: loadPokemonList,
    staleTime: Infinity,
  })
}

export function useAbilitiesList() {
  return useQuery<AbilitySummary[]>({
    queryKey: ['abilitiesList'],
    queryFn: loadAbilitiesList,
    staleTime: Infinity,
  })
}

export function useMovesList() {
  return useQuery<MoveSummary[]>({
    queryKey: ['movesList'],
    queryFn: loadMovesList,
    staleTime: Infinity,
  })
}

async function loadHomeTransferData(): Promise<HomeTransferData> {
  const res = await fetch(`${BASE_URL}data/home-transfer-routes.json`)
  if (!res.ok) throw new Error('HOME轉移資料載入失敗')
  return res.json()
}

export function useHomeTransferData() {
  return useQuery<HomeTransferData>({
    queryKey: ['homeTransferData'],
    queryFn: loadHomeTransferData,
    staleTime: Infinity,
  })
}
