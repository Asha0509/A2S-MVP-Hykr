"""
Tests for LLM/dedup/normalizer.py
@test-dedup-norm-001 through @test-dedup-norm-020
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dedup.normalizer import (
    normalize_name,
    normalize_brand,
    normalize_color,
    normalize_material,
    expand_abbreviations,
    strip_platform_suffixes,
    tokenize,
    jaccard,
    extract_model_tokens,
    parse_dimension_numbers,
    phash_distance,
)


# ---------------------------------------------------------------------------
# normalize_name
# ---------------------------------------------------------------------------

def test_normalize_name_strips_stop_words():  # @test-dedup-norm-001
    result = normalize_name("A Sofa Set For Living Room")
    assert "a" not in result.split()
    assert "for" not in result.split()
    assert "set" not in result.split()
    assert "sofa" in result

def test_normalize_name_platform_suffix_removed():  # @test-dedup-norm-002
    result = normalize_name("Nilkamal Sofa | Amazon Brand")
    assert "amazon" not in result
    assert "brand" not in result
    assert "nilkamal" in result

def test_normalize_name_empty_returns_empty():  # @test-dedup-norm-003
    assert normalize_name("") == ""
    assert normalize_name(None) == ""


# ---------------------------------------------------------------------------
# normalize_brand
# ---------------------------------------------------------------------------

def test_normalize_brand_aliases():  # @test-dedup-norm-004
    assert normalize_brand("Amazon Basics") == "amazon basics"
    assert normalize_brand("amazonbasics") == "amazon basics"
    assert normalize_brand("Urban Ladder") == "urban ladder"
    assert normalize_brand("urbanladder") == "urban ladder"
    assert normalize_brand("IKEA") == "ikea"

def test_normalize_brand_strips_brand_suffix():  # @test-dedup-norm-005
    assert normalize_brand("Nilkamal Brand") == "nilkamal"

def test_normalize_brand_empty():  # @test-dedup-norm-006
    assert normalize_brand("") == ""
    assert normalize_brand(None) == ""


# ---------------------------------------------------------------------------
# normalize_color
# ---------------------------------------------------------------------------

def test_normalize_color_families():  # @test-dedup-norm-007
    assert normalize_color("walnut brown") == "brown"
    assert normalize_color("dark brown") == "brown"
    assert normalize_color("mahogany") == "brown"
    assert normalize_color("off-white") == "white"
    assert normalize_color("cream") == "white"
    assert normalize_color("ivory") == "white"
    assert normalize_color("charcoal") == "grey"
    assert normalize_color("gunmetal") == "grey"
    assert normalize_color("gold") == "gold"
    assert normalize_color("brass") == "gold"

def test_normalize_color_token_fallback():  # @test-dedup-norm-008
    # "warm oak" — "oak" not a color, falls back to first recognized token or raw
    result = normalize_color("warm oak")
    assert isinstance(result, str)
    assert len(result) > 0

def test_normalize_color_empty():  # @test-dedup-norm-009
    assert normalize_color("") == ""
    assert normalize_color(None) == ""


# ---------------------------------------------------------------------------
# normalize_material
# ---------------------------------------------------------------------------

def test_normalize_material_families():  # @test-dedup-norm-010
    assert normalize_material("solid sheesham") == "wood"
    assert normalize_material("mango wood") == "wood"
    assert normalize_material("MDF") == "wood"
    assert normalize_material("plywood") == "wood"
    assert normalize_material("stainless steel") == "metal"
    assert normalize_material("mild steel") == "metal"
    assert normalize_material("genuine leather") == "leather"
    assert normalize_material("PU leather") == "leather"
    assert normalize_material("leatherette") == "leather"
    assert normalize_material("cotton") == "fabric"
    assert normalize_material("velvet") == "fabric"
    assert normalize_material("marble") == "stone"
    assert normalize_material("tempered glass") == "glass"
    assert normalize_material("ABS") == "plastic"
    assert normalize_material("polypropylene") == "plastic"


# ---------------------------------------------------------------------------
# expand_abbreviations
# ---------------------------------------------------------------------------

def test_expand_seater_abbreviations():  # @test-dedup-norm-011
    assert "3 seater" in expand_abbreviations("3s sofa")
    assert "2 seater" in expand_abbreviations("2s chair")
    assert "4 seater" in expand_abbreviations("4s dining")

def test_expand_other_abbreviations():  # @test-dedup-norm-012
    assert "l shaped" in expand_abbreviations("L-shape desk")
    assert "with" in expand_abbreviations("sofa w/ table")


# ---------------------------------------------------------------------------
# strip_platform_suffixes
# ---------------------------------------------------------------------------

def test_strip_amazon_brand():  # @test-dedup-norm-013
    assert "Amazon Brand" not in strip_platform_suffixes("Nilkamal Chair | Amazon Brand")

def test_strip_flipkart_assured():  # @test-dedup-norm-014
    result = strip_platform_suffixes("Sofa [Flipkart Assured] Comfortable")
    assert "Flipkart" not in result

def test_strip_pack_of_keeps_number():  # @test-dedup-norm-015
    result = strip_platform_suffixes("Dinner Plates Pack of 6")
    assert "6" in result
    assert "pack" not in result.lower()

def test_strip_exclusive_tag():  # @test-dedup-norm-016
    result = strip_platform_suffixes("Premium Sofa [Exclusive]")
    assert "Exclusive" not in result


# ---------------------------------------------------------------------------
# tokenize + jaccard
# ---------------------------------------------------------------------------

def test_tokenize_removes_short_tokens():  # @test-dedup-norm-017
    tokens = tokenize("A Big Sofa")
    assert "a" not in tokens
    assert "sofa" in tokens or "big" in tokens  # short tokens removed, "big" is 3 chars

def test_jaccard_identical():  # @test-dedup-norm-018
    assert jaccard({"a", "b", "c"}, {"a", "b", "c"}) == 1.0

def test_jaccard_disjoint():  # @test-dedup-norm-019
    assert jaccard({"a", "b"}, {"c", "d"}) == 0.0

def test_jaccard_empty():  # @test-dedup-norm-020
    assert jaccard(set(), set()) == 0.0
    assert jaccard({"a"}, set()) == 0.0


# ---------------------------------------------------------------------------
# extract_model_tokens
# ---------------------------------------------------------------------------

def test_extract_model_tokens():  # @test-dedup-norm-021
    tokens = extract_model_tokens("IKEA KALLAX GX-450 Shelf Unit")
    assert "GX-450" in tokens

def test_extract_model_tokens_no_digit_excluded():  # @test-dedup-norm-022
    tokens = extract_model_tokens("Wooden Chair Premium")
    # "Wooden", "Chair", "Premium" — none contain a digit
    assert len(tokens) == 0


# ---------------------------------------------------------------------------
# parse_dimension_numbers
# ---------------------------------------------------------------------------

def test_parse_dimension_three_values():  # @test-dedup-norm-023
    dims = parse_dimension_numbers("322x98x48 cm")
    assert dims == [322.0, 98.0, 48.0]

def test_parse_dimension_two_values():  # @test-dedup-norm-024
    dims = parse_dimension_numbers("160 x 200 cm")
    assert dims == [160.0, 200.0]

def test_parse_dimension_empty():  # @test-dedup-norm-025
    assert parse_dimension_numbers("") == []
    assert parse_dimension_numbers(None) == []


# ---------------------------------------------------------------------------
# phash_distance
# ---------------------------------------------------------------------------

def test_phash_distance_none_inputs():  # @test-dedup-norm-026
    assert phash_distance(None, None) is None
    assert phash_distance("abc123", None) is None
    assert phash_distance(None, "abc123") is None

def test_phash_distance_invalid_hash_returns_none():  # @test-dedup-norm-027
    # Invalid hex strings — should return None, not raise
    result = phash_distance("not_a_hash", "also_not_a_hash")
    assert result is None
