export interface AbilitySummary {
  id: number
  slug: string
  nameZhHant: string
  nameEn: string
  nameJa: string
  // Added after M2 dataset rebuild
  generationId?: number
  generationLabel?: string
}

export interface AbilityDetail {
  id: number
  effect: string
  flavorText: string
  generationLabel: string
  pokemonCount: number
}
