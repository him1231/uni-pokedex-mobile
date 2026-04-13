/**
 * Pokémon Champions availability data
 * Source: Polygon — "All available Pokémon in Pokémon Champions"
 * https://www.polygon.com/pokemon-champions-all-pokemon-list-pokedex/
 * Last updated: 2026-04-08 (article date)
 *
 * 186 base species + regional forms + 59 Mega Evolutions
 */

/** The 186 species available in Pokémon Champions (by National Pokédex speciesId) */
export const CHAMPIONS_SPECIES_IDS: ReadonlySet<number> = new Set([
  // Gen 1
  3, 6, 9, 15, 18, 24, 25, 26, 36, 38, 59, 65, 68, 71, 80, 94, 115, 121, 127,
  128, 130, 132, 134, 135, 136, 142, 143, 149,
  // Gen 2
  154, 157, 160, 168, 181, 184, 186, 196, 197, 199, 205, 208, 212, 214, 227,
  229, 248,
  // Gen 3
  279, 282, 302, 306, 308, 310, 319, 323, 324, 334, 350, 351, 354, 358, 359,
  362,
  // Gen 4
  389, 392, 395, 405, 407, 409, 411, 428, 442, 445, 448, 450, 454, 460, 461,
  464, 470, 471, 472, 473, 475, 478, 479,
  // Gen 5
  497, 500, 503, 505, 510, 512, 514, 516, 530, 531, 534, 547, 553, 563, 569,
  571, 579, 584, 587, 609, 614, 618, 623, 635, 637,
  // Gen 6
  652, 655, 658, 660, 663, 666, 670, 671, 675, 676, 678, 681, 683, 685, 693,
  695, 697, 699, 700, 701, 702, 706, 707, 709, 711, 713, 715,
  // Gen 7
  724, 727, 730, 733, 740, 745, 748, 750, 752, 758, 763, 765, 766, 778, 780,
  784,
  // Gen 8
  823, 841, 842, 844, 855, 858, 866, 867, 869, 877, 887, 899, 900, 902, 903,
  // Gen 9
  908, 911, 914, 925, 934, 936, 937, 939, 952, 956, 959, 964, 968, 970, 981,
  983, 1013, 1018, 1019,
])

/**
 * Regional form slugs (PokeAPI identifier format) available in Pokémon Champions.
 * These share a speciesId with their base form.
 */
export const CHAMPIONS_REGIONAL_FORMS: ReadonlySet<string> = new Set([
  'raichu-alola',         // speciesId 26
  'ninetales-alola',      // speciesId 38
  'arcanine-hisui',       // speciesId 59
  'slowbro-galar',        // speciesId 80
  'tauros-paldea-combat', // speciesId 128
  'tauros-paldea-blaze',  // speciesId 128
  'tauros-paldea-aqua',   // speciesId 128
  'typhlosion-hisui',     // speciesId 157
  'slowking-galar',       // speciesId 199
  'samurott-hisui',       // speciesId 503
  'zoroark-hisui',        // speciesId 571
  'stunfisk-galar',       // speciesId 618
  'avalugg-hisui',        // speciesId 713
  'decidueye-hisui',      // speciesId 724
])

/**
 * Mega Evolution slugs (Champions-specific naming convention) available in Pokémon Champions.
 * Note: Several Gen 5–9 Megas were introduced in Champions and may not exist in PokeAPI.
 * These use the convention "{base-slug}-mega" (or "-mega-x"/"-mega-y" for Charizard).
 * 59 Mega Evolutions total.
 */
export const CHAMPIONS_MEGA_FORMS: ReadonlySet<string> = new Set([
  // Gen 1 Megas
  'venusaur-mega',         // #3
  'charizard-mega-x',      // #6
  'charizard-mega-y',      // #6
  'blastoise-mega',        // #9
  'beedrill-mega',         // #15
  'pidgeot-mega',          // #18
  'clefable-mega',         // #36  (Champions-original)
  'alakazam-mega',         // #65
  'victreebel-mega',       // #71  (Champions-original)
  'slowbro-mega',          // #80
  'gengar-mega',           // #94
  'kangaskhan-mega',       // #115
  'starmie-mega',          // #121 (Champions-original)
  'pinsir-mega',           // #127
  'gyarados-mega',         // #130
  'aerodactyl-mega',       // #142
  'dragonite-mega',        // #149 (Champions-original)
  // Gen 2 Megas
  'meganium-mega',         // #154 (Champions-original)
  'feraligatr-mega',       // #160 (Champions-original)
  'ampharos-mega',         // #181
  'steelix-mega',          // #208
  'scizor-mega',           // #212
  'heracross-mega',        // #214
  'skarmory-mega',         // #227 (Champions-original)
  'houndoom-mega',         // #229
  'tyranitar-mega',        // #248
  // Gen 3 Megas
  'gardevoir-mega',        // #282
  'sableye-mega',          // #302
  'aggron-mega',           // #306
  'medicham-mega',         // #308
  'manectric-mega',        // #310
  'sharpedo-mega',         // #319
  'camerupt-mega',         // #323
  'altaria-mega',          // #334
  'banette-mega',          // #354
  'chimecho-mega',         // #358 (Champions-original)
  'absol-mega',            // #359
  'glalie-mega',           // #362
  // Gen 4 Megas
  'lopunny-mega',          // #428
  'garchomp-mega',         // #445
  'lucario-mega',          // #448
  'abomasnow-mega',        // #460
  'gallade-mega',          // #475
  'froslass-mega',         // #478 (Champions-original)
  // Gen 5 Megas
  'emboar-mega',           // #500 (Champions-original)
  'excadrill-mega',        // #530 (Champions-original)
  'audino-mega',           // #531
  'chandelure-mega',       // #609 (Champions-original)
  'golurk-mega',           // #623 (Champions-original)
  // Gen 6 Megas
  'chesnaught-mega',       // #652 (Champions-original)
  'delphox-mega',          // #655 (Champions-original)
  'greninja-mega',         // #658 (Champions-original)
  'floette-eternal-mega',  // #670 (Champions-original)
  'meowstic-mega',         // #678 (Champions-original)
  'hawlucha-mega',         // #701 (Champions-original)
  // Gen 7 Megas
  'crabominable-mega',     // #740 (Champions-original)
  'drampa-mega',           // #780 (Champions-original)
  // Gen 9 Megas
  'scovillain-mega',       // #952 (Champions-original)
  'glimmora-mega',         // #970 (Champions-original)
])

/**
 * Returns true if the given speciesId is usable in Pokémon Champions.
 */
export function isChampionsLegal(speciesId: number): boolean {
  return CHAMPIONS_SPECIES_IDS.has(speciesId)
}

/**
 * Returns true if the given form slug is a Champions-legal regional form.
 */
export function isChampionsRegionalForm(slug: string): boolean {
  return CHAMPIONS_REGIONAL_FORMS.has(slug)
}

/**
 * Returns true if the given form slug is a Champions-legal Mega Evolution.
 */
export function isChampionsMega(slug: string): boolean {
  return CHAMPIONS_MEGA_FORMS.has(slug)
}

/**
 * Returns all regional form slugs for a given speciesId that are legal in Champions.
 */
export function getChampionsFormsForSpecies(speciesId: number): string[] {
  const SPECIES_TO_REGIONAL: Record<number, string[]> = {
    26:  ['raichu-alola'],
    38:  ['ninetales-alola'],
    59:  ['arcanine-hisui'],
    80:  ['slowbro-galar'],
    128: ['tauros-paldea-combat', 'tauros-paldea-blaze', 'tauros-paldea-aqua'],
    157: ['typhlosion-hisui'],
    199: ['slowking-galar'],
    503: ['samurott-hisui'],
    571: ['zoroark-hisui'],
    618: ['stunfisk-galar'],
    713: ['avalugg-hisui'],
    724: ['decidueye-hisui'],
  }
  return SPECIES_TO_REGIONAL[speciesId] ?? []
}

/**
 * Returns all Mega Evolution slugs for a given speciesId that are legal in Champions.
 */
export function getChampionsMegasForSpecies(speciesId: number): string[] {
  const SPECIES_TO_MEGAS: Record<number, string[]> = {
    3:   ['venusaur-mega'],
    6:   ['charizard-mega-x', 'charizard-mega-y'],
    9:   ['blastoise-mega'],
    15:  ['beedrill-mega'],
    18:  ['pidgeot-mega'],
    36:  ['clefable-mega'],
    65:  ['alakazam-mega'],
    71:  ['victreebel-mega'],
    80:  ['slowbro-mega'],
    94:  ['gengar-mega'],
    115: ['kangaskhan-mega'],
    121: ['starmie-mega'],
    127: ['pinsir-mega'],
    130: ['gyarados-mega'],
    142: ['aerodactyl-mega'],
    149: ['dragonite-mega'],
    154: ['meganium-mega'],
    160: ['feraligatr-mega'],
    181: ['ampharos-mega'],
    208: ['steelix-mega'],
    212: ['scizor-mega'],
    214: ['heracross-mega'],
    227: ['skarmory-mega'],
    229: ['houndoom-mega'],
    248: ['tyranitar-mega'],
    282: ['gardevoir-mega'],
    302: ['sableye-mega'],
    306: ['aggron-mega'],
    308: ['medicham-mega'],
    310: ['manectric-mega'],
    319: ['sharpedo-mega'],
    323: ['camerupt-mega'],
    334: ['altaria-mega'],
    354: ['banette-mega'],
    358: ['chimecho-mega'],
    359: ['absol-mega'],
    362: ['glalie-mega'],
    428: ['lopunny-mega'],
    445: ['garchomp-mega'],
    448: ['lucario-mega'],
    460: ['abomasnow-mega'],
    475: ['gallade-mega'],
    478: ['froslass-mega'],
    500: ['emboar-mega'],
    530: ['excadrill-mega'],
    531: ['audino-mega'],
    609: ['chandelure-mega'],
    623: ['golurk-mega'],
    652: ['chesnaught-mega'],
    655: ['delphox-mega'],
    658: ['greninja-mega'],
    670: ['floette-eternal-mega'],
    678: ['meowstic-mega'],
    701: ['hawlucha-mega'],
    740: ['crabominable-mega'],
    780: ['drampa-mega'],
    952: ['scovillain-mega'],
    970: ['glimmora-mega'],
  }
  return SPECIES_TO_MEGAS[speciesId] ?? []
}
