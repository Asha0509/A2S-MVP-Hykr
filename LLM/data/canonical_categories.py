"""
Canonical room and item reference from A2S_ScrapingReference.pdf (section 1).

Single source of truth for scraper normalisation:
- CANONICAL_ITEMS_BY_ROOM gives the per-room target inventory.
- ROOM_ALIASES maps free-form room strings from scrapers / users to canonical room keys.
- CATEGORY_ALIASES maps free-form product_type strings to canonical category keys.

Hard blockers (PDF section 3) use the canonical category — sofa != loveseat,
even though both are "seating". So the alias maps below must stay precise.
"""

from __future__ import annotations

from typing import Iterable


CANONICAL_ITEMS_BY_ROOM: dict[str, list[str]] = {
    "Living Room": [
        "sofa", "loveseat", "armchair", "recliner", "ottoman",
        "coffee table", "side table", "console table",
        "tv unit", "bookshelf", "display cabinet", "storage chest",
        "indoor plant", "vase", "picture frame", "wall art",
        "decorative cushion", "curtain", "rug",
        "television", "soundbar", "air conditioner",
        "floor lamp", "table lamp", "ceiling fan",
    ],
    "Bedroom": [
        "bed frame", "mattress", "pillow", "bolster",
        "bedsheet", "duvet", "bedside table",
        "wardrobe", "chest of drawers", "under-bed storage",
        "shoe rack", "dressing table", "study desk", "study chair",
        "reading chair", "vanity mirror", "curtain", "bedside lamp",
        "wall art", "indoor plant", "rug", "wall clock",
        "air conditioner", "ceiling fan",
    ],
    "Kitchen": [
        "refrigerator", "microwave", "mixer-grinder", "gas stove", "induction",
        "chimney", "dishwasher", "water purifier", "electric kettle", "toaster",
        "kitchen cabinet", "kitchen counter", "breakfast counter", "bar stool",
        "pantry unit", "spice rack", "knife block", "pot rack",
        "pressure cooker", "non-stick pan", "kadhai",
        "cutting board", "mixing bowl", "ladle", "spatula",
    ],
    "Drawing Room": [
        "sofa", "armchair", "chaise lounge", "ottoman",
        "coffee table", "corner table", "console table",
        "bar cart", "curio cabinet", "wall shelf", "gallery wall",
        "showpiece", "vase", "indoor plant", "floor lamp",
        "scented candle", "curtain", "area rug",
        "television", "projector", "music system",
    ],
    "Dining Room": [
        "dining table", "dining chair", "bench",
        "crockery cabinet", "sideboard", "high chair",
        "table runner", "centrepiece", "candle holder",
        "placemat", "napkin ring", "condiment set",
        "crockery shelf", "cutlery organizer", "wine rack", "buffet table",
        "pendant light", "chandelier", "wall art", "mirror",
        "indoor plant", "curtain", "area rug",
    ],
    "Balcony": [
        "bistro table", "bistro chair", "rocking chair", "swing",
        "floor cushion", "folding chair", "hammock",
        "potted plant", "hanging planter", "vertical garden", "plant stand",
        "herb planter", "watering can", "garden tool", "outdoor storage",
        "shoe rack", "clothes drying stand",
        "fairy light", "lantern", "wind chime",
        "outdoor rug", "privacy screen",
    ],
}


ROOM_ALIASES: dict[str, str] = {
    "living": "Living Room",
    "living room": "Living Room",
    "livingroom": "Living Room",
    "lounge": "Living Room",
    "family room": "Living Room",
    "bedroom": "Bedroom",
    "master bedroom": "Bedroom",
    "guest bedroom": "Bedroom",
    "kids bedroom": "Bedroom",
    "kids room": "Bedroom",
    "kitchen": "Kitchen",
    "modular kitchen": "Kitchen",
    "drawing": "Drawing Room",
    "drawing room": "Drawing Room",
    "formal living": "Drawing Room",
    "dining": "Dining Room",
    "dining room": "Dining Room",
    "balcony": "Balcony",
    "outdoor": "Balcony",
    "patio": "Balcony",
    "study": "Bedroom",
    "home office": "Bedroom",
    "office": "Bedroom",
}


CATEGORY_ALIASES: dict[str, str] = {
    "couch": "sofa",
    "settee": "sofa",
    "3-seater sofa": "sofa",
    "2-seater sofa": "sofa",
    "sectional": "sofa",
    "love seat": "loveseat",
    "easy chair": "armchair",
    "accent chair": "armchair",
    "pouf": "ottoman",
    "pouffe": "ottoman",
    "footstool": "ottoman",
    "centre table": "coffee table",
    "center table": "coffee table",
    "end table": "side table",
    "nest of tables": "side table",
    "media unit": "tv unit",
    "media cabinet": "tv unit",
    "tv stand": "tv unit",
    "bookcase": "bookshelf",
    "showcase": "display cabinet",
    "trunk": "storage chest",
    "drape": "curtain",
    "drapes": "curtain",
    "blind": "curtain",
    "carpet": "rug",
    "tv": "television",
    "home theatre": "soundbar",
    "home theater": "soundbar",
    "ac": "air conditioner",
    "fan": "ceiling fan",
    "bed": "bed frame",
    "double bed": "bed frame",
    "king bed": "bed frame",
    "queen bed": "bed frame",
    "single bed": "bed frame",
    "almirah": "wardrobe",
    "closet": "wardrobe",
    "drawer chest": "chest of drawers",
    "dresser": "dressing table",
    "study table": "study desk",
    "office chair": "study chair",
    "lamp": "table lamp",
    "fridge": "refrigerator",
    "otg": "microwave",
    "mixie": "mixer-grinder",
    "stove": "gas stove",
    "exhaust fan": "chimney",
    "ro purifier": "water purifier",
    "kettle": "electric kettle",
    "cabinet": "kitchen cabinet",
    "slab": "kitchen counter",
    "island": "breakfast counter",
    "barstool": "bar stool",
    "wok": "kadhai",
    "dining set": "dining table",
    "4 seater dining": "dining table",
    "6 seater dining": "dining table",
    "8 seater dining": "dining table",
    "chair": "dining chair",
    "hutch": "crockery cabinet",
    "buffet": "buffet table",
    "swing chair": "swing",
    "jhula": "swing",
    "string light": "fairy light",
    "string lights": "fairy light",
}


def normalize_room(raw: str | None) -> str:
    if not raw:
        return "Living Room"
    key = raw.strip().lower().replace("_", " ")
    return ROOM_ALIASES.get(key, raw.strip().title())


def normalize_category(raw: str | None, fallback: str = "decor") -> str:
    if not raw:
        return fallback
    key = raw.strip().lower().replace("_", " ")
    if key in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[key]
    for room_items in CANONICAL_ITEMS_BY_ROOM.values():
        if key in room_items:
            return key
    return key or fallback


def all_canonical_items() -> set[str]:
    seen: set[str] = set()
    for items in CANONICAL_ITEMS_BY_ROOM.values():
        seen.update(items)
    return seen


def canonical_pairs() -> Iterable[tuple[str, str]]:
    for room, items in CANONICAL_ITEMS_BY_ROOM.items():
        for item in items:
            yield room, item
