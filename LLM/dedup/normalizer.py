"""
Normalization layer for the A2S product deduplication engine.

All functions are pure — no side effects, no I/O, no global mutable state.
Used to produce stable comparison keys before signal evaluation.
"""

import re
from typing import Callable, Optional, Union

__all__ = [
    "normalize_name",
    "normalize_brand",
    "normalize_color",
    "normalize_material",
    "expand_abbreviations",
    "strip_platform_suffixes",
    "tokenize",
    "jaccard",
    "extract_model_tokens",
    "parse_dimension_numbers",
    "phash_distance",
]

# ---------------------------------------------------------------------------
# Internal constants
# ---------------------------------------------------------------------------

_STOP_WORDS: frozenset[str] = frozenset({
    "a", "an", "the", "and", "or", "for", "with", "of", "in", "by",
    "to", "set", "pack", "pair", "combo",
})

# Canonical brand spellings: every alias → canonical form
_BRAND_ALIASES: dict[str, str] = {
    "amazon basics": "amazon basics",
    "amazonbasics": "amazon basics",
    "urban ladder": "urban ladder",
    "urbanladder": "urban ladder",
    "wooden street": "wooden street",
    "woodenstreet": "wooden street",
    "home lane": "home lane",
    "homelane": "home lane",
    "nilkamal": "nilkamal",
    "pepperfry": "pepperfry",
    "ikea": "ikea",
    "royaloak": "royaloak",
    "royal oak": "royaloak",
    "wakefit": "wakefit",
    "godrej": "godrej",
    "godrej interio": "godrej interio",
    "sleepyhead": "sleepyhead",
    "springtek": "springtek",
    "duroflex": "duroflex",
    "furny": "furny",
    "zuari": "zuari",
    "fabindia": "fabindia",
    "solimo": "solimo",
    "philips": "philips",
    "havells": "havells",
    "syska": "syska",
    "wipro": "wipro",
    "crompton": "crompton",
    "asian paints": "asian paints",
    "berger": "berger",
    "nerolac": "nerolac",
    "hometown": "hometown",
    "crosscut": "crosscut",
    "kurl-on": "kurl-on",
    "kurlon": "kurl-on",
    "centuary": "centuary",
    "exclusivelane": "exclusivelane",
    "exclusive lane": "exclusivelane",
    "art street": "art street",
}

# Color family mappings: each token/phrase → family
_COLOR_FAMILIES: dict[str, str] = {
    # black
    "black": "black",
    "jet": "black",
    "ebony": "black",
    "onyx": "black",
    # white / near-white
    "white": "white",
    "off-white": "white",
    "off white": "white",
    "cream": "white",
    "ivory": "white",
    "beige": "white",
    "eggshell": "white",
    # grey
    "grey": "grey",
    "gray": "grey",
    "charcoal": "grey",
    "slate": "grey",
    "gunmetal": "grey",
    "ash": "grey",
    "silver": "silver",
    # brown
    "brown": "brown",
    "dark brown": "brown",
    "walnut brown": "brown",
    "walnut": "brown",
    "mahogany": "brown",
    "teak": "brown",
    "chocolate": "brown",
    "chestnut": "brown",
    "cognac": "brown",
    "tan": "brown",
    "caramel": "brown",
    "russet": "brown",
    # blue
    "blue": "blue",
    "navy": "blue",
    "cobalt": "blue",
    "azure": "blue",
    "teal": "blue",
    "turquoise": "blue",
    "indigo": "blue",
    "denim": "blue",
    # green
    "green": "green",
    "emerald": "green",
    "olive": "green",
    "sage": "green",
    "mint": "green",
    "forest": "green",
    # red
    "red": "red",
    "crimson": "red",
    "burgundy": "red",
    "maroon": "red",
    "scarlet": "red",
    "wine": "red",
    # yellow
    "yellow": "yellow",
    "mustard": "yellow",
    "lemon": "yellow",
    # orange
    "orange": "orange",
    "rust": "orange",
    "terracotta": "orange",
    "terra": "orange",
    "amber": "orange",
    "copper": "orange",
    # pink
    "pink": "pink",
    "rose": "pink",
    "blush": "pink",
    "dusty pink": "pink",
    "mauve": "pink",
    "salmon": "pink",
    "coral": "pink",
    # purple
    "purple": "purple",
    "violet": "purple",
    "lavender": "purple",
    "lilac": "purple",
    "plum": "purple",
    # gold
    "gold": "gold",
    "golden": "gold",
    "brass": "gold",
    "champagne": "gold",
    # silver
    "chrome": "silver",
    "steel": "silver",
    "platinum": "silver",
    # multi
    "multicolor": "multi",
    "multi": "multi",
    "multicolour": "multi",
    "multi-color": "multi",
    "multi color": "multi",
}

# Material family mappings: token/phrase → family
_MATERIAL_FAMILIES: dict[str, str] = {
    # wood
    "wood": "wood",
    "solid wood": "wood",
    "solid sheesham": "wood",
    "sheesham": "wood",
    "hardwood": "wood",
    "teak": "wood",
    "teak wood": "wood",
    "mango wood": "wood",
    "mango": "wood",
    "pine": "wood",
    "pine wood": "wood",
    "oak": "wood",
    "walnut": "wood",
    "acacia": "wood",
    "bamboo": "wood",
    "rubber wood": "wood",
    "rubberwood": "wood",
    "engineered wood": "wood",
    "mdf": "wood",
    "plywood": "wood",
    "particle board": "wood",
    "particleboard": "wood",
    "chipboard": "wood",
    "block board": "wood",
    "blockboard": "wood",
    "veneer": "wood",
    "laminated wood": "wood",
    # metal
    "metal": "metal",
    "steel": "metal",
    "stainless steel": "metal",
    "mild steel": "metal",
    "iron": "metal",
    "wrought iron": "metal",
    "aluminum": "metal",
    "aluminium": "metal",
    "brass": "metal",
    "chrome": "metal",
    "zinc": "metal",
    "cast iron": "metal",
    # leather
    "leather": "leather",
    "genuine leather": "leather",
    "real leather": "leather",
    "pu leather": "leather",
    "faux leather": "leather",
    "leatherette": "leather",
    "vegan leather": "leather",
    "bonded leather": "leather",
    # fabric
    "fabric": "fabric",
    "cotton": "fabric",
    "linen": "fabric",
    "velvet": "fabric",
    "polyester": "fabric",
    "microfiber": "fabric",
    "microfibre": "fabric",
    "chenille": "fabric",
    "jute": "fabric",
    "wool": "fabric",
    "canvas": "fabric",
    "nylon": "fabric",
    "suede": "fabric",
    "jacquard": "fabric",
    # stone
    "marble": "stone",
    "granite": "stone",
    "stone": "stone",
    "quartz": "stone",
    "travertine": "stone",
    "slate": "stone",
    # glass
    "glass": "glass",
    "tempered glass": "glass",
    "frosted glass": "glass",
    "toughened glass": "glass",
    # plastic
    "plastic": "plastic",
    "abs": "plastic",
    "abs plastic": "plastic",
    "polypropylene": "plastic",
    "pp": "plastic",
    "hdpe": "plastic",
    "pvc": "plastic",
    "acrylic": "plastic",
    "resin": "plastic",
    "fiber": "plastic",
    "fibre": "plastic",
    "fiberglass": "plastic",
}

# Abbreviation expansions: exact lowercase token/phrase → replacement
_ABBREVIATIONS: list[tuple[str, Union[str, Callable]]] = [
    # Seater shorthands — must be word-boundary anchored patterns (applied via regex)
    (r"\b([2-9])s\b", lambda m: f"{m.group(1)} seater"),
    (r"\bl[-\s]?shape[d]?\b", "l shaped"),
    (r"\bw/\b", "with"),
    (r"\bmdf\b", "wood"),
    (r"\bss\b", "stainless steel"),
    (r"\bpu\b", "pu leather"),
]

# Platform suffix patterns to strip from product names
_PLATFORM_SUFFIX_PATTERNS: list[str] = [
    r"\|\s*amazon\s+brand\b.*",
    r"\|\s*sponsored\b.*",
    r"\(amazon\s+brand\)",
    r"\[exclusive\]",
    r"\[flipkart\s+assured\]",
    r"\(flipkart\s+assured\)",
    r"\|\s*flipkart\s+smartbuy\b.*",
    r"\|\s*brand\b.*",
    # "Pack of N", "Set of N", "Combo of N" — remove the prefix but keep N
    r"\bpack\s+of\s+(\d+)\b",
    r"\bset\s+of\s+(\d+)\b",
    r"\bcombo\s+of\s+(\d+)\b",
]

# Dash-tagline: " - <5+ word suffix>" → strip from the dash onward
_DASH_TAGLINE_RE = re.compile(
    r"\s*[-–—]\s+(?:[A-Za-z0-9,\.]+\s+){5,}[A-Za-z0-9,\.]*$",
    re.IGNORECASE,
)

# Model-number token: alphanumeric, ≥3 chars, at least one digit
_MODEL_TOKEN_RE = re.compile(r"^(?=[A-Za-z0-9\-]*\d)[A-Za-z0-9\-]{3,}$")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def normalize_name(text: str) -> str:
    """
    Lowercase, strip_platform_suffixes, expand_abbreviations, remove stop words,
    collapse whitespace. Returns stable dedup key.
    Stop words: a, an, the, and, or, for, with, of, in, by, to, set, pack, pair, combo
    """
    if not text:
        return ""
    text = strip_platform_suffixes(text)
    text = text.lower()
    text = expand_abbreviations(text)
    tokens = text.split()
    tokens = [t for t in tokens if t not in _STOP_WORDS]
    return " ".join(tokens).strip()


def normalize_brand(brand: str) -> str:
    """
    Normalize brand to canonical form. Examples:
    "amazon basics" / "amazonbasics" / "Amazon Basics" → "amazon basics"
    "urban ladder" / "urbanladder" → "urban ladder"
    "ikea" / "IKEA" → "ikea"
    Strip "brand" suffix if present. Lowercase. Strip whitespace.
    """
    if not brand:
        return ""
    normalized = brand.lower().strip()
    # Strip trailing " brand" suffix
    normalized = re.sub(r"\s*\bbrand\b\s*$", "", normalized).strip()
    # Collapse multiple spaces
    normalized = re.sub(r"\s+", " ", normalized)
    # Lookup canonical alias
    return _BRAND_ALIASES.get(normalized, normalized)


def normalize_color(color: str) -> str:
    """
    Map color string to its color family. Examples:
    "walnut brown" / "dark brown" / "mahogany" → "brown"
    "off-white" / "cream" / "ivory" / "beige" → "white"
    "charcoal" / "slate" / "gunmetal" → "grey"
    "gold" / "brass" / "champagne" → "gold"
    Returns lowercase family name. If no match, return lowercase(color).
    Families: black, white, grey, brown, blue, green, red, yellow, orange, pink, purple, gold, silver, multi
    """
    if not color:
        return ""
    key = color.lower().strip()
    # Try exact match first (handles multi-word phrases like "dark brown")
    if key in _COLOR_FAMILIES:
        return _COLOR_FAMILIES[key]
    # Try token-by-token match (left to right, first wins)
    for token in key.split():
        if token in _COLOR_FAMILIES:
            return _COLOR_FAMILIES[token]
    return key


def normalize_material(material: str) -> str:
    """
    Map material string to its material family. Examples:
    "solid sheesham" / "teak" / "mango wood" / "MDF" / "plywood" → "wood"
    "stainless steel" / "mild steel" / "iron" → "metal"
    "genuine leather" / "PU leather" / "leatherette" → "leather"
    "cotton" / "linen" / "velvet" / "polyester" → "fabric"
    "marble" / "granite" / "stone" → "stone"
    "glass" → "glass"
    "plastic" / "ABS" / "polypropylene" → "plastic"
    Returns lowercase family name. If no match, return lowercase(material).
    """
    if not material:
        return ""
    key = material.lower().strip()
    # Exact match on full phrase first (handles "solid sheesham", "stainless steel", etc.)
    if key in _MATERIAL_FAMILIES:
        return _MATERIAL_FAMILIES[key]
    # Try progressively shorter n-gram suffixes (longest phrase wins)
    words = key.split()
    for length in range(len(words), 0, -1):
        for start in range(len(words) - length + 1):
            phrase = " ".join(words[start : start + length])
            if phrase in _MATERIAL_FAMILIES:
                return _MATERIAL_FAMILIES[phrase]
    return key


def expand_abbreviations(text: str) -> str:
    """
    Expand known abbreviations before tokenizing. Examples:
    "3s" → "3 seater", "2s" → "2 seater", "4s" → "4 seater"
    "mdf" → "wood", "ss" → "stainless steel", "pu" → "pu leather"
    "l-shape" / "l shape" → "l shaped"
    "w/" → "with"
    Apply case-insensitively, return lowercased result.
    """
    if not text:
        return ""
    result = text.lower()
    for pattern, replacement in _ABBREVIATIONS:
        if callable(replacement):
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        else:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result


def strip_platform_suffixes(text: str) -> str:
    """
    Remove platform-injected junk from product names. Strip:
    - "| Amazon Brand", "| Sponsored", "(Amazon Brand)"
    - "[Exclusive]", "[Flipkart Assured]"
    - "Pack of N", "Set of N", "Combo of N" (keep the N as a separate token)
    - " - <anything after a dash that looks like a tagline>" if > 5 words after the dash
    Strip trailing whitespace, punctuation. Return cleaned string.
    """
    if not text:
        return ""
    result = text

    # Strip dash taglines before other patterns so we don't double-process
    result = _DASH_TAGLINE_RE.sub("", result)

    # Apply platform suffix patterns
    for pattern in _PLATFORM_SUFFIX_PATTERNS:
        # "Pack of N" / "Set of N" / "Combo of N" — replace with the number only
        if r"(\d+)" in pattern:
            result = re.sub(pattern, r"\1", result, flags=re.IGNORECASE)
        else:
            result = re.sub(pattern, "", result, flags=re.IGNORECASE)

    # Strip trailing punctuation and whitespace
    result = result.strip(" \t\n\r-–—|,.")
    # Collapse internal runs of whitespace
    result = re.sub(r"\s+", " ", result).strip()
    return result


def tokenize(text: str) -> frozenset[str]:
    """
    Split normalized text into a set of tokens.
    1. Call normalize_name(text) first
    2. Split on whitespace
    3. Remove tokens shorter than 3 chars
    4. Remove numeric-only tokens (dimensions like "160", "200")
    5. Return as frozenset for hashing
    """
    if not text:
        return frozenset()
    normalized = normalize_name(text)
    tokens = normalized.split()
    tokens = [t for t in tokens if len(t) >= 3 and not t.isdigit()]
    return frozenset(tokens)


def jaccard(a: set, b: set) -> float:
    """Jaccard similarity: |intersection| / |union|. Returns 0.0 if both empty."""
    if not a and not b:
        return 0.0
    intersection = len(a & b)
    union = len(a | b)
    if union == 0:
        return 0.0
    return intersection / union


def extract_model_tokens(text: str) -> set[str]:
    """
    Extract tokens that look like model numbers: alphanumeric, ≥3 chars, must contain at least one digit.
    Examples: "GX-450", "RT4560", "ERF-2200", "1000S"
    Returns set of uppercase model token strings.
    """
    if not text:
        return set()
    # Split on whitespace and common separators, keeping hyphenated tokens intact
    raw_tokens = re.split(r"[\s,;/\\()\[\]{}|]+", text)
    result: set[str] = set()
    for token in raw_tokens:
        token = token.strip(".,!?\"'")
        if _MODEL_TOKEN_RE.match(token):
            result.add(token.upper())
    return result


def parse_dimension_numbers(raw: str) -> list[float]:
    """
    Parse dimension string into list of floats [W, D, H] (whatever is present).
    Handles: "322x98x48", "160 x 200 cm", "33x38x33 cm", "60 cm"
    Strip "cm", "mm", "in", replace "x"/"*" with space, parse numbers.
    Returns list of up to 3 floats.
    """
    if not raw:
        return []
    # Strip unit suffixes
    cleaned = re.sub(r"\b(cm|mm|in|inch|inches|m)\b", " ", str(raw), flags=re.IGNORECASE)
    # Replace dimension separators with space
    cleaned = re.sub(r"[x*×]", " ", cleaned, flags=re.IGNORECASE)
    numbers = re.findall(r"\d+(?:\.\d+)?", cleaned)
    result = [float(n) for n in numbers[:3]]
    return result


def phash_distance(hash1: Optional[str], hash2: Optional[str]) -> Optional[int]:
    """
    Compute Hamming distance between two pHash hex strings.
    Returns None if either hash is None or empty.
    Uses imagehash library: imagehash.hex_to_hash(hash1) - imagehash.hex_to_hash(hash2)
    Wrap in try/except — return None on any error.
    """
    if not hash1 or not hash2:
        return None
    try:
        import imagehash
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        return h1 - h2
    except Exception:
        return None
