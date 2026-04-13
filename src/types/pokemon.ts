export interface TypeEntry {
  slug: string
  nameZhHant: string
  nameEn: string
}

export interface VersionTag {
  key: string
  side: 'scarlet' | 'violet'
  label: string
  shortLabel: string
}

export interface PokemonSummary {
  id: number
  speciesId: number
  slug: string
  nameZhHant: string
  nameEn: string
  nameJa: string
  genusZhHant: string
  genusEn: string
  generationId: number
  generationLabel: string
  types: TypeEntry[]
  sprite: string
  // Runtime-enriched fields
  versionTags: VersionTag[]
  championAvailable: boolean
  // Added in M2 dataset rebuild
  isChampionsLegal: boolean
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
  bst: number
}

export interface AbilityRef {
  id: number | null
  nameZhHant: string
  nameEn: string
  isHidden: boolean
}

export interface StatEntry {
  slug: string
  label: string
  value: number
}

export interface DamageClassEntry {
  slug: string
  labelZhHant: string
  labelEn: string
}

export interface MoveRef {
  id: string
  moveId: number | string
  slug: string
  nameZhHant: string
  nameEn: string
  type: TypeEntry | null
  damageClass: DamageClassEntry | null
  power: number | null
  pp: number | null
  accuracy: number | null
  level: number
}

export interface MoveSection {
  key: string
  label: string
  items: MoveRef[]
}

export interface PokemonDetail {
  id: number
  height: number
  weight: number
  abilities: AbilityRef[]
  stats: StatEntry[]
  types: string[]
  flavorText: string
  genus: string
  eggGroups: string[]
  captureRate: number
  habitat: string | null
  legendary: boolean
  mythical: boolean
  evolutionSpeciesIds: number[]
  moveSections: MoveSection[]
}

export interface TypeEffectivenessEntry {
  slug: string
  multiplier: number
}

export interface HomeTransferMethod {
  fromGame: string
  labelZhHant: string
  notes: string
}

export interface HomeTransferRoute {
  speciesId: number
  slug: string
  nameZhHant: string
  methods: HomeTransferMethod[]
}

export interface HomeTransferData {
  lastUpdated: string
  routes: HomeTransferRoute[]
}
