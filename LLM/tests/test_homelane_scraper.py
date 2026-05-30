"""
Tests for the HomeLane scraper.

All tests are offline — `fetch_page` is mocked via unittest.mock.patch so
no real network calls are made.

Tags: @test-homelane-001 through @test-homelane-007
"""

import sys
import os
from unittest.mock import patch

import pytest

# ---------------------------------------------------------------------------
# Path setup — identical pattern to LLM/tests/test_scraper_expansion.py
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scraper.homelane_scraper import (
    HOMELANE_SEARCHES,
    _parse_json_ld,
    scrape_homelane,
)
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Static HTML fixtures (no network)
# ---------------------------------------------------------------------------

_FIXTURE_SOFA_HTML = """
<!DOCTYPE html>
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "HomeLane Aspen Brown Leather 3-Seater Sofa",
  "url": "/products/aspen-brown-leather-3-seater-sofa",
  "image": "https://www.homelane.com/cdn/products/aspen-sofa.jpg",
  "offers": {
    "@type": "Offer",
    "price": "45990",
    "priceCurrency": "INR"
  }
}
</script>
</head><body><h1>Sofa</h1></body></html>
"""

_FIXTURE_LOW_PRICE_HTML = """
<!DOCTYPE html>
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "HomeLane Tiny Trinket",
  "url": "/products/tiny-trinket",
  "image": "https://www.homelane.com/cdn/products/trinket.jpg",
  "offers": {"@type": "Offer", "price": "50", "priceCurrency": "INR"}
}
</script>
</head><body></body></html>
"""

_FIXTURE_MISSING_NAME_HTML = """
<!DOCTYPE html>
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "",
  "url": "/products/unnamed",
  "image": "https://www.homelane.com/cdn/products/unnamed.jpg",
  "offers": {"@type": "Offer", "price": "9990", "priceCurrency": "INR"}
}
</script>
</head><body></body></html>
"""


# ===========================================================================
# 1. CONFIG TESTS
# ===========================================================================

def test_homelane_searches_has_required_categories():  # @test-homelane-001
    """HOMELANE_SEARCHES must contain all 9 expected product_type keys."""
    required = {
        "sofa", "bed", "table", "storage", "lighting",
        "decor", "chair", "drawing_room", "outdoor",
    }
    assert required.issubset(set(HOMELANE_SEARCHES.keys()))
    assert len(HOMELANE_SEARCHES) == 9


def test_homelane_searches_urls_are_https():  # @test-homelane-002
    """Every URL in HOMELANE_SEARCHES must start with https://www.homelane.com."""
    for product_type, urls in HOMELANE_SEARCHES.items():
        assert isinstance(urls, list) and len(urls) >= 1, f"{product_type} has no URLs"
        for u in urls:
            assert u.startswith("https://www.homelane.com"), f"Bad URL for {product_type}: {u}"


# ===========================================================================
# 2. PARSER TESTS
# ===========================================================================

def test_parse_json_ld_extracts_product():  # @test-homelane-003
    """Feeding the sofa fixture HTML through the parser yields exactly 1 record."""
    soup = BeautifulSoup(_FIXTURE_SOFA_HTML, "lxml")
    results = _parse_json_ld(soup, "sofa")

    assert isinstance(results, list)
    assert len(results) == 1

    rec = results[0]
    # Required keys present
    expected_keys = {
        "product_id", "product_name", "brand", "price_value", "price_currency",
        "product_type", "room_type", "image_url", "affiliate_url", "source_url",
        "dimensions", "color", "color_hex", "material", "aesthetic_style", "source",
    }
    assert expected_keys.issubset(set(rec.keys()))

    # Type / value checks
    assert rec["brand"] == "HomeLane"
    assert rec["source"] == "homelane.com"
    assert rec["price_currency"] == "INR"
    assert rec["product_type"] == "sofa"
    assert isinstance(rec["price_value"], float)
    assert rec["price_value"] == 45990.0
    assert rec["product_name"].startswith("HomeLane Aspen")
    assert rec["product_id"].startswith("HL_")
    # source_url must be absolute (leading slash was prefixed with domain)
    assert rec["source_url"].startswith("https://www.homelane.com/products/")
    assert rec["room_type"]  # non-empty


def test_parse_json_ld_skips_low_price():  # @test-homelane-004
    """Products with price < 100 INR must be dropped."""
    soup = BeautifulSoup(_FIXTURE_LOW_PRICE_HTML, "lxml")
    results = _parse_json_ld(soup, "decor")
    assert results == []


def test_parse_json_ld_skips_missing_name():  # @test-homelane-005
    """Products with empty name must be dropped."""
    soup = BeautifulSoup(_FIXTURE_MISSING_NAME_HTML, "lxml")
    results = _parse_json_ld(soup, "decor")
    assert results == []


# ===========================================================================
# 3. SCRAPER ENTRYPOINT TESTS (network mocked)
# ===========================================================================

def test_scrape_homelane_returns_list():  # @test-homelane-006
    """scrape_homelane returns a list of >=1 products when fixture is served once."""
    # Serve fixture on the very first call, empty string thereafter, so
    # pagination/category loops exit quickly.
    call_state = {"n": 0}

    def _side_effect(*args, **kwargs):
        call_state["n"] += 1
        return _FIXTURE_SOFA_HTML if call_state["n"] == 1 else ""

    with patch("scraper.homelane_scraper.fetch_page", side_effect=_side_effect):
        result = scrape_homelane(max_per_category=1)

    assert isinstance(result, list)
    assert len(result) >= 1
    # Sanity: first record is a HomeLane product
    assert result[0]["brand"] == "HomeLane"
    assert result[0]["source"] == "homelane.com"


def test_scrape_homelane_dedupes_by_product_id():  # @test-homelane-007
    """Identical responses across calls must not yield duplicate product_ids."""
    # fetch_page always returns the SAME fixture (same name+url -> same product_id).
    with patch("scraper.homelane_scraper.fetch_page", return_value=_FIXTURE_SOFA_HTML):
        result = scrape_homelane(max_per_category=2)

    assert isinstance(result, list)
    ids = [r["product_id"] for r in result]
    assert len(ids) == len(set(ids)), f"Duplicate product_ids found: {ids}"
    # Because every page returns the same single product, the seen-set should
    # admit it exactly once across all categories/pages.
    assert len(result) == 1
