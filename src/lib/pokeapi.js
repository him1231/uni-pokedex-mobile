const API_BASE = 'https://pokeapi.co/api/v2'

const pickLocalizedText = (entries = [], lang, fallbackLang = 'en') => {
  const primary = entries.find((entry) => entry.language?.name === lang)
  if (primary) return primary
  return entries.find((entry) => entry.language?.name === fallbackLang) ?? null
}

const cleanupFlavorText = (text = '') =>
  text.replace(/\f|\n|\r/g, ' ').replace(/\s+/g, ' ').trim()

const statLabels = {
  hp: 'HP',
  attack: '攻擊',
  defense: '防禦',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
}

const damageClassLabels = {
  status: '變化',
  physical: '物理',
  special: '特殊',
}

function formatGenerationSlug(slug = '') {
  return slug.replace('generation-', 'Generation ').replace(/-/g, ' ')
}

export const getAbilityIdFromUrl = (url = '') => {
  const match = url.match(/\/ability\/(\d+)\//)
  return match ? Number(match[1]) : null
}

export async function fetchPokemonDetail(pokemonId, abilityMap = new Map()) {
  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`${API_BASE}/pokemon/${pokemonId}`),
    fetch(`${API_BASE}/pokemon-species/${pokemonId}`),
  ])

  if (!pokemonRes.ok || !speciesRes.ok) {
    throw new Error('無法載入寶可夢詳情')
  }

  const [pokemon, species] = await Promise.all([pokemonRes.json(), speciesRes.json()])

  const flavorText = pickLocalizedText(species.flavor_text_entries, 'zh-Hant')
    ?? pickLocalizedText(species.flavor_text_entries, 'en')

  const genus = pickLocalizedText(species.genera, 'zh-Hant')
    ?? pickLocalizedText(species.genera, 'en')

  return {
    id: pokemon.id,
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    abilities: pokemon.abilities
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => {
        const abilityId = getAbilityIdFromUrl(entry.ability.url)
        const mapped = abilityId ? abilityMap.get(abilityId) : null
        return {
          id: abilityId,
          nameZhHant: mapped?.nameZhHant ?? entry.ability.name,
          nameEn: mapped?.nameEn ?? entry.ability.name,
          isHidden: entry.is_hidden,
        }
      }),
    stats: pokemon.stats.map((entry) => ({
      slug: entry.stat.name,
      label: statLabels[entry.stat.name] ?? entry.stat.name,
      value: entry.base_stat,
    })),
    types: pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type.name),
    flavorText: cleanupFlavorText(flavorText?.flavor_text),
    genus: genus?.genus ?? '',
    eggGroups: species.egg_groups.map((group) => group.name),
    captureRate: species.capture_rate,
    habitat: species.habitat?.name ?? null,
    legendary: species.is_legendary,
    mythical: species.is_mythical,
  }
}

export async function fetchMoveDetail(moveId) {
  const response = await fetch(`${API_BASE}/move/${moveId}`)
  if (!response.ok) {
    throw new Error('無法載入招式詳情')
  }

  const move = await response.json()
  const effectEntry = pickLocalizedText(move.effect_entries, 'zh-Hant')
    ?? pickLocalizedText(move.effect_entries, 'en')

  return {
    id: move.id,
    effect: effectEntry?.short_effect?.replace(/\$effect_chance/g, move.effect_chance ?? '') ?? '',
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

export async function fetchAbilityDetail(abilityId) {
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
