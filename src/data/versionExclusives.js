const VERSION_GROUPS = {
  'scarlet-base': { key: 'scarlet-base', side: 'scarlet', label: '朱版本篇限定', shortLabel: '朱本篇' },
  'violet-base': { key: 'violet-base', side: 'violet', label: '紫版本篇限定', shortLabel: '紫本篇' },
  'scarlet-teal': { key: 'scarlet-teal', side: 'scarlet', label: '碧之假面・朱版限定', shortLabel: '碧朱' },
  'violet-teal': { key: 'violet-teal', side: 'violet', label: '碧之假面・紫版限定', shortLabel: '碧紫' },
  'scarlet-indigo': { key: 'scarlet-indigo', side: 'scarlet', label: '藍之圓盤・朱版限定', shortLabel: '藍朱' },
  'violet-indigo': { key: 'violet-indigo', side: 'violet', label: '藍之圓盤・紫版限定', shortLabel: '藍紫' },
}

const CHAMPION_MAX_SPECIES_ID = 1025

const speciesToKeys = {
  207: ['scarlet-teal'],
  190: ['violet-teal'],
  200: ['violet-base'],
  207: ['scarlet-teal'],
  246: ['scarlet-base'],
  247: ['scarlet-base'],
  248: ['scarlet-base'],
  316: ['violet-base'],
  317: ['violet-base'],
  371: ['violet-base'],
  372: ['violet-base'],
  373: ['violet-base'],
  424: ['violet-teal'],
  425: ['scarlet-base'],
  426: ['scarlet-base'],
  429: ['violet-base'],
  434: ['scarlet-base'],
  435: ['scarlet-base'],
  472: ['scarlet-teal'],
  633: ['scarlet-base'],
  634: ['scarlet-base'],
  635: ['scarlet-base'],
  690: ['scarlet-base'],
  691: ['scarlet-base'],
  692: ['violet-base'],
  693: ['violet-base'],
  765: ['scarlet-base'],
  766: ['violet-base'],
  845: ['scarlet-teal'],
  874: ['scarlet-base'],
  875: ['violet-base'],
  877: ['violet-teal'],
  936: ['scarlet-base'],
  937: ['violet-base'],
  984: ['scarlet-base'],
  985: ['scarlet-base'],
  986: ['scarlet-base'],
  987: ['scarlet-base'],
  988: ['scarlet-base'],
  989: ['scarlet-base'],
  990: ['violet-base'],
  991: ['violet-base'],
  992: ['violet-base'],
  993: ['violet-base'],
  994: ['violet-base'],
  995: ['violet-base'],
  1005: ['scarlet-base'],
  1006: ['violet-base'],
  1007: ['scarlet-base'],
  1008: ['violet-base'],
  1020: ['scarlet-indigo'],
  1021: ['scarlet-indigo'],
  1022: ['violet-indigo'],
  1023: ['violet-indigo'],
}

export const VERSION_FILTER_OPTIONS = [
  { value: 'all', label: '全部版本' },
  { value: 'champion', label: '寶可夢冠軍' },
  { value: 'scarlet-any', label: '朱版限定（全部）' },
  { value: 'violet-any', label: '紫版限定（全部）' },
  { value: 'scarlet-base', label: VERSION_GROUPS['scarlet-base'].label },
  { value: 'violet-base', label: VERSION_GROUPS['violet-base'].label },
  { value: 'scarlet-teal', label: VERSION_GROUPS['scarlet-teal'].label },
  { value: 'violet-teal', label: VERSION_GROUPS['violet-teal'].label },
  { value: 'scarlet-indigo', label: VERSION_GROUPS['scarlet-indigo'].label },
  { value: 'violet-indigo', label: VERSION_GROUPS['violet-indigo'].label },
]

export function getVersionTags(speciesId) {
  const keys = speciesToKeys[speciesId] ?? []
  return keys.map((key) => VERSION_GROUPS[key]).filter(Boolean)
}

export function isChampionAvailable(speciesId) {
  return speciesId >= 1 && speciesId <= CHAMPION_MAX_SPECIES_ID
}

export function matchesVersionFilter(tags, filterValue, championAvailable = false) {
  if (filterValue === 'all') return true
  if (filterValue === 'champion') return championAvailable
  if (filterValue === 'scarlet-any') return tags.some((tag) => tag.side === 'scarlet')
  if (filterValue === 'violet-any') return tags.some((tag) => tag.side === 'violet')
  return tags.some((tag) => tag.key === filterValue)
}
