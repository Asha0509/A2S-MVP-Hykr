"""
Tests for the MiradorHome scraper module.

All tests are offline — every test patches scraper.miradorhome_scraper.fetch_page
so no real HTTP requests are issued. The mocked HTML fixtures embed a JSON-LD
Product block of the shape MiradorHome (a Shopify-style store) typically emits.

Tags: @test-miradorhome-001 through @test-miradorhome-007
"""

import sys
import os
from unittest.mock import patch

import pytest

# ---------------------------------------------------------------------------
# Path setup — identical pattern to LLM/tests/test_scraper_expansion.py
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scraper.miradorhome_scraper import (  # noqa: E402
    MIRADOR_HOME_SEARCHES,
    _parse_json_ld,
    scrape_miradorhome,
)
from bs4 import BeautifulSoup  # noqa: E402


# ---------------------------------------------------------------------------
# HTML fixtures — minimal pages containing one JSON-LD Product each.
# ---------------------------------------------------------------------------

def _build_fixture_html(
    name: str = "Mirador Brass Lotus Decor Tray",
    url: str = "/products/brass-lotus-decor-tray",
    image: str = "https://cdn.miradorhome.com/products/brass-lotus.jpg",
    price: str = "4499",
) -> str:
    """Build a tiny HTML doc with one JSON-LD Product block."""
    return f"""
    <html><head>
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "{name}",
      "url": "{url}",
      "image": "{image}",
      "offers": {{
        "@type": "Offer",
        "price": "{price}",
        "priceCurrency": "INR"
      }}
    }}
    </script>
    </head><body></body></html>
    """


VALID_HTML = _build_fixture_html()
LOW_PRICE_HTML = _build_fixture_html(price="50")        # below 100 INR floor
MISSING_NAME_HTML = _build_fixture_html(name="")         # empty name


# ===========================================================================
# 1. SEARCH DICT COVERAGE TESTS
# ===========================================================================

REQUIRED_KEYS = {
    "sofa", "bed", "table", "storage", "lighting",
    "decor", "chair", "drawing_room", "outdoor",
}


def test_miradorhome_searches_has_required_categories():  # @test-miradorhome-001
    """MIRADOR_HOME_SEARCHES must contain all 9 required product_type keys."""
    missing = REQUIRED_KEYS - set(MIRADOR_HOME_SEARCHES.keys())
    assert not missing, f"Missing keys: {missing}"
    assert len(MIRADOR_HOME_SEARCHES) >= 9


def test_miradorhome_searches_urls_are_https():  # @test-miradorhome-002
    """Every URL in MIRADOR_HOME_SEARCHES must start with the official https domain."""
    for product_type, urls in MIRADOR_HOME_SEARCHES.items():
        assert isinstance(urls, list) and urls, f"{product_type!r} has no URLs"
        for url in urls:
            assert url.startswith("https://www.miradorhome.com"), (
                f"Bad URL for {product_type!r}: {url}"
            )


# ===========================================================================
# 2. JSON-LD PARSER TESTS
# ===========================================================================


def test_parse_json_ld_extracts_product():  # @test-miradorhome-003
    """A valid JSON-LD fixture must produce exactly 1 well-formed product record."""
    soup = BeautifulSoup(VALID_HTML, "lxml")
    products = _parse_json_ld(soup, "decor")

    assert len(products) == 1
    p = products[0]
    assert p["brand"] == "MiradorHome"
    assert p["source"] == "miradorhome.com"
    assert p["price_currency"] == "INR"
    assert p["product_type"] == "decor"
    assert p["price_value"] == 4499.0
    assert p["product_name"] == "Mirador Brass Lotus Decor Tray"
    # Relative URL must be normalized to absolute.
    assert p["source_url"].startswith("https://www.miradorhome.com/products/")
    assert p["product_id"].startswith("MH_")
    # Required schema keys present.
    for key in (
        "product_id", "product_name", "brand", "price_value", "price_currency",
        "product_type", "room_type", "image_url", "affiliate_url", "source_url",
        "dimensions", "color", "color_hex", "material", "aesthetic_style", "source",
    ):
        assert key in p, f"Missing key {key!r} in product record"


def test_parse_json_ld_skips_low_price():  # @test-miradorhome-004
    """Records with price < 100 INR must be skipped (price floor)."""
    soup = BeautifulSoup(LOW_PRICE_HTML, "lxml")
    products = _parse_json_ld(soup, "decor")
    assert products == []


def test_parse_json_ld_skips_missing_name():  # @test-miradorhome-005
    """Records with an empty name must be skipped."""
    soup = BeautifulSoup(MISSING_NAME_HTML, "lxml")
    products = _parse_json_ld(soup, "decor")
    assert products == []


# ===========================================================================
# 3. ENTRYPOINT TESTS (mocked network)
# ===========================================================================


def test_scrape_miradorhome_returns_list():  # @test-miradorhome-006
    """scrape_miradorhome with mocked fetch_page returns a non-empty product list.

    fetch_page is patched to return the valid fixture HTML on the first call,
    then "" thereafter so each category's pagination loop terminates quickly.
    """
    call_state = {"first": True}

    def _fake_fetch(*args, **kwargs):
        if call_state["first"]:
            call_state["first"] = False
            return VALID_HTML
        return ""

    with patch("scraper.miradorhome_scraper.fetch_page", side_effect=_fake_fetch):
        result = scrape_miradorhome(max_per_category=1)

    assert isinstance(result, list)
    assert len(result) >= 1
    assert result[0]["brand"] == "MiradorHome"
    assert result[0]["source"] == "miradorhome.com"


def test_scrape_miradorhome_dedupes_by_product_id():  # @test-miradorhome-007
    """Returning the same fixture on every call must not produce duplicate product_ids."""
    # Always return the same single-product fixture — the `seen` set must collapse them.
    with patch("scraper.miradorhome_scraper.fetch_page", return_value=VALID_HTML):
        result = scrape_miradorhome(max_per_category=1)

    ids = [p["product_id"] for p in result]
    assert len(ids) == len(set(ids)), f"Duplicate product_ids detected: {ids}"
    # The fixture has exactly one unique product, so total should be 1.
    assert len(result) == 1
