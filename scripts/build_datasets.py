from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from urllib.request import urlopen

BASE_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
LANG_ZH_HANT = "4"
LANG_EN = "9"
LANG_JA = "1"

GENERATION_LABELS = {
    1: "Gen 1 · 關都",
    2: "Gen 2 · 城都",
    3: "Gen 3 · 豐緣",
    4: "Gen 4 · 神奧",
    5: "Gen 5 · 合眾",
    6: "Gen 6 · 卡洛斯",
    7: "Gen 7 · 阿羅拉",
    8: "Gen 8 · 伽勒爾 / 洗翠",
    9: "Gen 9 · 帕底亞",
}

# Champions-legal species (186 base species IDs)
# Matches src/data/championsAvailability.ts CHAMPIONS_SPECIES_IDS
CHAMPIONS_SPECIES_IDS: frozenset[int] = frozenset([
    # Gen 1
    3, 6, 9, 15, 18, 24, 25, 26, 36, 38, 59, 65, 68, 71, 80, 94, 115, 121, 127,
    128, 130, 132, 134, 135, 136, 142, 143, 149,
    # Gen 2
    154, 157, 160, 168, 181, 184, 186, 196, 197, 199, 205, 208, 212, 214, 227,
    229, 248,
    # Gen 3
    279, 282, 302, 306, 308, 310, 319, 323, 324, 334, 350, 351, 354, 358, 359,
    362,
    # Gen 4
    389, 392, 395, 405, 407, 409, 411, 428, 442, 445, 448, 450, 454, 460, 461,
    464, 470, 471, 472, 473, 475, 478, 479,
    # Gen 5
    497, 500, 503, 505, 510, 512, 514, 516, 530, 531, 534, 547, 553, 563, 569,
    571, 579, 584, 587, 609, 614, 618, 623, 635, 637,
    # Gen 6
    652, 655, 658, 660, 663, 666, 670, 671, 675, 676, 678, 681, 683, 685, 693,
    695, 697, 699, 700, 701, 702, 706, 707, 709, 711, 713, 715,
    # Gen 7
    724, 727, 730, 733, 740, 745, 748, 750, 752, 758, 763, 765, 766, 778, 780,
    784,
    # Gen 8
    823, 841, 842, 844, 855, 858, 866, 867, 869, 877, 887, 899, 900, 902, 903,
    # Gen 9
    908, 911, 914, 925, 934, 936, 937, 939, 952, 956, 959, 964, 968, 970, 981,
    983, 1013, 1018, 1019,
])

STAT_ID_TO_KEY = {1: "hp", 2: "atk", 3: "def", 4: "spa", 5: "spd", 6: "spe"}

MOVE_CLASS_LABELS = {
    "1": {"slug": "status", "labelZhHant": "變化", "labelEn": "Status"},
    "2": {"slug": "physical", "labelZhHant": "物理", "labelEn": "Physical"},
    "3": {"slug": "special", "labelZhHant": "特殊", "labelEn": "Special"},
}


def read_csv(name: str):
    with urlopen(BASE_URL + name, timeout=60) as response:
        text = response.read().decode("utf-8")
    return list(csv.DictReader(text.splitlines()))


def titleize_slug(slug: str) -> str:
    return slug.replace("-", " ").title()


def build_pokemon_stats() -> dict[int, dict]:
    """Returns dict mapping pokemon_id -> {hp, atk, def, spa, spd, spe, bst}."""
    stats: dict[int, dict] = defaultdict(lambda: {k: 0 for k in STAT_ID_TO_KEY.values()})
    for row in read_csv("pokemon_stats.csv"):
        stat_key = STAT_ID_TO_KEY.get(int(row["stat_id"]))
        if stat_key:
            stats[int(row["pokemon_id"])][stat_key] = int(row["base_stat"])
    result: dict[int, dict] = {}
    for pid, s in stats.items():
        bst = s["hp"] + s["atk"] + s["def"] + s["spa"] + s["spd"] + s["spe"]
        result[pid] = {**s, "bst": bst}
    return result


def build_type_maps() -> dict[int, dict]:
    types = {int(row["id"]): {"slug": row["identifier"]} for row in read_csv("types.csv")}
    for row in read_csv("type_names.csv"):
        type_id = int(row["type_id"])
        if type_id not in types:
            continue
        lang = row["local_language_id"]
        if lang == LANG_ZH_HANT:
            types[type_id]["nameZhHant"] = row["name"]
        elif lang == LANG_EN:
            types[type_id]["nameEn"] = row["name"]
    for item in types.values():
        item.setdefault("nameZhHant", titleize_slug(item["slug"]))
        item.setdefault("nameEn", titleize_slug(item["slug"]))
    return types


def build_pokedex_summary(types: dict[int, dict], stats: dict[int, dict]) -> list[dict]:
    pokemon_rows = read_csv("pokemon.csv")
    species_rows = read_csv("pokemon_species.csv")
    species_name_rows = read_csv("pokemon_species_names.csv")
    pokemon_type_rows = read_csv("pokemon_types.csv")

    species_meta = {
        int(row["id"]): {
            "slug": row["identifier"],
            "generationId": int(row["generation_id"]),
        }
        for row in species_rows
    }

    species_names: dict[int, dict] = defaultdict(dict)
    for row in species_name_rows:
        species_id = int(row["pokemon_species_id"])
        lang = row["local_language_id"]
        if lang == LANG_ZH_HANT:
            species_names[species_id]["nameZhHant"] = row["name"]
            species_names[species_id]["genusZhHant"] = row["genus"]
        elif lang == LANG_EN:
            species_names[species_id]["nameEn"] = row["name"]
            species_names[species_id]["genusEn"] = row["genus"]
        elif lang == LANG_JA:
            species_names[species_id]["nameJa"] = row["name"]

    pokemon_types: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for row in pokemon_type_rows:
        pokemon_types[int(row["pokemon_id"])] .append((int(row["slot"]), int(row["type_id"])))

    entries: list[dict] = []
    for row in pokemon_rows:
        if row["is_default"] != "1":
            continue
        pokemon_id = int(row["id"])
        species_id = int(row["species_id"])
        meta = species_meta.get(species_id)
        if not meta:
            continue
        generation_id = meta["generationId"]
        names = species_names.get(species_id, {})
        slot_types = [types[type_id] for _, type_id in sorted(pokemon_types.get(pokemon_id, []), key=lambda item: item[0])]
        entries.append(
            {
                "id": pokemon_id,
                "speciesId": species_id,
                "slug": row["identifier"],
                "nameZhHant": names.get("nameZhHant") or titleize_slug(meta["slug"]),
                "nameEn": names.get("nameEn") or titleize_slug(meta["slug"]),
                "nameJa": names.get("nameJa") or names.get("nameEn") or titleize_slug(meta["slug"]),
                "genusZhHant": names.get("genusZhHant", ""),
                "genusEn": names.get("genusEn", ""),
                "generationId": generation_id,
                "generationLabel": GENERATION_LABELS.get(generation_id, f"Gen {generation_id}"),
                "types": slot_types,
                "sprite": f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{pokemon_id}.png",
                "isChampionsLegal": species_id in CHAMPIONS_SPECIES_IDS,
                **stats.get(pokemon_id, {"hp": 0, "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0, "bst": 0}),
            }
        )

    return sorted(entries, key=lambda item: item["speciesId"])


def build_move_summary(types: dict[int, dict]) -> list[dict]:
    move_rows = read_csv("moves.csv")
    move_name_rows = read_csv("move_names.csv")

    move_names: dict[int, dict] = defaultdict(dict)
    for row in move_name_rows:
        move_id = int(row["move_id"])
        lang = row["local_language_id"]
        if lang == LANG_ZH_HANT:
            move_names[move_id]["nameZhHant"] = row["name"]
        elif lang == LANG_EN:
            move_names[move_id]["nameEn"] = row["name"]
        elif lang == LANG_JA:
            move_names[move_id]["nameJa"] = row["name"]

    entries: list[dict] = []
    for row in move_rows:
        move_id = int(row["id"])
        names = move_names.get(move_id, {})
        generation_id = int(row["generation_id"])
        type_id = int(row["type_id"])
        damage_class = MOVE_CLASS_LABELS.get(row["damage_class_id"], {"slug": "unknown", "labelZhHant": "未知", "labelEn": "Unknown"})
        entries.append(
            {
                "id": move_id,
                "slug": row["identifier"],
                "nameZhHant": names.get("nameZhHant") or titleize_slug(row["identifier"]),
                "nameEn": names.get("nameEn") or titleize_slug(row["identifier"]),
                "nameJa": names.get("nameJa") or names.get("nameEn") or titleize_slug(row["identifier"]),
                "generationId": generation_id,
                "generationLabel": GENERATION_LABELS.get(generation_id, f"Gen {generation_id}"),
                "type": types[type_id],
                "power": None if row["power"] == "" else int(row["power"]),
                "accuracy": None if row["accuracy"] == "" else int(row["accuracy"]),
                "pp": None if row["pp"] == "" else int(row["pp"]),
                "damageClass": damage_class,
            }
        )

    return sorted(entries, key=lambda item: item["id"])


def build_ability_summary() -> list[dict]:
    ability_rows = read_csv("abilities.csv")
    ability_name_rows = read_csv("ability_names.csv")

    ability_names: dict[int, dict] = defaultdict(dict)
    for row in ability_name_rows:
        ability_id = int(row["ability_id"])
        lang = row["local_language_id"]
        if lang == LANG_ZH_HANT:
            ability_names[ability_id]["nameZhHant"] = row["name"]
        elif lang == LANG_EN:
            ability_names[ability_id]["nameEn"] = row["name"]
        elif lang == LANG_JA:
            ability_names[ability_id]["nameJa"] = row["name"]

    entries: list[dict] = []
    for row in ability_rows:
        ability_id = int(row["id"])
        names = ability_names.get(ability_id, {})
        generation_id = int(row["generation_id"])
        entries.append(
            {
                "id": ability_id,
                "slug": row["identifier"],
                "nameZhHant": names.get("nameZhHant") or titleize_slug(row["identifier"]),
                "nameEn": names.get("nameEn") or titleize_slug(row["identifier"]),
                "nameJa": names.get("nameJa") or names.get("nameEn") or titleize_slug(row["identifier"]),
                "generationId": generation_id,
                "generationLabel": GENERATION_LABELS.get(generation_id, f"Gen {generation_id}"),
            }
        )

    return sorted(entries, key=lambda item: item["id"])


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    types = build_type_maps()
    stats = build_pokemon_stats()
    pokedex = build_pokedex_summary(types, stats)
    moves = build_move_summary(types)
    abilities = build_ability_summary()

    payloads = {
        "pokedex-summary.json": pokedex,
        "moves-summary.json": moves,
        "abilities-summary.json": abilities,
    }

    for filename, payload in payloads.items():
        (OUT_DIR / filename).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Wrote {filename}: {len(payload)} records")


if __name__ == "__main__":
    main()
