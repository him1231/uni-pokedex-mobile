import type { PokemonDetail, AbilityRef, StatEntry, MoveSection, MoveRef, TypeEffectivenessEntry } from '@/types/pokemon'
import type { MoveDetail } from '@/types/moves'
import type { AbilityDetail } from '@/types/abilities'
import type { AbilitySummary } from '@/types/abilities'
import type { MoveSummary } from '@/types/moves'

const API_BASE = 'https://pokeapi.co/api/v2'

interface LocalizedEntry {
  language?: { name: string }
  flavor_text?: string
  short_effect?: string
  genus?: string
}

const pickLocalizedText = (entries: LocalizedEntry[] = [], lang: string, fallbackLang = 'en'): LocalizedEntry | null => {
  const primary = entries.find((entry) => entry.language?.name === lang)
  if (primary) return primary
  return entries.find((entry) => entry.language?.name === fallbackLang) ?? null
}

const cleanupFlavorText = (text = '') =>
  text.replace(/\f|\n|\r/g, ' ').replace(/\s+/g, ' ').trim()

const statLabels: Record<string, string> = {
  hp: 'HP',
  attack: '攻擊',
  defense: '防禦',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
}

const damageClassLabels: Record<string, string> = {
  status: '變化',
  physical: '物理',
  special: '特殊',
}

const moveSectionMeta: Record<string, { label: string }> = {
  levelUp: { label: '升級招式' },
  egg: { label: '蛋招式' },
  machine: { label: '招式機' },
  tutor: { label: '教學招式' },
  other: { label: '其他來源' },
}

const moveMethodToSection: Record<string, string> = {
  'level-up': 'levelUp',
  egg: 'egg',
  machine: 'machine',
  tutor: 'tutor',
}

function formatGenerationSlug(slug = '') {
  return slug.replace('generation-', 'Generation ').replace(/-/g, ' ')
}

export const getAbilityIdFromUrl = (url = '') => {
  const match = url.match(/\/ability\/(\d+)\//)
  return match ? Number(match[1]) : null
}

const getResourceIdFromUrl = (url = '') => {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectEvolutionSpeciesIds = (chain: any): number[] => {
  const ids: number[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any) => {
    if (!node) return
    const speciesId = getResourceIdFromUrl(node.species?.url)
    if (speciesId) ids.push(speciesId)
    ;(node.evolves_to ?? []).forEach(walk)
  }
  walk(chain)
  return [...new Set(ids)]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildMoveSections = (moves: any[] = [], moveMap: Map<string, MoveSummary> = new Map()): MoveSection[] => {
  const sections: Record<string, MoveRef[]> = {
    levelUp: [],
    egg: [],
    machine: [],
    tutor: [],
    other: [],
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moves.forEach((entry: any) => {
    const versionDetails = (entry.version_group_details ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (detail: any) => detail.version_group?.name === 'scarlet-violet',
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    versionDetails.forEach((detail: any) => {
      const moveMeta = moveMap.get(entry.move?.name)
      const sectionKey = moveMethodToSection[detail.move_learn_method?.name] ?? 'other'
      const moveId = moveMeta?.id ?? getResourceIdFromUrl(entry.move?.url) ?? entry.move?.name
      sections[sectionKey].push({
        id: `${moveId}-${sectionKey}-${detail.level_learned_at}`,
        moveId,
        slug: entry.move?.name ?? '',
        nameZhHant: moveMeta?.nameZhHant ?? entry.move?.name ?? '',
        nameEn: moveMeta?.nameEn ?? entry.move?.name ?? '',
        type: moveMeta?.type ?? null,
        damageClass: moveMeta?.damageClass ?? null,
        power: moveMeta?.power ?? null,
        pp: moveMeta?.pp ?? null,
        accuracy: moveMeta?.accuracy ?? null,
        level: detail.level_learned_at ?? 0,
      })
    })
  })

  const dedupe = (items: MoveRef[]) => {
    const seen = new Set<string>()
    return items.filter((item) => {
      const key = `${item.moveId}-${item.level}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const order = ['levelUp', 'egg', 'machine', 'tutor', 'other']
  return order
    .map((key) => {
      const items = dedupe(sections[key]).sort((a, b) => {
        if (key === 'levelUp' && a.level !== b.level) return a.level - b.level
        return Number(a.moveId) - Number(b.moveId)
      })
      return {
        key,
        label: moveSectionMeta[key].label,
        items,
      }
    })
    .filter((section) => section.items.length > 0)
}

export async function fetchPokemonDetail(
  pokemonId: number | string,
  abilityMap: Map<number, AbilitySummary> = new Map(),
  moveMap: Map<string, MoveSummary> = new Map(),
): Promise<PokemonDetail> {
  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`${API_BASE}/pokemon/${pokemonId}`),
    fetch(`${API_BASE}/pokemon-species/${pokemonId}`),
  ])

  if (!pokemonRes.ok || !speciesRes.ok) {
    throw new Error('無法載入寶可夢詳情')
  }

  const [pokemon, species] = await Promise.all([pokemonRes.json(), speciesRes.json()])

  const evolutionChain = species.evolution_chain?.url
    ? await fetch(species.evolution_chain.url)
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)
    : null

  const flavorText = pickLocalizedText(species.flavor_text_entries, 'zh-Hant')
    ?? pickLocalizedText(species.flavor_text_entries, 'en')

  const genus = pickLocalizedText(species.genera, 'zh-Hant')
    ?? pickLocalizedText(species.genera, 'en')

  const abilities: AbilityRef[] = pokemon.abilities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.slot - b.slot)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => {
      const abilityId = getAbilityIdFromUrl(entry.ability.url)
      const mapped = abilityId ? abilityMap.get(abilityId) : null
      return {
        id: abilityId,
        nameZhHant: mapped?.nameZhHant ?? entry.ability.name,
        nameEn: mapped?.nameEn ?? entry.ability.name,
        isHidden: entry.is_hidden,
      }
    })

  const stats: StatEntry[] = pokemon.stats.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (entry: any) => ({
      slug: entry.stat.name,
      label: statLabels[entry.stat.name] ?? entry.stat.name,
      value: entry.base_stat,
    }),
  )

  return {
    id: pokemon.id,
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    abilities,
    stats,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    types: pokemon.types.sort((a: any, b: any) => a.slot - b.slot).map((entry: any) => entry.type.name),
    flavorText: cleanupFlavorText(flavorText?.flavor_text),
    genus: (genus as { genus?: string })?.genus ?? '',
    eggGroups: species.egg_groups.map((group: { name: string }) => group.name),
    captureRate: species.capture_rate,
    habitat: species.habitat?.name ?? null,
    legendary: species.is_legendary,
    mythical: species.is_mythical,
    evolutionSpeciesIds: collectEvolutionSpeciesIds(evolutionChain?.chain),
    moveSections: buildMoveSections(pokemon.moves, moveMap),
  }
}

export async function fetchMoveDetail(moveId: number | string): Promise<MoveDetail> {
  const response = await fetch(`${API_BASE}/move/${moveId}`)
  if (!response.ok) {
    throw new Error('無法載入招式詳情')
  }

  const move = await response.json()
  const effectEntry = pickLocalizedText(move.effect_entries, 'zh-Hant')
    ?? pickLocalizedText(move.effect_entries, 'en')

  return {
    id: move.id,
    effect: effectEntry?.short_effect?.replace(/\$effect_chance/g, String(move.effect_chance ?? '')) ?? '',
    target: move.target?.name ?? '',
    ailment: move.meta?.ailment?.name ?? '',
    minHits: move.meta?.min_hits ?? null,
    maxHits: move.meta?.max_hits ?? null,
    drain: move.meta?.drain ?? null,
    healing: move.meta?.healing ?? null,
    critRate: move.meta?.crit_rate ?? null,
    flinchChance: move.meta?.flinch_chance ?? null,
    statChance: move.meta?.stat_chance ?? null,
    damageClassLabel: damageClassLabels[move.damage_class?.name] ?? move.damage_class?.name ?? '',
  }
}

export async function fetchAbilityDetail(abilityId: number | string): Promise<AbilityDetail> {
  const response = await fetch(`${API_BASE}/ability/${abilityId}`)
  if (!response.ok) {
    throw new Error('無法載入特性詳情')
  }

  const ability = await response.json()
  const effectEntry = pickLocalizedText(ability.effect_entries, 'zh-Hant')
    ?? pickLocalizedText(ability.effect_entries, 'en')
  const flavorEntry = pickLocalizedText(ability.flavor_text_entries, 'zh-Hant')
    ?? pickLocalizedText(ability.flavor_text_entries, 'en')

  return {
    id: ability.id,
    effect: cleanupFlavorText(effectEntry?.short_effect ?? ''),
    flavorText: cleanupFlavorText(flavorEntry?.flavor_text ?? ''),
    generationLabel: formatGenerationSlug(ability.generation?.name ?? ''),
    pokemonCount: ability.pokemon?.length ?? 0,
  }
}

const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

export async function fetchTypeEffectiveness(defendingTypeSlugs: string[] = []): Promise<TypeEffectivenessEntry[]> {
  if (!Array.isArray(defendingTypeSlugs) || defendingTypeSlugs.length === 0) {
    return ALL_TYPES.map((slug) => ({ slug, multiplier: 1 }))
  }

  const defs = Array.from(new Set(defendingTypeSlugs.map((s) => String(s).toLowerCase())))

  const results = await Promise.all(
    defs.map((slug) =>
      fetch(`${API_BASE}/type/${slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ),
  )

  const defendingMaps = results.map((res) => {
    if (!res?.damage_relations) {
      return {
        double_damage_from: new Set<string>(),
        half_damage_from: new Set<string>(),
        no_damage_from: new Set<string>(),
      }
    }
    const dr = res.damage_relations
    return {
      double_damage_from: new Set<string>((dr.double_damage_from ?? []).map((t: { name: string }) => t.name)),
      half_damage_from: new Set<string>((dr.half_damage_from ?? []).map((t: { name: string }) => t.name)),
      no_damage_from: new Set<string>((dr.no_damage_from ?? []).map((t: { name: string }) => t.name)),
    }
  })

  return ALL_TYPES.map((attackSlug) => {
    let multiplier = 1
    for (const dm of defendingMaps) {
      if (dm.no_damage_from.has(attackSlug)) { multiplier = 0; break }
      if (dm.double_damage_from.has(attackSlug)) multiplier *= 2
      if (dm.half_damage_from.has(attackSlug)) multiplier *= 0.5
    }
    return { slug: attackSlug, multiplier }
  })
}
