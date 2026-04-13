/** For each attacking type, which defending types does it hit for 2× (or better)? */
export const ATTACK_COVERAGE: Record<string, string[]> = {
  normal:   [],
  fire:     ['bug', 'steel', 'grass', 'ice'],
  water:    ['fire', 'ground', 'rock'],
  electric: ['water', 'flying'],
  grass:    ['water', 'ground', 'rock'],
  ice:      ['grass', 'ground', 'dragon', 'flying'],
  fighting: ['normal', 'rock', 'steel', 'ice', 'dark'],
  poison:   ['grass', 'fairy'],
  ground:   ['fire', 'electric', 'poison', 'rock', 'steel'],
  flying:   ['fighting', 'bug', 'grass'],
  psychic:  ['fighting', 'poison'],
  bug:      ['grass', 'psychic', 'dark'],
  rock:     ['fire', 'ice', 'flying', 'bug'],
  ghost:    ['psychic', 'ghost'],
  dragon:   ['dragon'],
  dark:     ['psychic', 'ghost'],
  steel:    ['ice', 'rock', 'fairy'],
  fairy:    ['fighting', 'dragon', 'dark'],
}

export const ALL_TYPES = [
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
] as const

export type TypeSlug = typeof ALL_TYPES[number]

export const TYPE_LABELS_ZH: Record<string, string> = {
  normal: '一般', fire: '火', water: '水', electric: '電', grass: '草', ice: '冰',
  fighting: '格鬥', poison: '毒', ground: '地面', flying: '飛行', psychic: '超能力',
  bug: '蟲', rock: '岩石', ghost: '幽靈', dragon: '龍', dark: '惡', steel: '鋼', fairy: '妖精',
}
