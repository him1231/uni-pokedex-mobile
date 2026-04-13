export interface MoveSummary {
  id: number
  slug: string
  nameZhHant: string
  nameEn: string
  nameJa: string
  generationId: number
  generationLabel: string
  type: {
    slug: string
    nameZhHant: string
    nameEn: string
  }
  power: number | null
  accuracy: number | null
  pp: number | null
  damageClass: {
    slug: string
    labelZhHant: string
    labelEn: string
  }
}

export interface MoveDetail {
  id: number
  effect: string
  generationLabel?: string
  target: string
  ailment: string
  minHits: number | null
  maxHits: number | null
  drain: number | null
  healing: number | null
  critRate: number | null
  flinchChance: number | null
  statChance: number | null
  damageClassLabel: string
}
