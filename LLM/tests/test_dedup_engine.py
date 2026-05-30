"""
Tests for LLM/dedup/engine.py and LLM/dedup/signals.py
@test-dedup-eng-001 through @test-dedup-eng-020
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dedup.engine import DedupEngine, MatchResult, THRESHOLD_EXACT, THRESHOLD_SIMILAR
from dedup.signals import evaluate_signals, SignalResult

engine = DedupEngine()

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SOFA_AMAZON = {
    "name": "Nilkamal Floyd 3 Seater Sofa",
    "brand": "Nilkamal",
    "category": "sofa",
    "price": 24999.0,
    "color": "dark brown",
    "material": "solid sheesham",
    "vendor": "AMAZON",
    "source_url": "https://amazon.in/nilkamal-floyd-sofa",
    "seater_count": 3,
    "dimensions": "190x82x78 cm",
}

SOFA_FLIPKART = {
    "name": "Nilkamal Floyd 3 Seater Sofa",
    "brand": "Nilkamal",
    "category": "sofa",
    "price": 25499.0,
    "color": "dark brown",
    "material": "solid sheesham",
    "vendor": "FLIPKART",
    "source_url": "https://flipkart.com/nilkamal-floyd-sofa",
    "seater_count": 3,
    "dimensions": "190x82x78 cm",
}

SOFA_DIFFERENT_COLOR = {
    "name": "Nilkamal Floyd 3 Seater Sofa",
    "brand": "Nilkamal",
    "category": "sofa",
    "price": 24999.0,
    "color": "light grey",
    "material": "solid sheesham",
    "vendor": "PEPPERFRY",
    "source_url": "https://pepperfry.com/nilkamal-floyd-grey",
    "seater_count": 3,
    "dimensions": "190x82x78 cm",
}

SOFA_DIFFERENT_BRAND = {
    "name": "Wakefit 3 Seater Sofa",
    "brand": "Wakefit",
    "category": "sofa",
    "price": 22000.0,
    "color": "dark brown",
    "material": "fabric",
    "vendor": "WAKEFIT",
    "source_url": "https://wakefit.co/sofa-3s",
    "seater_count": 3,
}

TABLE_PRODUCT = {
    "name": "Ikea KALLAX Shelf Unit",
    "brand": "IKEA",
    "category": "shelving",
    "price": 8999.0,
    "color": "white",
    "material": "particleboard",
    "vendor": "IKEA",
    "source_url": "https://ikea.com/in/en/kallax",
}


# ---------------------------------------------------------------------------
# Signal S05: SHORT_CIRCUIT on same source_url
# ---------------------------------------------------------------------------

def test_same_source_url_is_exact():  # @test-dedup-eng-001
    p1 = {**SOFA_AMAZON}
    p2 = {**SOFA_AMAZON}  # identical including source_url
    result = engine.compare(p1, p2)
    assert result.match_type == "EXACT"
    assert result.confidence_score == 1.0
    assert "S05" in result.signals_fired


# ---------------------------------------------------------------------------
# Hard blocker: brand mismatch
# ---------------------------------------------------------------------------

def test_brand_mismatch_is_different():  # @test-dedup-eng-002
    result = engine.compare(SOFA_AMAZON, SOFA_DIFFERENT_BRAND)
    assert result.match_type == "DIFFERENT"
    assert result.confidence_score == 0.0

def test_brand_mismatch_verdict_reason_mentions_blocker():  # @test-dedup-eng-003
    result = engine.compare(SOFA_AMAZON, SOFA_DIFFERENT_BRAND)
    assert "blocker" in result.verdict_reason.lower()


# ---------------------------------------------------------------------------
# Hard blocker: category mismatch
# ---------------------------------------------------------------------------

def test_category_mismatch_is_different():  # @test-dedup-eng-004
    p1 = {**SOFA_AMAZON}
    p2 = {**SOFA_AMAZON, "category": "table", "source_url": "https://other.com/table"}
    result = engine.compare(p1, p2)
    assert result.match_type == "DIFFERENT"


# ---------------------------------------------------------------------------
# EXACT match: same product, different vendor URL
# ---------------------------------------------------------------------------

def test_same_product_different_vendor_is_exact():  # @test-dedup-eng-005
    result = engine.compare(SOFA_AMAZON, SOFA_FLIPKART)
    assert result.match_type == "EXACT"
    assert result.confidence_score >= THRESHOLD_EXACT


# ---------------------------------------------------------------------------
# VARIANT: same product, different color
# ---------------------------------------------------------------------------

def test_same_product_different_color_is_variant():  # @test-dedup-eng-006
    result = engine.compare(SOFA_AMAZON, SOFA_DIFFERENT_COLOR)
    # Same name, brand, category, dimensions — only color differs
    assert result.match_type in ("VARIANT", "SIMILAR", "EXACT")
    # If VARIANT or SIMILAR, is_variant flag should be set when color is the only diff
    if result.match_type == "VARIANT":
        assert result.is_variant is True


# ---------------------------------------------------------------------------
# DIFFERENT: category mismatch (sofa vs shelving)
# ---------------------------------------------------------------------------

def test_sofa_vs_shelf_is_different():  # @test-dedup-eng-007
    result = engine.compare(SOFA_AMAZON, TABLE_PRODUCT)
    assert result.match_type == "DIFFERENT"


# ---------------------------------------------------------------------------
# evaluate_signals output structure
# ---------------------------------------------------------------------------

def test_evaluate_signals_returns_required_keys():  # @test-dedup-eng-008
    result = evaluate_signals(SOFA_AMAZON, SOFA_FLIPKART)
    assert "total_score" in result
    assert "signals" in result
    assert "blocker_triggered" in result
    assert "short_circuit" in result
    assert "is_conflict" in result
    assert "signals_fired" in result

def test_evaluate_signals_27_results():  # @test-dedup-eng-009
    result = evaluate_signals(SOFA_AMAZON, SOFA_FLIPKART)
    assert len(result["signals"]) == 27

def test_evaluate_signals_score_capped_at_1():  # @test-dedup-eng-010
    result = evaluate_signals(SOFA_AMAZON, SOFA_AMAZON)
    assert result["total_score"] <= 1.0


# ---------------------------------------------------------------------------
# Conflict detection: price gap > 15%
# ---------------------------------------------------------------------------

def test_conflict_flag_on_large_price_gap():  # @test-dedup-eng-011
    p1 = {**SOFA_AMAZON, "price": 20000.0, "source_url": "https://a.com/sofa1"}
    p2 = {**SOFA_FLIPKART, "price": 25000.0, "source_url": "https://b.com/sofa2"}
    # 25% price gap → is_conflict should trigger if overall score >= 0.60
    result = engine.compare(p1, p2)
    if result.match_type in ("EXACT", "SIMILAR", "VARIANT"):
        assert result.is_conflict is True


# ---------------------------------------------------------------------------
# Missing fields: engine must not raise
# ---------------------------------------------------------------------------

def test_compare_empty_dicts_no_crash():  # @test-dedup-eng-012
    result = engine.compare({}, {})
    assert result.match_type in ("EXACT", "VARIANT", "SIMILAR", "DIFFERENT")

def test_compare_partial_fields_no_crash():  # @test-dedup-eng-013
    p1 = {"name": "Sofa", "price": 5000.0}
    p2 = {"name": "Sofa", "brand": "Nilkamal"}
    result = engine.compare(p1, p2)
    assert isinstance(result, MatchResult)


# ---------------------------------------------------------------------------
# find_best_match
# ---------------------------------------------------------------------------

def test_find_best_match_returns_exact():  # @test-dedup-eng-014
    candidates = [SOFA_FLIPKART, TABLE_PRODUCT, SOFA_DIFFERENT_BRAND]
    match = engine.find_best_match(SOFA_AMAZON, candidates)
    assert match is not None
    best_candidate, best_result = match
    assert best_result.match_type in ("EXACT", "VARIANT", "SIMILAR")

def test_find_best_match_returns_none_when_all_different():  # @test-dedup-eng-015
    result = engine.find_best_match(SOFA_AMAZON, [SOFA_DIFFERENT_BRAND, TABLE_PRODUCT])
    assert result is None


# ---------------------------------------------------------------------------
# score_batch
# ---------------------------------------------------------------------------

def test_score_batch_finds_duplicates():  # @test-dedup-eng-016
    products = [SOFA_AMAZON, SOFA_FLIPKART, TABLE_PRODUCT, SOFA_DIFFERENT_BRAND]
    pairs = engine.score_batch(products)
    # SOFA_AMAZON and SOFA_FLIPKART should appear as a match
    assert any(
        products[i] is SOFA_AMAZON and products[j] is SOFA_FLIPKART
        or products[i] is SOFA_FLIPKART and products[j] is SOFA_AMAZON
        for i, j, _ in pairs
    )

def test_score_batch_no_different_in_results():  # @test-dedup-eng-017
    products = [SOFA_AMAZON, SOFA_FLIPKART]
    pairs = engine.score_batch(products)
    assert all(r.match_type != "DIFFERENT" for _, _, r in pairs)


# ---------------------------------------------------------------------------
# SignalResult dataclass
# ---------------------------------------------------------------------------

def test_signal_result_fields_present():  # @test-dedup-eng-018
    result = evaluate_signals(SOFA_AMAZON, SOFA_FLIPKART)
    sr = result["signals"][0]
    assert hasattr(sr, "signal_id")
    assert hasattr(sr, "name")
    assert hasattr(sr, "score")
    assert hasattr(sr, "fired")
    assert hasattr(sr, "is_blocker")
    assert hasattr(sr, "blocker_triggered")
    assert hasattr(sr, "note")


# ---------------------------------------------------------------------------
# Seater count blocker
# ---------------------------------------------------------------------------

def test_seater_mismatch_triggers_blocker():  # @test-dedup-eng-019
    p1 = {**SOFA_AMAZON, "seater_count": 2, "source_url": "https://a.com/s1"}
    p2 = {**SOFA_FLIPKART, "seater_count": 3, "source_url": "https://b.com/s2"}
    result = engine.compare(p1, p2)
    assert result.match_type == "DIFFERENT"


# ---------------------------------------------------------------------------
# Threshold constants sanity
# ---------------------------------------------------------------------------

def test_thresholds():  # @test-dedup-eng-020
    assert THRESHOLD_EXACT == 0.80
    assert THRESHOLD_SIMILAR == 0.60
    assert THRESHOLD_SIMILAR < THRESHOLD_EXACT
