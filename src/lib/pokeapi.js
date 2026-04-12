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

const moveSectionMeta = {
  levelUp: { label: '升級招式' },
  egg: { label: '蛋招式' },
  machine: { label: '招式機' },
  tutor: { label: '教學招式' },
  other: { label: '其他來源' },
}

const moveMethodToSection = {
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

const collectEvolutionSpeciesIds = (chain) => {
  const ids = []
  const walk = (node) => {
    if (!node) return
    const speciesId = getResourceIdFromUrl(node.species?.url)
    if (speciesId) ids.push(speciesId)
    ;(node.evolves_to ?? []).forEach(walk)
  }
  walk(chain)
  return [...new Set(ids)]
}

const buildMoveSections = (moves = [], moveMap = new Map()) => {
  const sections = {
    levelUp: [],
    egg: [],
    machine: [],
    tutor: [],
    other: [],
  }

  moves.forEach((entry) => {
    const versionDetails = (entry.version_group_details ?? []).filter(
      (detail) => detail.version_group?.name === 'scarlet-violet',
    )

    versionDetails.forEach((detail) => {
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

  const dedupe = (items) => {
    const seen = new Set()
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
        return a.moveId - b.moveId
      })
      return {
        key,
        label: moveSectionMeta[key].label,
        items,
      }
    })
    .filter((section) => section.items.length > 0)
}

export async function fetchPokemonDetail(pokemonId, abilityMap = new Map(), moveMap = new Map()) {
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
    evolutionSpeciesIds: collectEvolutionSpeciesIds(evolutionChain?.chain),
    moveSections: buildMoveSections(pokemon.moves, moveMap),
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

// Compute defensive type effectiveness for a Pokémon given its type slugs.
// Returns an array of { slug, multiplier } for the standard 18 types.
export async function fetchTypeEffectiveness(defendingTypeSlugs = []) {
  if (!Array.isArray(defendingTypeSlugs) || defendingTypeSlugs.length === 0) {
    // default: all types x1
    return ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'].map((slug) => ({ slug, multiplier: 1 }))
  }

  // Normalize unique slugs
  const defs = Array.from(new Set(defendingTypeSlugs.map((s) => String(s).toLowerCase())))

  // Fetch type data from PokeAPI in parallel
  const promises = defs.map((slug) =>
    fetch(`${API_BASE}/type/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  )

  const results = await Promise.all(promises)

  const defendingMaps = results.map((res) => {
    if (!res || !res.damage_relations) return {
      double_damage_from: new Set(),
      half_damage_from: new Set(),
      no_damage_from: new Set(),
    }
    const dr = res.damage_relations
    return {
      double_damage_from: new Set((dr.double_damage_from || []).map((t) => t.name)),
      half_damage_from: new Set((dr.half_damage_from || []).map((t) => t.name)),
      no_damage_from: new Set((dr.no_damage_from || []).map((t) => t.name)),
    }
  })

  const allAttackTypes = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']

  const computeMultiplier = (attack) => {
    let mul = 1
    for (const dm of defendingMaps) {
      if (dm.no_damage_from && dm.no_damage_from.has(attack)) return 0
      if (dm.double_damage_from && dm.double_damage_from.has(attack)) mul *= 2
      if (dm.half_damage_from && dm.half_damage_from.has(attack)) mul *= 0.5
    }
    return mul
  }

  return allAttackTypes.map((attack) => ({ slug: attack, multiplier: computeMultiplier(attack) }))
}

