"""
Tests for the Nilkamal scraper module.

All tests are offline — fetch_page is mocked via unittest.mock.patch so no
network calls are made. Fixtures are minimal JSON-LD blocks embedded in HTML.

Tags: @test-nilkamal-001 through @test-nilkamal-007
"""

import sys
import os
import json
import pytest
from unittest.mock import patch

# ---------------------------------------------------------------------------
# Path setup — mirrors LLM/tests/test_scraper_expansion.py
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scraper.nilkamal_scraper import (
    NILKAMAL_SEARCHES,
    _parse_json_ld,
    scrape_nilkamal,
)
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Fixture builders
# ---------------------------------------------------------------------------

def _build_html(product_payload: dict) -> str:
    """Wrap a single JSON-LD Product payload in a minimal HTML shell."""
    return (
        "<html><head>"
        f'<script type="application/ld+json">{json.dumps(product_payload)}</script>'
        "</head><body></body></html>"
    )


def _good_product_payload() -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Nilkamal Crescent Queen Size Bed in Walnut Brown",
        "url": "/products/nilkamal-crescent-queen-bed",
        "image": "https://cdn.shopify.com/s/files/nilkamal/crescent-bed.jpg",
        "offers": {
            "@type": "Offer",
            "price": "24990.00",
            "priceCurrency": "INR",
        },
    }


# ===========================================================================
# 1. CATEGORY COVERAGE
# ===========================================================================

def test_nilkamal_searches_has_required_categories():  # @test-nilkamal-001
    """NILKAMAL_SEARCHES must contain all 9 expected product_type keys."""
    expected = {
        "sofa", "bed", "table", "storage", "lighting",
        "decor", "chair", "drawing_room", "outdoor",
    }
    assert expected.issubset(set(NILKAMAL_SEARCHES.keys()))
    assert len(NILKAMAL_SEARCHES) == 9


# ===========================================================================
# 2. URL HYGIENE
# ===========================================================================

def test_nilkamal_searches_urls_are_https():  # @test-nilkamal-002
    """Every URL in NILKAMAL_SEARCHES must start with the Nilkamal HTTPS origin."""
    for key, urls in NILKAMAL_SEARCHES.items():
        assert isinstance(urls, list) and urls, f"{key} has no URLs"
        for u in urls:
            assert u.startswith("https://www.nilkamalfurniture.com"), (
                f"Bad URL for {key}: {u}"
            )


# ===========================================================================
# 3. JSON-LD PARSER — HAPPY PATH
# ===========================================================================

def test_parse_json_ld_extracts_product():  # @test-nilkamal-003
    """A well-formed JSON-LD Product yields exactly one normalized record."""
    html = _build_html(_good_product_payload())
    soup = BeautifulSoup(html, "lxml")

    records = _parse_json_ld(soup, "bed")
    assert len(records) == 1

    rec = records[0]
    # Required keys present
    for key in [
        "product_id", "product_name", "brand", "price_value", "price_currency",
        "product_type", "room_type", "image_url", "affiliate_url", "source_url",
        "dimensions", "color", "color_hex", "material", "aesthetic_style", "source",
    ]:
        assert key in rec, f"Missing key: {key}"

    # Type / value checks
    assert rec["brand"] == "Nilkamal"
    assert rec["source"] == "nilkamal.com"
    assert rec["price_currency"] == "INR"
    assert rec["product_type"] == "bed"
    assert rec["room_type"] == "Bedroom"
    assert isinstance(rec["price_value"], float) and rec["price_value"] >= 100
    assert rec["product_id"].startswith("NK_")
    # Relative URL must have been resolved to absolute
    assert rec["source_url"].startswith("https://www.nilkamalfurniture.com")
    assert "/products/nilkamal-crescent-queen-bed" in rec["source_url"]


# ===========================================================================
# 4. JSON-LD PARSER — PRICE FLOOR
# ===========================================================================

def test_parse_json_ld_skips_low_price():  # @test-nilkamal-004
    """Products priced below 100 INR must be skipped."""
    payload = _good_product_payload()
    payload["offers"]["price"] = "49.00"
    html = _build_html(payload)
    soup = BeautifulSoup(html, "lxml")

    records = _parse_json_ld(soup, "bed")
    assert records == []


# ===========================================================================
# 5. JSON-LD PARSER — MISSING NAME
# ===========================================================================

def test_parse_json_ld_skips_missing_name():  # @test-nilkamal-005
    """Products with an empty name must be skipped."""
    payload = _good_product_payload()
    payload["name"] = ""
    html = _build_html(payload)
    soup = BeautifulSoup(html, "lxml")

    records = _parse_json_ld(soup, "bed")
    assert records == []


# ===========================================================================
# 6. END-TO-END — MOCKED scrape_nilkamal RETURNS LIST
# ===========================================================================

def test_scrape_nilkamal_returns_list():  # @test-nilkamal-006
    """scrape_nilkamal with mocked fetch_page returns >= 1 product."""
    html = _build_html(_good_product_payload())

    with patch("scraper.nilkamal_scraper.fetch_page", return_value=html):
        result = scrape_nilkamal(max_per_category=1)

    assert isinstance(result, list)
    assert len(result) >= 1
    assert all(p["brand"] == "Nilkamal" for p in result)


# ===========================================================================
# 7. END-TO-END — DEDUPE BY product_id
# ===========================================================================

def test_scrape_nilkamal_dedupes_by_product_id():  # @test-nilkamal-007
    """Repeated identical responses must not produce duplicate product_ids."""
    html = _build_html(_good_product_payload())

    with patch("scraper.nilkamal_scraper.fetch_page", return_value=html):
        result = scrape_nilkamal(max_per_category=5)

    ids = [p["product_id"] for p in result]
    assert len(ids) == len(set(ids)), f"Duplicate product_ids found: {ids}"
