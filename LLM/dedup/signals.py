"""
signals.py — Signal evaluation layer for the A2S product deduplication engine.

Compares two scraped product dicts across 27 independent signals spanning
identity, text, visual, and enrichment dimensions. Each signal returns a
SignalResult with a weighted score contribution.

Usage:
    from .signals import evaluate_signals

    result = evaluate_signals(product_a, product_b)
    # result["total_score"] >= 0.75 → likely duplicate
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

from .normalizer import (
    normalize_name,
    normalize_brand,
    normalize_color,
    normalize_material,
    tokenize,
    jaccard,
    extract_model_tokens,
    parse_dimension_numbers,
    phash_distance,
)

__all__ = ["evaluate_signals", "HARD_BLOCKERS", "ALL_SIGNALS", "SignalResult"]

# ---------------------------------------------------------------------------
# SignalResult dataclass
# ---------------------------------------------------------------------------


@dataclass
class SignalResult:
    """Holds the outcome of a single signal evaluation."""

    signal_id: str          # e.g. "S01"
    name: str               # e.g. "brand_exact"
    score: float            # contribution to confidence (0.0 to 0.30)
    fired: bool             # True if this signal produced a non-zero score
    is_blocker: bool        # True if this signal alone can force a DIFFERENT verdict
    blocker_triggered: bool # True if is_blocker AND the hard-mismatch condition fired
    note: str               # human-readable explanation of why score was assigned


# ---------------------------------------------------------------------------
# Helper utilities (module-private)
# ---------------------------------------------------------------------------

def _safe_str(value) -> str:
    """Return a stripped lowercase string, or empty string if value is falsy."""
    if value is None:
        return ""
    return str(value).strip().lower()


def _safe_int(value):
    """Return an integer, or None if value cannot be parsed."""
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _safe_float(value):
    """Return a float, or None if value cannot be parsed."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _safe_list(value) -> list:
    """Return a list, or empty list if value is falsy or not iterable."""
    if not value:
        return []
    if isinstance(value, list):
        return value
    return []


# ---------------------------------------------------------------------------
# Identity Group — hard blockers + provenance
# ---------------------------------------------------------------------------


def s01_brand_exact(p1: dict, p2: dict) -> SignalResult:
    """
    Normalized brand comparison.
    Both present and different → hard blocker.
    Both present and same → +0.30.
    Either missing → neutral (0.0, no block).
    """
    b1 = normalize_brand(p1.get("brand") or "")
    b2 = normalize_brand(p2.get("brand") or "")

    if not b1 or not b2:
        return SignalResult(
            signal_id="S01",
            name="brand_exact",
            score=0.0,
            fired=False,
            is_blocker=True,
            blocker_triggered=False,
            note="One or both brands missing — signal skipped.",
        )

    if b1 == b2:
        return SignalResult(
            signal_id="S01",
            name="brand_exact",
            score=0.30,
            fired=True,
            is_blocker=True,
            blocker_triggered=False,
            note=f"Brands match: '{b1}'.",
        )

    return SignalResult(
        signal_id="S01",
        name="brand_exact",
        score=0.0,
        fired=False,
        is_blocker=True,
        blocker_triggered=True,
        note=f"Brand mismatch: '{b1}' vs '{b2}' — hard blocker triggered.",
    )


def s02_category_exact(p1: dict, p2: dict) -> SignalResult:
    """
    Lowercase category comparison.
    Same → +0.20. Different (both present) → hard blocker.
    """
    c1 = _safe_str(p1.get("category"))
    c2 = _safe_str(p2.get("category"))

    if not c1 or not c2:
        return SignalResult(
            signal_id="S02",
            name="category_exact",
            score=0.0,
            fired=False,
            is_blocker=True,
            blocker_triggered=False,
            note="One or both categories missing — signal skipped.",
        )

    if c1 == c2:
        return SignalResult(
            signal_id="S02",
            name="category_exact",
            score=0.20,
            fired=True,
            is_blocker=True,
            blocker_triggered=False,
            note=f"Categories match: '{c1}'.",
        )

    return SignalResult(
        signal_id="S02",
        name="category_exact",
        score=0.0,
        fired=False,
        is_blocker=True,
        blocker_triggered=True,
        note=f"Category mismatch: '{c1}' vs '{c2}' — hard blocker triggered.",
    )


def s03_seater_count(p1: dict, p2: dict) -> SignalResult:
    """
    Seater count comparison.
    Same → +0.12. Different (both present) → hard blocker.
    Either missing → neutral (field is often absent).
    """
    sc1 = _safe_int(p1.get("seater_count"))
    sc2 = _safe_int(p2.get("seater_count"))

    if sc1 is None or sc2 is None:
        return SignalResult(
            signal_id="S03",
            name="seater_count",
            score=0.0,
            fired=False,
            is_blocker=True,
            blocker_triggered=False,
            note="One or both seater counts missing — signal skipped.",
        )

    if sc1 == sc2:
        return SignalResult(
            signal_id="S03",
            name="seater_count",
            score=0.12,
            fired=True,
            is_blocker=True,
            blocker_triggered=False,
            note=f"Seater counts match: {sc1}.",
        )

    return SignalResult(
        signal_id="S03",
        name="seater_count",
        score=0.0,
        fired=False,
        is_blocker=True,
        blocker_triggered=True,
        note=f"Seater count mismatch: {sc1} vs {sc2} — hard blocker triggered.",
    )


def s04_piece_count(p1: dict, p2: dict) -> SignalResult:
    """
    Piece count comparison.
    Same → +0.10. Different (both present) → hard blocker.
    Either missing → neutral.
    """
    pc1 = _safe_int(p1.get("piece_count"))
    pc2 = _safe_int(p2.get("piece_count"))

    if pc1 is None or pc2 is None:
        return SignalResult(
            signal_id="S04",
            name="piece_count",
            score=0.0,
            fired=False,
            is_blocker=True,
            blocker_triggered=False,
            note="One or both piece counts missing — signal skipped.",
        )

    if pc1 == pc2:
        return SignalResult(
            signal_id="S04",
            name="piece_count",
            score=0.10,
            fired=True,
            is_blocker=True,
            blocker_triggered=False,
            note=f"Piece counts match: {pc1}.",
        )

    return SignalResult(
        signal_id="S04",
        name="piece_count",
        score=0.0,
        fired=False,
        is_blocker=True,
        blocker_triggered=True,
        note=f"Piece count mismatch: {pc1} vs {pc2} — hard blocker triggered.",
    )


def s05_source_url(p1: dict, p2: dict) -> SignalResult:
    """
    Exact source URL match → authoritative duplicate proof (SHORT_CIRCUIT).
    Score = 1.0 with SHORT_CIRCUIT note.
    """
    u1 = (p1.get("source_url") or "").strip()
    u2 = (p2.get("source_url") or "").strip()

    if not u1 or not u2:
        return SignalResult(
            signal_id="S05",
            name="source_url",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both source URLs missing — signal skipped.",
        )

    if u1 == u2:
        return SignalResult(
            signal_id="S05",
            name="source_url",
            score=1.0,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note="SHORT_CIRCUIT: source URLs are identical — definitive duplicate.",
        )

    return SignalResult(
        signal_id="S05",
        name="source_url",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note="Source URLs differ.",
    )


def s06_model_number(p1: dict, p2: dict) -> SignalResult:
    """
    Extract model tokens from both product names.
    Non-empty intersection → +0.25 (strong provenance signal).
    """
    tokens1 = extract_model_tokens(p1.get("name") or "")
    tokens2 = extract_model_tokens(p2.get("name") or "")

    if not tokens1 or not tokens2:
        return SignalResult(
            signal_id="S06",
            name="model_number",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="No model tokens found in one or both product names.",
        )

    intersection = set(tokens1) & set(tokens2)
    if intersection:
        return SignalResult(
            signal_id="S06",
            name="model_number",
            score=0.25,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Model tokens overlap: {sorted(intersection)}.",
        )

    return SignalResult(
        signal_id="S06",
        name="model_number",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Model tokens do not overlap: {sorted(tokens1)} vs {sorted(tokens2)}.",
    )


# ---------------------------------------------------------------------------
# Text Group
# ---------------------------------------------------------------------------


def s07_name_token_jaccard(p1: dict, p2: dict) -> SignalResult:
    """
    Jaccard similarity of tokenized, normalized names × 0.25.
    """
    n1 = normalize_name(p1.get("name") or "")
    n2 = normalize_name(p2.get("name") or "")

    if not n1 or not n2:
        return SignalResult(
            signal_id="S07",
            name="name_token_jaccard",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both product names missing.",
        )

    t1 = set(tokenize(n1))
    t2 = set(tokenize(n2))

    if not t1 and not t2:
        return SignalResult(
            signal_id="S07",
            name="name_token_jaccard",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="Token sets are empty after normalization.",
        )

    j = jaccard(t1, t2)
    score = round(j * 0.25, 6)

    return SignalResult(
        signal_id="S07",
        name="name_token_jaccard",
        score=score,
        fired=score > 0.0,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Name Jaccard={j:.4f}, score={score:.4f}.",
    )


def s08_name_exact(p1: dict, p2: dict) -> SignalResult:
    """
    Exact match on normalized names → +0.30.
    """
    n1 = normalize_name(p1.get("name") or "")
    n2 = normalize_name(p2.get("name") or "")

    if not n1 or not n2:
        return SignalResult(
            signal_id="S08",
            name="name_exact",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both product names missing.",
        )

    if n1 == n2:
        return SignalResult(
            signal_id="S08",
            name="name_exact",
            score=0.30,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Normalized names match exactly: '{n1[:80]}'.",
        )

    return SignalResult(
        signal_id="S08",
        name="name_exact",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note="Normalized names differ.",
    )


# Significant keywords that anchor product type identity in Indian home furniture
_SIGNIFICANT_KEYWORDS = {
    "sofa", "chair", "table", "bed", "wardrobe", "shelf", "lamp",
    "rug", "curtain", "mirror", "cabinet", "drawer", "tv", "desk",
    "bench", "stool", "ottoman", "sideboard",
}


def s09_keyword_overlap(p1: dict, p2: dict) -> SignalResult:
    """
    Overlap of significant furniture keywords found in both names.
    match_fraction × 0.10.
    """
    n1 = _safe_str(p1.get("name"))
    n2 = _safe_str(p2.get("name"))

    if not n1 or not n2:
        return SignalResult(
            signal_id="S09",
            name="keyword_overlap",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both product names missing.",
        )

    words1 = set(tokenize(n1))
    words2 = set(tokenize(n2))

    in1 = _SIGNIFICANT_KEYWORDS & words1
    in2 = _SIGNIFICANT_KEYWORDS & words2
    common = in1 & in2
    universe = in1 | in2

    if not universe:
        return SignalResult(
            signal_id="S09",
            name="keyword_overlap",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="No significant keywords found in either name.",
        )

    fraction = len(common) / len(universe)
    score = round(fraction * 0.10, 6)

    return SignalResult(
        signal_id="S09",
        name="keyword_overlap",
        score=score,
        fired=score > 0.0,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Keyword overlap: {sorted(common)} out of {sorted(universe)}, fraction={fraction:.3f}.",
    )


def s10_color_family(p1: dict, p2: dict) -> SignalResult:
    """
    Normalized color family comparison → +0.10 if same family.
    """
    c1 = normalize_color(p1.get("color") or p1.get("color_family") or "")
    c2 = normalize_color(p2.get("color") or p2.get("color_family") or "")

    if not c1 or not c2:
        return SignalResult(
            signal_id="S10",
            name="color_family",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both color values missing.",
        )

    if c1 == c2:
        return SignalResult(
            signal_id="S10",
            name="color_family",
            score=0.10,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Color families match: '{c1}'.",
        )

    return SignalResult(
        signal_id="S10",
        name="color_family",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Color families differ: '{c1}' vs '{c2}'.",
    )


def s11_color_exact(p1: dict, p2: dict) -> SignalResult:
    """
    Exact lowercase raw color match → +0.05.
    """
    c1 = _safe_str(p1.get("color"))
    c2 = _safe_str(p2.get("color"))

    if not c1 or not c2:
        return SignalResult(
            signal_id="S11",
            name="color_exact",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both raw colors missing.",
        )

    if c1 == c2:
        return SignalResult(
            signal_id="S11",
            name="color_exact",
            score=0.05,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Raw colors match exactly: '{c1}'.",
        )

    return SignalResult(
        signal_id="S11",
        name="color_exact",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Raw colors differ: '{c1}' vs '{c2}'.",
    )


def s12_material_family(p1: dict, p2: dict) -> SignalResult:
    """
    Normalized material family comparison → +0.08 if same family.
    """
    m1 = normalize_material(p1.get("material") or p1.get("material_family") or "")
    m2 = normalize_material(p2.get("material") or p2.get("material_family") or "")

    if not m1 or not m2:
        return SignalResult(
            signal_id="S12",
            name="material_family",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both material values missing.",
        )

    if m1 == m2:
        return SignalResult(
            signal_id="S12",
            name="material_family",
            score=0.08,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Material families match: '{m1}'.",
        )

    return SignalResult(
        signal_id="S12",
        name="material_family",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Material families differ: '{m1}' vs '{m2}'.",
    )


def s13_material_exact(p1: dict, p2: dict) -> SignalResult:
    """
    Exact lowercase raw material match → +0.04.
    """
    m1 = _safe_str(p1.get("material"))
    m2 = _safe_str(p2.get("material"))

    if not m1 or not m2:
        return SignalResult(
            signal_id="S13",
            name="material_exact",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both raw materials missing.",
        )

    if m1 == m2:
        return SignalResult(
            signal_id="S13",
            name="material_exact",
            score=0.04,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Raw materials match exactly: '{m1}'.",
        )

    return SignalResult(
        signal_id="S13",
        name="material_exact",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Raw materials differ: '{m1}' vs '{m2}'.",
    )


def s14_finish_type(p1: dict, p2: dict) -> SignalResult:
    """
    Lowercase finish_type comparison → +0.03 if same.
    """
    f1 = _safe_str(p1.get("finish_type"))
    f2 = _safe_str(p2.get("finish_type"))

    if not f1 or not f2:
        return SignalResult(
            signal_id="S14",
            name="finish_type",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both finish types missing.",
        )

    if f1 == f2:
        return SignalResult(
            signal_id="S14",
            name="finish_type",
            score=0.03,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Finish types match: '{f1}'.",
        )

    return SignalResult(
        signal_id="S14",
        name="finish_type",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Finish types differ: '{f1}' vs '{f2}'.",
    )


def s15_dimension_width(p1: dict, p2: dict) -> SignalResult:
    """
    Width (index 0 of parsed dimension numbers) — within 2.0 cm → +0.05.
    """
    d1 = parse_dimension_numbers(p1.get("dimensions") or "")
    d2 = parse_dimension_numbers(p2.get("dimensions") or "")

    if not d1 or not d2 or len(d1) < 1 or len(d2) < 1:
        return SignalResult(
            signal_id="S15",
            name="dimension_width",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="Width dimension not parseable from one or both products.",
        )

    w1, w2 = float(d1[0]), float(d2[0])
    diff = abs(w1 - w2)

    if diff <= 2.0:
        return SignalResult(
            signal_id="S15",
            name="dimension_width",
            score=0.05,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Widths within tolerance: {w1}cm vs {w2}cm (diff={diff:.2f}cm).",
        )

    return SignalResult(
        signal_id="S15",
        name="dimension_width",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Width difference exceeds tolerance: {w1}cm vs {w2}cm (diff={diff:.2f}cm).",
    )


def s16_dimension_height(p1: dict, p2: dict) -> SignalResult:
    """
    Height (index 2 of parsed dimension numbers) — within 2.0 cm → +0.03.
    """
    d1 = parse_dimension_numbers(p1.get("dimensions") or "")
    d2 = parse_dimension_numbers(p2.get("dimensions") or "")

    if not d1 or not d2 or len(d1) < 3 or len(d2) < 3:
        return SignalResult(
            signal_id="S16",
            name="dimension_height",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="Height dimension not parseable from one or both products.",
        )

    h1, h2 = float(d1[2]), float(d2[2])
    diff = abs(h1 - h2)

    if diff <= 2.0:
        return SignalResult(
            signal_id="S16",
            name="dimension_height",
            score=0.03,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Heights within tolerance: {h1}cm vs {h2}cm (diff={diff:.2f}cm).",
        )

    return SignalResult(
        signal_id="S16",
        name="dimension_height",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Height difference exceeds tolerance: {h1}cm vs {h2}cm (diff={diff:.2f}cm).",
    )


def s17_dimension_depth(p1: dict, p2: dict) -> SignalResult:
    """
    Depth (index 1 of parsed dimension numbers) — within 2.0 cm → +0.03.
    """
    d1 = parse_dimension_numbers(p1.get("dimensions") or "")
    d2 = parse_dimension_numbers(p2.get("dimensions") or "")

    if not d1 or not d2 or len(d1) < 2 or len(d2) < 2:
        return SignalResult(
            signal_id="S17",
            name="dimension_depth",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="Depth dimension not parseable from one or both products.",
        )

    dep1, dep2 = float(d1[1]), float(d2[1])
    diff = abs(dep1 - dep2)

    if diff <= 2.0:
        return SignalResult(
            signal_id="S17",
            name="dimension_depth",
            score=0.03,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Depths within tolerance: {dep1}cm vs {dep2}cm (diff={diff:.2f}cm).",
        )

    return SignalResult(
        signal_id="S17",
        name="dimension_depth",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Depth difference exceeds tolerance: {dep1}cm vs {dep2}cm (diff={diff:.2f}cm).",
    )


def s18_price_proximity(p1: dict, p2: dict) -> SignalResult:
    """
    Price gap percentage comparison.
    ≤10% → +0.05. ≤20% → +0.02. >20% → +0.00.
    Appends is_conflict_signal marker to note when gap > 15%.
    """
    pr1 = _safe_float(p1.get("price"))
    pr2 = _safe_float(p2.get("price"))

    if pr1 is None or pr2 is None or pr1 <= 0 or pr2 <= 0:
        return SignalResult(
            signal_id="S18",
            name="price_proximity",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both prices missing or zero — signal skipped.",
        )

    gap_pct = abs(pr1 - pr2) / max(pr1, pr2) * 100.0
    conflict_marker = " [is_conflict_signal]" if gap_pct > 15.0 else ""

    if gap_pct <= 10.0:
        return SignalResult(
            signal_id="S18",
            name="price_proximity",
            score=0.05,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Prices very close: ₹{pr1:.0f} vs ₹{pr2:.0f} (gap={gap_pct:.1f}%).{conflict_marker}",
        )

    if gap_pct <= 20.0:
        return SignalResult(
            signal_id="S18",
            name="price_proximity",
            score=0.02,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Prices moderately close: ₹{pr1:.0f} vs ₹{pr2:.0f} (gap={gap_pct:.1f}%).{conflict_marker}",
        )

    return SignalResult(
        signal_id="S18",
        name="price_proximity",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Price gap too large: ₹{pr1:.0f} vs ₹{pr2:.0f} (gap={gap_pct:.1f}%).{conflict_marker}",
    )


def s19_description_overlap(p1: dict, p2: dict) -> SignalResult:
    """
    Jaccard similarity of tokenized descriptions × 0.05.
    Falls back to 'description' key; also tries 'canonical_name' as a proxy.
    """
    desc1 = (
        p1.get("description") or p1.get("canonical_name") or p1.get("name") or ""
    )
    desc2 = (
        p2.get("description") or p2.get("canonical_name") or p2.get("name") or ""
    )

    t1 = set(tokenize(_safe_str(desc1)))
    t2 = set(tokenize(_safe_str(desc2)))

    if not t1 or not t2:
        return SignalResult(
            signal_id="S19",
            name="description_overlap",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="No description tokens available.",
        )

    j = jaccard(t1, t2)
    score = round(j * 0.05, 6)

    return SignalResult(
        signal_id="S19",
        name="description_overlap",
        score=score,
        fired=score > 0.0,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Description Jaccard={j:.4f}, score={score:.4f}.",
    )


# ---------------------------------------------------------------------------
# Visual Group
# ---------------------------------------------------------------------------


def s20_phash_distance(p1: dict, p2: dict) -> SignalResult:
    """
    Perceptual hash distance between product images.
    ≤10 → +0.20 (very similar). ≤20 → +0.10. >20 or missing → +0.00.
    """
    ph1 = p1.get("image_phash")
    ph2 = p2.get("image_phash")

    if not ph1 or not ph2:
        return SignalResult(
            signal_id="S20",
            name="phash_distance",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both image pHashes missing.",
        )

    try:
        dist = phash_distance(ph1, ph2)
    except Exception as exc:
        return SignalResult(
            signal_id="S20",
            name="phash_distance",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note=f"pHash computation failed: {exc}.",
        )

    if dist is None:
        return SignalResult(
            signal_id="S20",
            name="phash_distance",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="pHash distance returned None.",
        )

    if dist <= 10:
        return SignalResult(
            signal_id="S20",
            name="phash_distance",
            score=0.20,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Images very similar: pHash distance={dist}.",
        )

    if dist <= 20:
        return SignalResult(
            signal_id="S20",
            name="phash_distance",
            score=0.10,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Images moderately similar: pHash distance={dist}.",
        )

    return SignalResult(
        signal_id="S20",
        name="phash_distance",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Images too dissimilar: pHash distance={dist}.",
    )


def s21_dominant_color_overlap(p1: dict, p2: dict) -> SignalResult:
    """
    Intersection of dominant_colors lists (case-insensitive hex strings).
    len(intersection) / 3 × 0.05, capped at 0.05.
    """
    dc1 = {c.lower().strip() for c in _safe_list(p1.get("dominant_colors")) if c}
    dc2 = {c.lower().strip() for c in _safe_list(p2.get("dominant_colors")) if c}

    if not dc1 or not dc2:
        return SignalResult(
            signal_id="S21",
            name="dominant_color_overlap",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both dominant_colors lists missing or empty.",
        )

    intersection = dc1 & dc2
    raw_score = len(intersection) / 3.0 * 0.05
    score = round(min(raw_score, 0.05), 6)

    return SignalResult(
        signal_id="S21",
        name="dominant_color_overlap",
        score=score,
        fired=score > 0.0,
        is_blocker=False,
        blocker_triggered=False,
        note=(
            f"Dominant colors overlapping: {sorted(intersection)} "
            f"({len(intersection)} of max 3), score={score:.4f}."
        ),
    )


def s22_image_url_exact(p1: dict, p2: dict) -> SignalResult:
    """
    Exact image URL match (both present) → +0.15.
    Strong signal — same CDN URL almost certainly means same product image.
    """
    u1 = (p1.get("image_url") or "").strip()
    u2 = (p2.get("image_url") or "").strip()

    if not u1 or not u2:
        return SignalResult(
            signal_id="S22",
            name="image_url_exact",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both image URLs missing.",
        )

    if u1 == u2:
        return SignalResult(
            signal_id="S22",
            name="image_url_exact",
            score=0.15,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note="Image URLs are identical.",
        )

    return SignalResult(
        signal_id="S22",
        name="image_url_exact",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note="Image URLs differ.",
    )


# ---------------------------------------------------------------------------
# Enrichment Group
# ---------------------------------------------------------------------------


def s23_leg_material(p1: dict, p2: dict) -> SignalResult:
    """
    Normalized leg material comparison → +0.02 if same family.
    """
    lm1 = normalize_material(p1.get("leg_material") or "")
    lm2 = normalize_material(p2.get("leg_material") or "")

    if not lm1 or not lm2:
        return SignalResult(
            signal_id="S23",
            name="leg_material",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both leg material values missing.",
        )

    if lm1 == lm2:
        return SignalResult(
            signal_id="S23",
            name="leg_material",
            score=0.02,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Leg materials match: '{lm1}'.",
        )

    return SignalResult(
        signal_id="S23",
        name="leg_material",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Leg materials differ: '{lm1}' vs '{lm2}'.",
    )


def s24_warranty_months(p1: dict, p2: dict) -> SignalResult:
    """
    Exact warranty period match (integer months) → +0.02.
    """
    w1 = _safe_int(p1.get("warranty_months"))
    w2 = _safe_int(p2.get("warranty_months"))

    if w1 is None or w2 is None:
        return SignalResult(
            signal_id="S24",
            name="warranty_months",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both warranty values missing.",
        )

    if w1 == w2:
        return SignalResult(
            signal_id="S24",
            name="warranty_months",
            score=0.02,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Warranty periods match: {w1} months.",
        )

    return SignalResult(
        signal_id="S24",
        name="warranty_months",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Warranty periods differ: {w1} vs {w2} months.",
    )


def s25_assembly_required(p1: dict, p2: dict) -> SignalResult:
    """
    Same assembly_required boolean → +0.01.
    """
    a1 = p1.get("assembly_required")
    a2 = p2.get("assembly_required")

    if a1 is None or a2 is None:
        return SignalResult(
            signal_id="S25",
            name="assembly_required",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both assembly_required values missing.",
        )

    # Normalise to bool in case stored as string "true"/"false"
    def _to_bool(v):
        if isinstance(v, bool):
            return v
        return str(v).strip().lower() in ("true", "1", "yes")

    b1, b2 = _to_bool(a1), _to_bool(a2)

    if b1 == b2:
        return SignalResult(
            signal_id="S25",
            name="assembly_required",
            score=0.01,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Assembly requirement matches: {b1}.",
        )

    return SignalResult(
        signal_id="S25",
        name="assembly_required",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Assembly requirement differs: {b1} vs {b2}.",
    )


def s26_weight_kg(p1: dict, p2: dict) -> SignalResult:
    """
    Weight comparison — within 5% relative tolerance → +0.02.
    """
    wt1 = _safe_float(p1.get("weight_kg"))
    wt2 = _safe_float(p2.get("weight_kg"))

    if wt1 is None or wt2 is None or wt1 <= 0 or wt2 <= 0:
        return SignalResult(
            signal_id="S26",
            name="weight_kg",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both weight values missing or zero.",
        )

    gap_pct = abs(wt1 - wt2) / max(wt1, wt2) * 100.0

    if gap_pct <= 5.0:
        return SignalResult(
            signal_id="S26",
            name="weight_kg",
            score=0.02,
            fired=True,
            is_blocker=False,
            blocker_triggered=False,
            note=f"Weights within 5%: {wt1}kg vs {wt2}kg (gap={gap_pct:.1f}%).",
        )

    return SignalResult(
        signal_id="S26",
        name="weight_kg",
        score=0.0,
        fired=False,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Weight gap exceeds 5%: {wt1}kg vs {wt2}kg (gap={gap_pct:.1f}%).",
    )


def s27_feature_tag_overlap(p1: dict, p2: dict) -> SignalResult:
    """
    Jaccard similarity of feature_tags sets × 0.03.
    Tags are lowercased and stripped before comparison.
    """
    ft1 = {t.lower().strip() for t in _safe_list(p1.get("feature_tags")) if t}
    ft2 = {t.lower().strip() for t in _safe_list(p2.get("feature_tags")) if t}

    if not ft1 or not ft2:
        return SignalResult(
            signal_id="S27",
            name="feature_tag_overlap",
            score=0.0,
            fired=False,
            is_blocker=False,
            blocker_triggered=False,
            note="One or both feature_tags lists missing or empty.",
        )

    j = jaccard(ft1, ft2)
    score = round(j * 0.03, 6)

    return SignalResult(
        signal_id="S27",
        name="feature_tag_overlap",
        score=score,
        fired=score > 0.0,
        is_blocker=False,
        blocker_triggered=False,
        note=f"Feature tag Jaccard={j:.4f}, score={score:.4f}.",
    )


# ---------------------------------------------------------------------------
# Signal registries
# ---------------------------------------------------------------------------

HARD_BLOCKERS = [s01_brand_exact, s02_category_exact, s03_seater_count, s04_piece_count]

ALL_SIGNALS: List = [
    s01_brand_exact,
    s02_category_exact,
    s03_seater_count,
    s04_piece_count,
    s05_source_url,
    s06_model_number,
    s07_name_token_jaccard,
    s08_name_exact,
    s09_keyword_overlap,
    s10_color_family,
    s11_color_exact,
    s12_material_family,
    s13_material_exact,
    s14_finish_type,
    s15_dimension_width,
    s16_dimension_height,
    s17_dimension_depth,
    s18_price_proximity,
    s19_description_overlap,
    s20_phash_distance,
    s21_dominant_color_overlap,
    s22_image_url_exact,
    s23_leg_material,
    s24_warranty_months,
    s25_assembly_required,
    s26_weight_kg,
    s27_feature_tag_overlap,
]


# ---------------------------------------------------------------------------
# Primary evaluation entry point
# ---------------------------------------------------------------------------


def evaluate_signals(p1: dict, p2: dict) -> dict:
    """
    Run all 27 signals against two product dicts and return a consolidated
    deduplication verdict.

    Evaluation order:
      1. S05 (source_url) — SHORT_CIRCUIT path if URLs are identical.
      2. HARD_BLOCKERS (S01–S04) — immediate DIFFERENT verdict on mismatch.
      3. All remaining signals — scored and summed.

    Returns:
        {
            "total_score": float,          # 0.0–1.0
            "signals": List[SignalResult], # all 27 results
            "blocker_triggered": bool,     # any hard blocker fired
            "short_circuit": bool,         # source_url exact match
            "is_conflict": bool,           # high overall score but large price gap
            "signals_fired": List[str],    # signal_ids where fired=True
        }
    """
    all_results: List[SignalResult] = []
    blocker_triggered = False
    short_circuit = False

    # ---- Step 1: SHORT_CIRCUIT check (S05) ----------------------------------
    sc_result = s05_source_url(p1, p2)
    all_results.append(sc_result)

    if sc_result.fired and "SHORT_CIRCUIT" in sc_result.note:
        short_circuit = True
        # Pad remaining 26 signals with zero-score stubs so callers always
        # receive a full 27-element list.
        _remaining = [fn for fn in ALL_SIGNALS if fn is not s05_source_url]
        for fn in _remaining:
            all_results.append(SignalResult(
                signal_id=fn.__name__[1:3].upper(),
                name=fn.__name__[4:],
                score=0.0,
                fired=False,
                is_blocker=False,
                blocker_triggered=False,
                note="Skipped — SHORT_CIRCUIT already triggered.",
            ))
        return {
            "total_score": 1.0,
            "signals": all_results,
            "blocker_triggered": False,
            "short_circuit": True,
            "is_conflict": False,
            "signals_fired": [sc_result.signal_id],
        }

    # ---- Step 2: HARD_BLOCKERS (S01–S04) ------------------------------------
    blocker_results = []
    for fn in HARD_BLOCKERS:
        result = fn(p1, p2)
        blocker_results.append(result)
        all_results.append(result)
        if result.blocker_triggered:
            blocker_triggered = True

    if blocker_triggered:
        # Run and record remaining signals for audit purposes, but score = 0.
        _evaluated_ids = {r.signal_id for r in all_results}
        for fn in ALL_SIGNALS:
            # Derive signal_id from the function name ("sNN_…" → "SNN")
            _sid = "S" + fn.__name__[1:3].lstrip("0").zfill(2)
            if _sid in _evaluated_ids:
                continue
            result = fn(p1, p2)
            all_results.append(result)

        signals_fired = [r.signal_id for r in all_results if r.fired]
        return {
            "total_score": 0.0,
            "signals": all_results,
            "blocker_triggered": True,
            "short_circuit": False,
            "is_conflict": False,
            "signals_fired": signals_fired,
        }

    # ---- Step 3: Remaining signals ------------------------------------------
    _evaluated_ids = {r.signal_id for r in all_results}
    s18_result: SignalResult | None = None

    for fn in ALL_SIGNALS:
        _sid = "S" + fn.__name__[1:3].lstrip("0").zfill(2)
        if _sid in _evaluated_ids:
            continue
        result = fn(p1, p2)
        all_results.append(result)
        if fn is s18_price_proximity:
            s18_result = result

    # ---- Step 4: Sum scores, cap at 1.0 ------------------------------------
    total_score = min(sum(r.score for r in all_results), 1.0)
    total_score = round(total_score, 6)

    # ---- Step 5: Conflict detection ----------------------------------------
    is_conflict = False
    if total_score >= 0.60 and s18_result is not None:
        if "is_conflict_signal" in (s18_result.note or ""):
            is_conflict = True

    signals_fired = [r.signal_id for r in all_results if r.fired]

    return {
        "total_score": total_score,
        "signals": all_results,
        "blocker_triggered": False,
        "short_circuit": False,
        "is_conflict": is_conflict,
        "signals_fired": signals_fired,
    }
