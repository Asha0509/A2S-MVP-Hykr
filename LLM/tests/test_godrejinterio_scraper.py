"""
Offline tests for the Godrej Interio scraper.

All tests mock fetch_page so no real network calls are made. The fixtures
embed a minimal JSON-LD Product block matching the format the scraper expects.

Tags: @test-godrejinterio-001 through @test-godrejinterio-007
"""

import sys
import os
import pytest
from unittest.mock import patch

# Path setup — identical pattern to LLM/tests/test_scraper_expansion.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scraper.godrejinterio_scraper import (
    GODREJ_INTERIO_SEARCHES,
    _parse_json_ld,
    scrape_godrejinterio,
)
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

REQUIRED_CATEGORIES = [
    "sofa", "bed", "table", "storage", "lighting",
    "decor", "chair", "drawing_room", "outdoor",
]


def _wardrobe_fixture_html(
    name: str = "Slimline 3-Door Wardrobe with Mirror",
    url: str = "/home-furniture/wardrobes/slimline-3-door-wardrobe",
    price: str = "44990",
    image: str = "https://www.godrejinterio.com/media/catalog/product/slimline.jpg",
) -> str:
    """Build a minimal HTML page wrapping one JSON-LD Product block."""
    return f"""
    <html><head>
      <script type="application/ld+json">
      {{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "{name}",
        "url": "{url}",
        "image": "{image}",
        "brand": "Godrej Interio",
        "offers": {{
          "@type": "Offer",
          "price": "{price}",
          "priceCurrency": "INR"
        }}
      }}
      </script>
    </head><body></body></html>
    """


# ===========================================================================
# 1. CONFIG TESTS
# ===========================================================================

def test_godrejinterio_searches_has_required_categories():  # @test-godrejinterio-001
    """GODREJ_INTERIO_SEARCHES must cover all nine required product_type keys."""
    for key in REQUIRED_CATEGORIES:
        assert key in GODREJ_INTERIO_SEARCHES, f"Missing category key: {key}"
    assert len(GODREJ_INTERIO_SEARCHES) == len(REQUIRED_CATEGORIES)


def test_godrejinterio_searches_urls_are_https():  # @test-godrejinterio-002
    """Every configured category URL must be an https godrejinterio.com URL."""
    for product_type, urls in GODREJ_INTERIO_SEARCHES.items():
        assert isinstance(urls, list) and urls, f"No URLs for {product_type}"
        for url in urls:
            assert url.startswith("https://www.godrejinterio.com"), (
                f"Non-https or wrong host URL for {product_type}: {url}"
            )


# ===========================================================================
# 2. PARSER TESTS
# ===========================================================================

def test_parse_json_ld_extracts_product():  # @test-godrejinterio-003
    """A valid fixture produces exactly one well-formed product record."""
    soup = BeautifulSoup(_wardrobe_fixture_html(), "lxml")
    results = _parse_json_ld(soup, "storage")

    assert len(results) == 1
    rec = results[0]
    assert rec["brand"] == "Godrej Interio"
    assert rec["source"] == "godrejinterio.com"
    assert rec["price_currency"] == "INR"
    assert rec["price_value"] == 44990.0
    assert rec["product_type"] == "storage"
    assert rec["product_name"].startswith("Slimline")
    assert rec["product_id"].startswith("GI_")
    # Leading-slash url should be absolutized
    assert rec["source_url"].startswith("https://www.godrejinterio.com")
    # Schema completeness
    for key in (
        "product_id", "product_name", "brand", "price_value", "price_currency",
        "product_type", "room_type", "image_url", "affiliate_url", "source_url",
        "dimensions", "color", "color_hex", "material", "aesthetic_style", "source",
    ):
        assert key in rec, f"Missing key in product record: {key}"


def test_parse_json_ld_skips_low_price():  # @test-godrejinterio-004
    """A fixture with price < 100 INR is filtered out."""
    soup = BeautifulSoup(_wardrobe_fixture_html(price="49"), "lxml")
    results = _parse_json_ld(soup, "storage")
    assert results == []


def test_parse_json_ld_skips_missing_name():  # @test-godrejinterio-005
    """A fixture with an empty name field yields zero records."""
    soup = BeautifulSoup(_wardrobe_fixture_html(name=""), "lxml")
    results = _parse_json_ld(soup, "storage")
    assert results == []


# ===========================================================================
# 3. ENTRY POINT TESTS (mocked network)
# ===========================================================================

def test_scrape_godrejinterio_returns_list():  # @test-godrejinterio-006
    """Entrypoint returns at least one product when fetch_page yields a valid fixture."""
    fixture = _wardrobe_fixture_html()

    # First call per category returns the fixture; subsequent pages return "" to
    # stop pagination quickly. We use side_effect cycling through fixture then "".
    call_state = {"n": 0}

    def _fake_fetch(url, session=None, delay=0):
        call_state["n"] += 1
        # Return fixture on odd calls, empty on even — that way every category's
        # first page yields products, then pagination stops on page 2.
        return fixture if call_state["n"] % 2 == 1 else ""

    with patch("scraper.godrejinterio_scraper.fetch_page", side_effect=_fake_fetch):
        result = scrape_godrejinterio(max_per_category=1)

    assert isinstance(result, list)
    assert len(result) >= 1
    assert all(r["brand"] == "Godrej Interio" for r in result)


def test_scrape_godrejinterio_dedupes_by_product_id():  # @test-godrejinterio-007
    """Duplicate fixtures across calls must not appear twice in the output."""
    fixture = _wardrobe_fixture_html()

    # Always return the same fixture — every category should see the same product,
    # but dedup by product_id should keep the output unique.
    with patch("scraper.godrejinterio_scraper.fetch_page", return_value=fixture):
        result = scrape_godrejinterio(max_per_category=1)

    ids = [r["product_id"] for r in result]
    assert len(ids) == len(set(ids)), f"Duplicate product_ids found: {ids}"
