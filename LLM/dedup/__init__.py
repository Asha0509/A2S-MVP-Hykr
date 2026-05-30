from .normalizer import (
    normalize_name, normalize_brand, normalize_color, normalize_material,
    expand_abbreviations, strip_platform_suffixes, tokenize, jaccard,
    extract_model_tokens, parse_dimension_numbers, phash_distance,
)
from .signals import evaluate_signals, HARD_BLOCKERS
from .engine import DedupEngine, MatchResult

__all__ = [
    "DedupEngine", "MatchResult",
    "evaluate_signals", "HARD_BLOCKERS",
    "normalize_name", "normalize_brand", "normalize_color", "normalize_material",
    "tokenize", "jaccard",
]
