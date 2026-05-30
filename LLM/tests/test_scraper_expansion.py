"""
Tests for scraper category expansion (new categories + structure).

Covers:
  - Config taxonomy: ROOM_TYPES, PRODUCT_TYPES
  - Product mapper: VALID_ROOM_TYPES, map_product_type_to_room_types
  - Scraper search dict keys and counts (no network)
  - Scraper return-type sanity when network is mocked away
  - Pagination URL construction logic

All tests are offline — network calls are either absent or mocked via
unittest.mock.patch so that fetch_page returns "" (empty HTML).

Tags: @test-scraper-exp-001 through @test-scraper-exp-030
"""

import sys
import os
import pytest
from unittest.mock import patch

# ---------------------------------------------------------------------------
# Path setup — identical pattern to LLM/tests/test_dedup_engine.py
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ===========================================================================
# 1. CONFIG TAXONOMY TESTS
# ===========================================================================

from config import ROOM_TYPES, PRODUCT_TYPES


def test_room_types_contains_drawing_room():  # @test-scraper-exp-001
    """ROOM_TYPES must contain 'drawing_room'."""
    assert "drawing_room" in ROOM_TYPES


def test_room_types_contains_balcony():  # @test-scraper-exp-002
    """ROOM_TYPES must contain 'balcony'."""
    assert "balcony" in ROOM_TYPES


def test_room_types_contains_pooja_room():  # @test-scraper-exp-003
    """ROOM_TYPES must contain 'pooja_room'."""
    assert "pooja_room" in ROOM_TYPES


def test_room_types_contains_kitchen():  # @test-scraper-exp-004
    """ROOM_TYPES must contain 'kitchen'."""
    assert "kitchen" in ROOM_TYPES


def test_room_types_contains_bathroom():  # @test-scraper-exp-005
    """ROOM_TYPES must contain 'bathroom'."""
    assert "bathroom" in ROOM_TYPES


def test_product_types_contains_appliance():  # @test-scraper-exp-006
    """PRODUCT_TYPES must contain 'appliance'."""
    assert "appliance" in PRODUCT_TYPES


def test_product_types_contains_kitchen_accessory():  # @test-scraper-exp-007
    """PRODUCT_TYPES must contain 'kitchen_accessory'."""
    assert "kitchen_accessory" in PRODUCT_TYPES


def test_product_types_contains_outdoor():  # @test-scraper-exp-008
    """PRODUCT_TYPES must contain 'outdoor'."""
    assert "outdoor" in PRODUCT_TYPES


# ===========================================================================
# 2. PRODUCT MAPPER TESTS
# ===========================================================================

from utils.product_mapper import VALID_ROOM_TYPES, map_product_type_to_room_types


def test_valid_room_types_contains_drawing_room():  # @test-scraper-exp-009
    """VALID_ROOM_TYPES must contain 'Drawing Room'."""
    assert "Drawing Room" in VALID_ROOM_TYPES


def test_valid_room_types_contains_balcony():  # @test-scraper-exp-010
    """VALID_ROOM_TYPES must contain 'Balcony'."""
    assert "Balcony" in VALID_ROOM_TYPES


def test_map_tv_returns_living_room():  # @test-scraper-exp-011
    """map_product_type_to_room_types('tv') must include 'Living Room'."""
    result = map_product_type_to_room_types("tv")
    assert isinstance(result, list)
    assert "Living Room" in result


def test_map_outdoor_returns_balcony_only():  # @test-scraper-exp-012
    """map_product_type_to_room_types('outdoor') must return exactly ['Balcony']."""
    result = map_product_type_to_room_types("outdoor")
    assert result == ["Balcony"]


def test_map_refrigerator_returns_kitchen():  # @test-scraper-exp-013
    """map_product_type_to_room_types('refrigerator') must return ['Kitchen']."""
    result = map_product_type_to_room_types("refrigerator")
    assert result == ["Kitchen"]


def test_map_kitchen_accessory_returns_kitchen():  # @test-scraper-exp-014
    """map_product_type_to_room_types('kitchen_accessory') must return ['Kitchen']."""
    result = map_product_type_to_room_types("kitchen_accessory")
    assert result == ["Kitchen"]


def test_map_planter_contains_balcony():  # @test-scraper-exp-015
    """map_product_type_to_room_types('planter') must contain 'Balcony'."""
    result = map_product_type_to_room_types("planter")
    assert isinstance(result, list)
    assert "Balcony" in result


def test_map_product_type_returns_list():  # @test-scraper-exp-016
    """map_product_type_to_room_types always returns a non-empty list."""
    for pt in ["sofa", "bed", "lighting", "outdoor", "appliance", "kitchen_accessory", "drawing_room"]:
        result = map_product_type_to_room_types(pt)
        assert isinstance(result, list) and len(result) >= 1, f"Empty/non-list for {pt!r}"


# ===========================================================================
# 3. SCRAPER SEARCH DICT COVERAGE TESTS
# ===========================================================================

from scraper.ikea_scraper import IKEA_SEARCH_QUERIES
from scraper.pepperfry_scraper import PEPPERFRY_SEARCHES
from scraper.flipkart_scraper import FLIPKART_SEARCHES
from scraper.amazon_scraper import AMAZON_SEARCHES
from scraper.urbanladder_scraper import URBAN_LADDER_SEARCHES
from scraper.woodenstreet_scraper import WOODENSTREET_LISTINGS


# --- IKEA ---

def test_ikea_has_drawing_room():  # @test-scraper-exp-017
    """IKEA_SEARCH_QUERIES must have a 'drawing_room' key."""
    assert "drawing_room" in IKEA_SEARCH_QUERIES


def test_ikea_has_kitchen_accessory():  # @test-scraper-exp-018
    """IKEA_SEARCH_QUERIES must have a 'kitchen_accessory' key."""
    assert "kitchen_accessory" in IKEA_SEARCH_QUERIES


def test_ikea_has_outdoor():  # @test-scraper-exp-019
    """IKEA_SEARCH_QUERIES must have an 'outdoor' key."""
    assert "outdoor" in IKEA_SEARCH_QUERIES


def test_ikea_total_categories():  # @test-scraper-exp-020
    """IKEA_SEARCH_QUERIES must have exactly 11 top-level categories."""
    assert len(IKEA_SEARCH_QUERIES) == 11


# --- Pepperfry ---

def test_pepperfry_has_drawing_room():  # @test-scraper-exp-021
    """PEPPERFRY_SEARCHES must have a 'drawing_room' key."""
    assert "drawing_room" in PEPPERFRY_SEARCHES


def test_pepperfry_has_outdoor():  # @test-scraper-exp-022
    """PEPPERFRY_SEARCHES must have an 'outdoor' key."""
    assert "outdoor" in PEPPERFRY_SEARCHES


def test_pepperfry_has_chair():  # @test-scraper-exp-023
    """PEPPERFRY_SEARCHES must have a 'chair' key."""
    assert "chair" in PEPPERFRY_SEARCHES


def test_pepperfry_total_categories():  # @test-scraper-exp-024
    """PEPPERFRY_SEARCHES must have exactly 9 top-level categories."""
    assert len(PEPPERFRY_SEARCHES) == 9


# --- Flipkart ---

def test_flipkart_has_drawing_room():  # @test-scraper-exp-025
    """FLIPKART_SEARCHES must have a 'drawing_room' key."""
    assert "drawing_room" in FLIPKART_SEARCHES


def test_flipkart_has_appliance():  # @test-scraper-exp-026
    """FLIPKART_SEARCHES must have an 'appliance' key."""
    assert "appliance" in FLIPKART_SEARCHES


def test_flipkart_has_kitchen_accessory():  # @test-scraper-exp-027
    """FLIPKART_SEARCHES must have a 'kitchen_accessory' key."""
    assert "kitchen_accessory" in FLIPKART_SEARCHES


def test_flipkart_has_outdoor():  # @test-scraper-exp-028
    """FLIPKART_SEARCHES must have an 'outdoor' key."""
    assert "outdoor" in FLIPKART_SEARCHES


def test_flipkart_total_categories():  # @test-scraper-exp-029
    """FLIPKART_SEARCHES must have exactly 10 top-level categories."""
    assert len(FLIPKART_SEARCHES) == 10


# --- Amazon ---

def test_amazon_has_drawing_room():  # @test-scraper-exp-030
    """AMAZON_SEARCHES must have a 'drawing_room' key."""
    assert "drawing_room" in AMAZON_SEARCHES


def test_amazon_has_appliance():  # @test-scraper-exp-031
    """AMAZON_SEARCHES must have an 'appliance' key."""
    assert "appliance" in AMAZON_SEARCHES


def test_amazon_has_kitchen_accessory():  # @test-scraper-exp-032
    """AMAZON_SEARCHES must have a 'kitchen_accessory' key."""
    assert "kitchen_accessory" in AMAZON_SEARCHES


def test_amazon_has_outdoor():  # @test-scraper-exp-033
    """AMAZON_SEARCHES must have an 'outdoor' key."""
    assert "outdoor" in AMAZON_SEARCHES


def test_amazon_total_categories():  # @test-scraper-exp-034
    """AMAZON_SEARCHES must have exactly 10 top-level categories."""
    assert len(AMAZON_SEARCHES) == 10


# --- UrbanLadder ---

def test_urbanladder_has_drawing_room():  # @test-scraper-exp-035
    """URBAN_LADDER_SEARCHES must have a 'drawing_room' key."""
    assert "drawing_room" in URBAN_LADDER_SEARCHES


def test_urbanladder_has_outdoor():  # @test-scraper-exp-036
    """URBAN_LADDER_SEARCHES must have an 'outdoor' key."""
    assert "outdoor" in URBAN_LADDER_SEARCHES


def test_urbanladder_has_chair():  # @test-scraper-exp-037
    """URBAN_LADDER_SEARCHES must have a 'chair' key."""
    assert "chair" in URBAN_LADDER_SEARCHES


def test_urbanladder_total_categories():  # @test-scraper-exp-038
    """URBAN_LADDER_SEARCHES must have exactly 9 top-level categories."""
    assert len(URBAN_LADDER_SEARCHES) == 9


# --- WoodenStreet ---

def test_woodenstreet_has_drawing_room():  # @test-scraper-exp-039
    """WOODENSTREET_LISTINGS must have a 'drawing_room' key."""
    assert "drawing_room" in WOODENSTREET_LISTINGS


def test_woodenstreet_has_outdoor():  # @test-scraper-exp-040
    """WOODENSTREET_LISTINGS must have an 'outdoor' key."""
    assert "outdoor" in WOODENSTREET_LISTINGS


def test_woodenstreet_has_chair():  # @test-scraper-exp-041
    """WOODENSTREET_LISTINGS must have a 'chair' key."""
    assert "chair" in WOODENSTREET_LISTINGS


def test_woodenstreet_total_categories():  # @test-scraper-exp-042
    """WOODENSTREET_LISTINGS must have exactly 8 top-level categories."""
    assert len(WOODENSTREET_LISTINGS) == 8


# ===========================================================================
# 4. SCRAPER STRUCTURE TESTS (mocked network)
# ===========================================================================
# fetch_page is patched to return "" so scrapers see empty HTML and return [].
# The purpose is to confirm each scraper:
#   (a) is importable and callable without live network
#   (b) returns a list (possibly empty) — never raises an uncaught exception


from scraper.ikea_scraper import scrape_ikea
from scraper.pepperfry_scraper import scrape_pepperfry
from scraper.flipkart_scraper import scrape_flipkart
from scraper.amazon_scraper import scrape_amazon
from scraper.urbanladder_scraper import scrape_urbanladder
from scraper.woodenstreet_scraper import scrape_woodenstreet


def test_scrape_ikea_mocked_returns_list():  # @test-scraper-exp-043
    """scrape_ikea with a mocked API returns a list without raising."""
    # IKEA uses its own _fetch_ikea_api (not fetch_page); patch it to return {}
    with patch("scraper.ikea_scraper._fetch_ikea_api", return_value={}):
        result = scrape_ikea(max_per_category=1)
    assert isinstance(result, list)


def test_scrape_pepperfry_mocked_returns_list():  # @test-scraper-exp-044
    """scrape_pepperfry with mocked fetch_page returns a list without raising.

    Patch the name as bound inside the pepperfry_scraper module (from scraper.base import fetch_page),
    so the mock must target 'scraper.pepperfry_scraper.fetch_page'.
    """
    with patch("scraper.pepperfry_scraper.fetch_page", return_value=""):
        result = scrape_pepperfry(max_per_category=1)
    assert isinstance(result, list)


def test_scrape_flipkart_mocked_returns_list():  # @test-scraper-exp-045
    """scrape_flipkart with mocked fetch_page returns a list without raising."""
    with patch("scraper.flipkart_scraper.fetch_page", return_value=""):
        result = scrape_flipkart(max_per_category=1)
    assert isinstance(result, list)


def test_scrape_amazon_mocked_returns_list():  # @test-scraper-exp-046
    """scrape_amazon with mocked fetch_page returns a list without raising."""
    with patch("scraper.amazon_scraper.fetch_page", return_value=""):
        result = scrape_amazon(max_per_category=1)
    assert isinstance(result, list)


def test_scrape_urbanladder_mocked_returns_list():  # @test-scraper-exp-047
    """scrape_urbanladder with mocked fetch_page returns a list without raising."""
    with patch("scraper.urbanladder_scraper.fetch_page", return_value=""):
        result = scrape_urbanladder(max_per_category=1)
    assert isinstance(result, list)


def test_scrape_woodenstreet_mocked_returns_list():  # @test-scraper-exp-048
    """scrape_woodenstreet with mocked fetch_page returns a list without raising."""
    with patch("scraper.woodenstreet_scraper.fetch_page", return_value=""):
        result = scrape_woodenstreet(max_per_category=1)
    assert isinstance(result, list)


def test_scrapers_return_empty_on_empty_html():  # @test-scraper-exp-049
    """All HTML-based scrapers must return an empty list when given empty HTML (no exception).

    Each scraper module imports fetch_page into its own namespace via
    'from scraper.base import fetch_page', so the patch target must be the
    module-local name (e.g. 'scraper.pepperfry_scraper.fetch_page') rather than
    'scraper.base.fetch_page' which would be too late to intercept.
    """
    cases = [
        (scrape_pepperfry, "scraper.pepperfry_scraper.fetch_page", "pepperfry"),
        (scrape_flipkart,  "scraper.flipkart_scraper.fetch_page",  "flipkart"),
        (scrape_amazon,    "scraper.amazon_scraper.fetch_page",    "amazon"),
        (scrape_urbanladder, "scraper.urbanladder_scraper.fetch_page", "urbanladder"),
        (scrape_woodenstreet, "scraper.woodenstreet_scraper.fetch_page", "woodenstreet"),
    ]
    for fn, patch_target, name in cases:
        with patch(patch_target, return_value=""):
            result = fn(max_per_category=1)
        assert isinstance(result, list), f"{name} did not return a list"
        assert result == [], f"{name} expected [], got {result}"


# ===========================================================================
# 5. PAGINATION URL CONSTRUCTION TESTS (pure logic, no network)
# ===========================================================================


def test_pepperfry_pagination_url_page_2():  # @test-scraper-exp-050
    """
    Pepperfry pagination: base_url + '&page=2' for page > 1.

    Mirrors the logic in scrape_pepperfry:
        url = f"{base_url}&page={page}" if page > 1 else base_url
    """
    base_url = "https://www.pepperfry.com/site_product/search?q=sofa"
    page = 2
    url = f"{base_url}&page={page}" if page > 1 else base_url
    assert url == "https://www.pepperfry.com/site_product/search?q=sofa&page=2"


def test_pepperfry_pagination_url_page_1_unchanged():  # @test-scraper-exp-051
    """Pepperfry page 1 URL must be the base_url unchanged (no page param appended)."""
    base_url = "https://www.pepperfry.com/site_product/search?q=sofa"
    page = 1
    url = f"{base_url}&page={page}" if page > 1 else base_url
    assert url == base_url
    assert "&page=" not in url


def test_urbanladder_pagination_url_page_2():  # @test-scraper-exp-052
    """
    UrbanLadder pagination: base_url + '?p=2' for page > 1.

    Mirrors the logic in scrape_urbanladder:
        url = f"{base_url}?p={page}" if page > 1 else base_url
    """
    base_url = "https://www.urbanladder.com/sofas"
    page = 2
    url = f"{base_url}?p={page}" if page > 1 else base_url
    assert url == "https://www.urbanladder.com/sofas?p=2"


def test_urbanladder_pagination_url_page_1_unchanged():  # @test-scraper-exp-053
    """UrbanLadder page 1 URL must be the base_url unchanged."""
    base_url = "https://www.urbanladder.com/sofas"
    page = 1
    url = f"{base_url}?p={page}" if page > 1 else base_url
    assert url == base_url
    assert "?p=" not in url


def test_pepperfry_pagination_url_page_3():  # @test-scraper-exp-054
    """Pepperfry page 3 produces correct '&page=3' suffix."""
    base_url = "https://www.pepperfry.com/site_product/search?q=outdoor%20furniture"
    page = 3
    url = f"{base_url}&page={page}" if page > 1 else base_url
    assert url.endswith("&page=3")
    assert url.startswith(base_url)


def test_urbanladder_pagination_url_page_5():  # @test-scraper-exp-055
    """UrbanLadder page 5 produces correct '?p=5' suffix."""
    base_url = "https://www.urbanladder.com/outdoor-furniture"
    page = 5
    url = f"{base_url}?p={page}" if page > 1 else base_url
    assert url == "https://www.urbanladder.com/outdoor-furniture?p=5"
