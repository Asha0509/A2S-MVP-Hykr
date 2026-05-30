"""
IKEA India Product Scraper — API-based.

Uses IKEA's internal search API (sik.search.blue.cdtapps.com)
which returns structured JSON — no HTML parsing needed.

Categories scraped:
    - Sofas & armchairs
    - Beds & mattresses
    - Lighting & lamps
    - Storage & wardrobes
    - Tables & desks
    - Decoration & mirrors
    - Chairs & seating
    - Textiles (curtains, rugs)
"""

import json
import time
import random
import logging
from typing import Optional

import requests
from scraper.base import get_session, get_headers, clean_text, logger, extract_color, map_aesthetic_style, build_affiliate_url

# ──────────────────────────────────────────────
# IKEA search queries by product type
# ──────────────────────────────────────────────
IKEA_SEARCH_QUERIES = {
    "sofa": ["sofa", "armchair", "recliner", "sofa bed", "loveseat", "couch"],
    "bed": ["bed frame", "mattress", "bed with storage", "divan bed", "bunk bed", "day bed"],
    "lighting": ["ceiling lamp", "table lamp", "floor lamp", "pendant lamp", "wall lamp", "LED light strip", "desk lamp"],
    "storage": ["bookshelf", "wardrobe", "shelf unit", "chest of drawers", "tv unit", "cabinet", "shoe storage"],
    "table": ["desk", "dining table", "coffee table", "side table", "bar table", "console table"],
    "decor": ["mirror", "clock", "vase", "picture frame", "candle holder", "artificial plant", "cushion cover"],
    "chair": ["dining chair", "office chair", "stool", "bench", "rocking chair"],
    "textile": ["curtain", "rug", "throw blanket", "bedspread", "towel set"],
    "drawing_room": ["accent chair", "display cabinet", "show piece", "wall art frame", "decorative tray", "occasional table"],
    "kitchen_accessory": ["frying pan", "cooking pot", "knife set", "cutting board", "mixing bowl", "colander", "spatula set", "storage jar"],
    "outdoor": ["outdoor chair", "garden furniture", "outdoor table", "planter pot", "outdoor rug", "balcony set", "folding chair"],
}

IKEA_API_BASE = "https://sik.search.blue.cdtapps.com/in/en/search-result-page"


def _fetch_ikea_api(query: str, size: int = 50, session: Optional[requests.Session] = None) -> dict:
    """
    Call IKEA's search API and return the JSON response.

    Args:
        query: Search term.
        size: Number of results to request.
        session: Optional requests session.

    Returns:
        API response as dict, or empty dict on failure.
    """
    sess = session or get_session()

    params = {
        "q": query,
        "size": size,
        "types": "PRODUCT",
        "subcategories-style": "tree-navigation",
        "sort": "RELEVANCE",
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-IN,en;q=0.9",
        "Origin": "https://www.ikea.com",
        "Referer": "https://www.ikea.com/",
    }

    # Polite delay
    time.sleep(1.5 + random.uniform(0.5, 1.5))

    try:
        resp = sess.get(IKEA_API_BASE, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.warning(f"IKEA API error for '{query}': {e}")
        return {}


def _parse_ikea_product(item: dict, product_type: str) -> Optional[dict]:
    """
    Parse a single product from the IKEA API response.

    Args:
        item: Product item dict from API.
        product_type: Category type (sofa, bed, etc.)

    Returns:
        Cleaned product dict or None.
    """
    try:
        product = item.get("product", {})
        if not product:
            return None

        name = clean_text(product.get("name", ""))
        description = clean_text(product.get("typeName", ""))
        full_name = f"{name} - {description}" if description else name

        if not full_name or len(full_name) < 3:
            return None

        # Price
        sales_price = product.get("salesPrice", {})
        current = sales_price.get("current", {})
        price = None

        # Try whole number first
        whole = current.get("wholeNumber")
        if whole:
            try:
                price = float(str(whole).replace(",", "").replace(" ", ""))
            except ValueError:
                pass

        # Try prefix (full formatted price)
        if not price:
            prefix = current.get("prefix", "")
            if prefix:
                import re
                nums = re.findall(r"[\d,]+", prefix)
                if nums:
                    try:
                        price = float(nums[0].replace(",", ""))
                    except ValueError:
                        pass

        if not price or price < 100:
            return None

        # Image
        image_url = product.get("mainImageUrl", "")
        if image_url and not image_url.startswith("http"):
            image_url = "https:" + image_url if image_url.startswith("//") else ""

        # Product URL
        product_url = product.get("pipUrl", "")
        if product_url and not product_url.startswith("http"):
            product_url = "https://www.ikea.com" + product_url

        # Product ID
        product_id = product.get("id", "") or product.get("itemNoGlobal", "")
        if not product_id:
            product_id = f"IKEA_{hash(full_name) % 100000:05d}"
        else:
            product_id = f"IKEA_{product_id}"

        # Dimensions from measurement reference
        dimensions = clean_text(product.get("itemMeasureReferenceText", ""))

        # Colors
        colors = product.get("colors", [])
        color_str = ", ".join([c.get("name", "") for c in colors if c.get("name")]) if colors else ""
        
        # Extract primary color and hex
        primary_color = colors[0].get("name", "") if colors else color_str
        color_name, color_hex = extract_color(primary_color)
        if not color_name:
            color_name, color_hex = extract_color(full_name)

        # Quick facts
        quick_facts = product.get("quickFacts", [])
        material = ""
        if quick_facts:
            for fact in quick_facts:
                if "material" in str(fact).lower():
                    material = clean_text(str(fact))
                    break

        # Aesthetic style
        aesthetic_style = map_aesthetic_style(product_type, full_name, material)

        return {
            "product_id": product_id,
            "product_name": full_name,
            "brand": "IKEA",
            "price_value": price,
            "price_currency": "INR",
            "product_type": product_type,
            "image_url": image_url,
            "affiliate_url": build_affiliate_url(product_url, "ikea.com"),
            "source_url": product_url,
            "dimensions": dimensions,
            "color": color_name or color_str,
            "color_hex": color_hex,
            "material": material,
            "aesthetic_style": aesthetic_style,
            "source": "ikea.com",
        }

    except Exception as e:
        logger.debug(f"Failed to parse IKEA product: {e}")
        return None


def scrape_ikea(max_per_category: int = 200) -> list[dict]:
    """
    Scrape products from IKEA India using their search API.

    Args:
        max_per_category: Max products per query.

    Returns:
        List of product dicts.
    """
    logger.info("Starting IKEA India API scraper...")
    session = get_session()
    all_products = []
    seen_ids = set()

    for product_type, queries in IKEA_SEARCH_QUERIES.items():
        for query in queries:
            logger.info(f"IKEA API [{product_type}] query='{query}'")
            data = _fetch_ikea_api(query, size=max_per_category, session=session)

            # Extract items from response
            items = (
                data.get("searchResultPage", {})
                .get("products", {})
                .get("main", {})
                .get("items", [])
            )

            count = 0
            for item in items:
                product = _parse_ikea_product(item, product_type)
                if product:
                    pid = product["product_id"]
                    if pid not in seen_ids:
                        seen_ids.add(pid)
                        all_products.append(product)
                        count += 1

            logger.info(f"  → Parsed {count} new products (total: {len(all_products)})")

    logger.info(f"IKEA scraping complete: {len(all_products)} products")
    return all_products
