#!/usr/bin/env python3
"""Build the Latin names used for the river and lake labels.

The CARTO basemap carries a `name:en` for only a small share of Bulgarian
water features, so the map's water labels were almost empty. This script
collects the OSM names within Bulgaria plus a ~30 km margin and writes a
Cyrillic -> Latin lookup that map.js applies to the basemap's own labels.

Names follow the official Bulgarian transliteration system (Streamlined
System, 2006) with a few hand-checked overrides: the features the article
names, and the conventional English spellings (Danube, Struma, Maritsa).
A Latin `name:en` in OSM wins over the transliteration.
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

# Bulgaria, with roughly 30 km of margin so the border rivers keep their names.
BBOX = "40.95,21.98,44.50,28.99"
ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

# Two requests: the combined one is heavy enough that Overpass answers 502.
QUERIES = {
    "rivers": f"""
[out:json][timeout:180];
(
  way["waterway"~"^(river|canal)$"]["name"]({BBOX});
  relation["waterway"="river"]["name"]({BBOX});
);
out tags center;
""",
    "lakes": f"""
[out:json][timeout:180];
(
  way["natural"="water"]["name"]["water"!="pond"]({BBOX});
  relation["natural"="water"]["name"]({BBOX});
  way["landuse"="reservoir"]["name"]({BBOX});
);
out tags center;
""",
}
CACHE_DIR = Path("/tmp")

# Streamlined System, 2006. Upper-case entries keep the original casing.
CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ж": "zh",
    "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sht", "ъ": "a",
    "ь": "y", "ю": "yu", "я": "ya", "ѝ": "i",
    "А": "A", "Б": "B", "В": "V", "Г": "G", "Д": "D", "Е": "E", "Ж": "Zh",
    "З": "Z", "И": "I", "Й": "Y", "К": "K", "Л": "L", "М": "M", "Н": "N",
    "О": "O", "П": "P", "Р": "R", "С": "S", "Т": "T", "У": "U", "Ф": "F",
    "Х": "H", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Sht", "Ъ": "A",
    "Ь": "Y", "Ю": "Yu", "Я": "Ya",
}

# Hand-checked names: features named in the article, plus the spellings an
# English-language reader expects. Keys are cleaned OSM names.
OVERRIDES = {
    "Дунав": "Danube",
    "Струма": "Struma",
    "Марица": "Maritsa",
    "Нишава": "Nisava",
    "Искър": "Iskar",
    "Тунджа": "Tundzha",
    "Осъм": "Osam",
    "Янтра": "Yantra",
    "Камчия": "Kamchia",
    "Арда": "Arda",
    "Места": "Mesta",
    "Вардар": "Vardar",
    "Конска": "Konska",
    "Крива река": "Kriva reka",
    "Сливнишка река": "Slivnishka reka",
    "Габерска река": "Gaberska reka",
    "Повалиръжка река": "Povalirazhka reka",
    "Красава": "Krassava",
    # Macedonian and Serbian names inside the margin whose OSM name:en is
    # an awkward machine translation; Latin transliteration reads better.
    "Виничка Река": "Vinichka reka",
    "Дојранско Езеро / Λίμνη Δοϊράνη": "Lake Dojran",
    "Езеро Калиманци": "Lake Kalimanci",
    "Оризарска Река": "Orizarska reka",
    "Пекљанска Река": "Peklyanska reka",
    "Руенското езеро": "Lake Ruen",
}

PREFIXES = ("язовир ", "яз. ", "яз.", "езеро ", "река ")


def is_cyrillic(text: str) -> bool:
    return any("\u0400" <= ch <= "\u04ff" for ch in text)


def clean(name: str) -> str:
    value = re.sub(r"^р\.\s*", "", name.strip())
    for prefix in PREFIXES:
        if value.lower().startswith(prefix):
            value = value[len(prefix):]
            break
    return re.sub(r"\s+", " ", value).strip()


def transliterate(name: str) -> str:
    value = name.replace("ьо", "yo").replace("Ьо", "Yo").replace("ЬО", "YO")
    # Word-final -ия reads as -ia (София -> Sofia, Камчия -> Kamchia).
    value = re.sub(r"ия\b", "ia", value)
    value = re.sub(r"Ия\b", "Ia", value)
    return "".join(CYRILLIC.get(ch, ch) for ch in value)


def latin_name(tags: dict) -> str | None:
    name = tags.get("name", "")
    if not name or not is_cyrillic(name):
        return None

    cleaned = clean(name)
    for candidate in (name, cleaned):
        if candidate in OVERRIDES:
            return OVERRIDES[candidate]

    english = tags.get("name:en", "")
    if english and not is_cyrillic(english) and re.search(r"[A-Za-z]", english):
        return english

    return transliterate(cleaned)


def fetch(name: str) -> dict:
    cache = CACHE_DIR / f"breznik_water_{name}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))

    body = urllib.parse.urlencode({"data": QUERIES[name]}).encode()
    last_error: Exception | None = None
    for attempt, endpoint in enumerate(ENDPOINTS * 2):
        try:
            print(f"Downloading {name} from {endpoint} (attempt {attempt + 1})")
            request = urllib.request.Request(
                endpoint,
                data=body,
                headers={"User-Agent": "mappa-breznik-build/1.0"},
            )
            with urllib.request.urlopen(request, timeout=240) as response:
                data = json.loads(response.read().decode("utf-8"))
            cache.write_text(json.dumps(data), encoding="utf-8")
            return data
        except Exception as error:  # network and Overpass errors both retry
            last_error = error
            time.sleep(5)
    raise SystemExit(f"Overpass failed for {name}: {last_error}")


def main() -> None:
    tables: dict[str, dict[str, str]] = {"rivers": {}, "lakes": {}}
    suppressed: list[str] = []
    for kind in QUERIES:
        for element in fetch(kind).get("elements", []):
            tags = element.get("tags", {})
            feature = tags.get("name")
            if not feature:
                continue
            latin = latin_name(tags)
            if latin is None:
                continue
            # Serbian or Macedonian Cyrillic letters the Bulgarian rules leave
            # in place: suppress the label instead of printing Cyrillic.
            if re.search(r"[\u0400-\u04ff]", latin):
                suppressed.append(feature)
            else:
                tables[kind][feature] = latin

    tables["suppressed"] = sorted(set(suppressed))
    output = json.dumps(tables, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    out = ASSETS / "water-names.js"
    out.write_text("window.WATER_NAMES = " + output + ";\n", encoding="utf-8")
    print(
        f"Wrote {out.relative_to(ROOT)} "
        f"({len(tables['rivers'])} river names, {len(tables['lakes'])} lake names, "
        f"{len(tables['suppressed'])} suppressed, {out.stat().st_size / 1024:.0f} KB)"
    )


if __name__ == "__main__":
    main()
