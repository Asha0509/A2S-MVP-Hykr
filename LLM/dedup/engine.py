"""
engine.py — Orchestrator for the A2S product deduplication engine.

Consumes the output of evaluate_signals() and applies business-level thresholds
to produce a final match verdict: EXACT, VARIANT, SIMILAR, or DIFFERENT.

Thresholds (from A2S_ScrapingReference.pdf):
    score >= 0.80  →  EXACT   (same product; create a site_prices row, do not duplicate)
    score >= 0.60  →  SIMILAR (related; check for VARIANT before rendering as similar carousel)
    score <  0.60  →  DIFFERENT (keep as separate product)

Variant logic: within the SIMILAR band, if only color or seater count differs and
name token overlap is >= 0.70, the pair is a VARIANT — linked via variant_of FK,
NOT shown in the similar carousel.

Conflict: any match >= 0.60 where S18 (price proximity) flagged a >15% price gap
sets conflict_flag = True. This queues the product for manual review.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .signals import evaluate_signals
from .normalizer import normalize_color, normalize_brand, tokenize, jaccard

__all__ = ["DedupEngine", "MatchResult"]

THRESHOLD_EXACT: float = 0.80
THRESHOLD_SIMILAR: float = 0.60


@dataclass
class MatchResult:
    match_type: str          # EXACT | VARIANT | SIMILAR | DIFFERENT
    confidence_score: float
    signals_fired: list[str]
    is_conflict: bool
    conflict_reason: str
    is_variant: bool = False
    verdict_reason: str = ""


class DedupEngine:
    """
    Stateless dedup engine. All methods are pure — no DB calls, no I/O.
    Instantiate once and reuse across a scrape batch.
    """

    def compare(self, p1: dict, p2: dict) -> MatchResult:
        """
        Compare two product dicts. Returns a MatchResult with the final verdict.
        """
        result = evaluate_signals(p1, p2)

        if result["short_circuit"]:
            return MatchResult(
                match_type="EXACT",
                confidence_score=1.0,
                signals_fired=result["signals_fired"],
                is_conflict=False,
                conflict_reason="",
                verdict_reason="Source URL exact match (S05 short-circuit).",
            )

        if result["blocker_triggered"]:
            fired = [r.signal_id for r in result["signals"] if r.blocker_triggered]
            blocker_names = ", ".join(
                f"{r.signal_id}:{r.name}" for r in result["signals"] if r.blocker_triggered
            )
            return MatchResult(
                match_type="DIFFERENT",
                confidence_score=0.0,
                signals_fired=result["signals_fired"],
                is_conflict=False,
                conflict_reason="",
                verdict_reason=f"Hard blocker(s) triggered: {blocker_names}.",
            )

        score = result["total_score"]
        is_conflict = result["is_conflict"]
        conflict_reason = "MRP gap >15% across vendors — queued for review." if is_conflict else ""

        if score >= THRESHOLD_EXACT:
            return MatchResult(
                match_type="EXACT",
                confidence_score=score,
                signals_fired=result["signals_fired"],
                is_conflict=is_conflict,
                conflict_reason=conflict_reason,
                verdict_reason=f"Score {score:.4f} ≥ {THRESHOLD_EXACT} (EXACT threshold).",
            )

        if score >= THRESHOLD_SIMILAR:
            is_variant = _is_variant(p1, p2)
            match_type = "VARIANT" if is_variant else "SIMILAR"
            return MatchResult(
                match_type=match_type,
                confidence_score=score,
                signals_fired=result["signals_fired"],
                is_conflict=is_conflict,
                conflict_reason=conflict_reason,
                is_variant=is_variant,
                verdict_reason=(
                    f"Score {score:.4f} in [{THRESHOLD_SIMILAR}, {THRESHOLD_EXACT}) — "
                    f"{'color/size variant' if is_variant else 'similar product'}."
                ),
            )

        return MatchResult(
            match_type="DIFFERENT",
            confidence_score=score,
            signals_fired=result["signals_fired"],
            is_conflict=False,
            conflict_reason="",
            verdict_reason=f"Score {score:.4f} < {THRESHOLD_SIMILAR} (DIFFERENT threshold).",
        )

    def find_best_match(
        self, new_product: dict, candidates: list[dict]
    ) -> Optional[tuple[dict, MatchResult]]:
        """
        Compare new_product against all candidates.
        Returns (best_candidate, MatchResult) for the highest-scoring non-DIFFERENT match.
        Returns None if all candidates are DIFFERENT.
        """
        best_candidate: Optional[dict] = None
        best_result: Optional[MatchResult] = None

        for candidate in candidates:
            result = self.compare(new_product, candidate)
            if result.match_type == "DIFFERENT":
                continue
            if best_result is None or result.confidence_score > best_result.confidence_score:
                best_candidate = candidate
                best_result = result

        return (best_candidate, best_result) if best_candidate is not None else None

    def score_batch(
        self, products: list[dict]
    ) -> list[tuple[int, int, MatchResult]]:
        """
        Compare all (i, j) pairs in a product batch.
        Returns list of (i, j, MatchResult) tuples where match_type != DIFFERENT.
        Useful for finding all duplicates within a single scrape run.
        O(n²) — use on batches of ≤ 5,000 products per call.
        """
        results: list[tuple[int, int, MatchResult]] = []
        n = len(products)
        for i in range(n):
            for j in range(i + 1, n):
                result = self.compare(products[i], products[j])
                if result.match_type != "DIFFERENT":
                    results.append((i, j, result))
        return results


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _is_variant(p1: dict, p2: dict) -> bool:
    """
    Returns True if p1 and p2 differ only on color or seater count (variant axes),
    not on brand, category, or material family. Both must have name token overlap >= 0.70.
    Used to classify SIMILAR-band matches as VARIANT before rendering.
    """
    # Names must be highly similar after normalization
    name_overlap = jaccard(
        tokenize(p1.get("name") or ""),
        tokenize(p2.get("name") or ""),
    )
    if name_overlap < 0.70:
        return False

    # Brand must match (or one is missing)
    b1 = normalize_brand(p1.get("brand") or "")
    b2 = normalize_brand(p2.get("brand") or "")
    if b1 and b2 and b1 != b2:
        return False

    # Category must match (or one is missing)
    cat1 = (p1.get("category") or "").lower().strip()
    cat2 = (p2.get("category") or "").lower().strip()
    if cat1 and cat2 and cat1 != cat2:
        return False

    # At least one variant axis must differ
    color1 = normalize_color(p1.get("color") or "")
    color2 = normalize_color(p2.get("color") or "")
    color_differs = bool(color1 and color2 and color1 != color2)

    seater1 = p1.get("seater_count")
    seater2 = p2.get("seater_count")
    seater_differs = (
        seater1 is not None and seater2 is not None
        and int(seater1) != int(seater2)
    )

    return color_differs or seater_differs
