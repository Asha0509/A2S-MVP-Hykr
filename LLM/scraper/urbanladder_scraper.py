"""
Urban Ladder Product Scraper.

Parses Urban Ladder listing pages with JSON-LD when available.
"""

import json

from bs4 import BeautifulSoup

from scraper.base import (
    get_session,
    fetch_page,
    clean_price,
    clean_text,
    logger,
    extract_color,
    extract_material,
    map_aesthetic_style,
    build_affiliate_url,
)
from utils.product_mapper import map_product_type_to_room_types

URBAN_LADDER_SEARCHES = {
    "sofa": [
        "https://www.urbanladder.com/sofas",
        "https://www.urbanladder.com/recliners",
        "https://www.urbanladder.com/sofa-cum-beds",
    ],
    "bed": [
        "https://www.urbanladder.com/beds",
        "https://www.urbanladder.com/bunk-beds",
    ],
    "table": [
        "https://www.urbanladder.com/coffee-tables",
        "https://www.urbanladder.com/dining-tables",
        "https://www.urbanladder.com/console-tables",
        "https://www.urbanladder.com/side-tables",
    ],
    "storage": [
        "https://www.urbanladder.com/bookshelves",
        "https://www.urbanladder.com/wardrobes",
        "https://www.urbanladder.com/shoe-racks",
    ],
    "lighting": [
        "https://www.urbanladder.com/lighting",
        "https://www.urbanladder.com/floor-lamps",
        "https://www.urbanladder.com/table-lamps",
    ],
    "decor": [
        "https://www.urbanladder.com/home-decor",
        "https://www.urbanladder.com/mirrors",
        "https://www.urbanladder.com/wall-decor",
    ],
    "chair": [
        "https://www.urbanladder.com/dining-chairs",
        "https://www.urbanladder.com/accent-chairs",
        "https://www.urbanladder.com/study-chairs",
    ],
    "drawing_room": [
        "https://www.urbanladder.com/display-units",
        "https://www.urbanladder.com/accent-chairs",
    ],
    "outdoor": [
        "https://www.urbanladder.com/outdoor-furniture",
    ],
}


def _parse_json_ld(soup: BeautifulSoup, product_type: str) -> list[dict]:
    products = []

    scripts = soup.find_all("script", type="application/ld+json")
    for script in scripts:
        raw = script.string or script.get_text() or ""
        if not raw.strip():
            continue

        try:
            data = json.loads(raw)
        except Exception:
            continue

        payloads = data if isinstance(data, list) else [data]

        for payload in payloads:
            if not isinstance(payload, dict):
                continue

            if payload.get("@type") == "Product":
                name = clean_text(payload.get("name", ""))
                url = payload.get("url", "")
                image = payload.get("image", "")
                offers = payload.get("offers", {}) if isinstance(payload.get("offers", {}), dict) else {}
                price = clean_price(offers.get("price", ""))

                if not name or not url or not price or price < 100:
                    continue

                if url.startswith("/"):
                    url = "https://www.urbanladder.com" + url

                color_name, color_hex = extract_color(name)
                material = extract_material(name)
                style = map_aesthetic_style(product_type, name, "")

                pid = f"UL_{abs(hash((name, url))) % 100000000}"
                room_types = map_product_type_to_room_types(product_type)
                
                products.append({
                    "product_id": pid,
                    "product_name": name,
                    "brand": "Urban Ladder",
                    "price_value": price,
                    "price_currency": "INR",
                    "product_type": product_type,
                    "room_type": room_types[0] if room_types else "Living Room",  # Primary room type
                    "image_url": image if isinstance(image, str) else "",
                    "affiliate_url": build_affiliate_url(url, "urbanladder.com"),
                    "source_url": url,
                    "dimensions": "",
                    "color": color_name,
                    "color_hex": color_hex,
                    "material": material,
                    "aesthetic_style": style,
                    "source": "urbanladder.com",
                })

    return products


def scrape_urbanladder(max_per_category: int = 200) -> list[dict]:
    logger.info("Starting Urban Ladder scraper...")
    session = get_session()
    all_products = []
    seen = set()

    for product_type, urls in URBAN_LADDER_SEARCHES.items():
        added = 0
        for base_url in urls:
            max_pages = (max_per_category // 20) + 1  # ~20 products per page

            for page in range(1, max_pages + 1):
                url = f"{base_url}?p={page}" if page > 1 else base_url
                html = fetch_page(url, session=session, delay=2.0)
                if not html:
                    break

                soup = BeautifulSoup(html, "lxml")
                products = _parse_json_ld(soup, product_type)

                if not products:
                    logger.info(f"  → No products on page {page} for UL [{product_type}], stopping")
                    break

                new_count = 0
                for p in products:
                    if p["product_id"] in seen:
                        continue
                    seen.add(p["product_id"])
                    all_products.append(p)
                    added += 1
                    new_count += 1

                logger.info(f"UrbanLadder [{product_type}] page {page} -> {new_count} new (cat total: {added}, grand: {len(all_products)})")

                if added >= max_per_category:
                    break

            if added >= max_per_category:
                break

        logger.info(f"UrbanLadder [{product_type}] -> {added} added (total: {len(all_products)})")

    logger.info(f"Urban Ladder scraping complete: {len(all_products)} products")
    return all_products
