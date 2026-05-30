"""
HomeLane Product Scraper.

Parses HomeLane listing pages (Next.js / server-rendered React) using
JSON-LD Product blocks where available.
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

# NOTE: URL paths below are best-effort guesses based on HomeLane's public
# catalogue structure (https://www.homelane.com/products/<slug>). Confirm
# exact slugs during the next live crawl — they may need adjustment.
HOMELANE_SEARCHES = {
    "sofa": [
        "https://www.homelane.com/products/sofas",
        "https://www.homelane.com/products/sofa-sets",
    ],
    "bed": [
        "https://www.homelane.com/products/beds",
        "https://www.homelane.com/products/king-beds",
    ],
    "table": [
        "https://www.homelane.com/products/dining-tables",
        "https://www.homelane.com/products/coffee-tables",
        "https://www.homelane.com/products/study-tables",
    ],
    "storage": [
        "https://www.homelane.com/products/wardrobes",
        "https://www.homelane.com/products/bookshelves",
        "https://www.homelane.com/products/shoe-racks",
    ],
    "lighting": [
        "https://www.homelane.com/products/lighting",
        "https://www.homelane.com/products/floor-lamps",
        "https://www.homelane.com/products/table-lamps",
    ],
    "decor": [
        "https://www.homelane.com/products/home-decor",
        "https://www.homelane.com/products/wall-decor",
        "https://www.homelane.com/products/mirrors",
    ],
    "chair": [
        "https://www.homelane.com/products/dining-chairs",
        "https://www.homelane.com/products/accent-chairs",
        "https://www.homelane.com/products/office-chairs",
    ],
    "drawing_room": [
        "https://www.homelane.com/products/drawing-room-furniture",
        "https://www.homelane.com/products/display-units",
    ],
    "outdoor": [
        "https://www.homelane.com/products/outdoor-furniture",
        "https://www.homelane.com/products/balcony-furniture",
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
                    url = "https://www.homelane.com" + url

                color_name, color_hex = extract_color(name)
                material = extract_material(name)
                style = map_aesthetic_style(product_type, name, "")

                pid = f"HL_{abs(hash((name, url))) % 100000000}"
                room_types = map_product_type_to_room_types(product_type)

                products.append({
                    "product_id": pid,
                    "product_name": name,
                    "brand": "HomeLane",
                    "price_value": price,
                    "price_currency": "INR",
                    "product_type": product_type,
                    "room_type": room_types[0] if room_types else "Living Room",
                    "image_url": image if isinstance(image, str) else "",
                    "affiliate_url": build_affiliate_url(url, "homelane.com"),
                    "source_url": url,
                    "dimensions": "",
                    "color": color_name,
                    "color_hex": color_hex,
                    "material": material,
                    "aesthetic_style": style,
                    "source": "homelane.com",
                })

    return products


def scrape_homelane(max_per_category: int = 200) -> list[dict]:
    logger.info("Starting HomeLane scraper...")
    session = get_session()
    all_products = []
    seen = set()

    for product_type, urls in HOMELANE_SEARCHES.items():
        added = 0
        for base_url in urls:
            max_pages = min((max_per_category // 20) + 1, 10)  # cap at ~10 pages

            for page in range(1, max_pages + 1):
                url = f"{base_url}?page={page}" if page > 1 else base_url
                html = fetch_page(url, session=session, delay=2.0)
                if not html:
                    break

                soup = BeautifulSoup(html, "lxml")
                products = _parse_json_ld(soup, product_type)

                if not products:
                    logger.info(f"  -> No products on page {page} for HL [{product_type}], stopping")
                    break

                new_count = 0
                for p in products:
                    if p["product_id"] in seen:
                        continue
                    seen.add(p["product_id"])
                    all_products.append(p)
                    added += 1
                    new_count += 1

                logger.info(f"HomeLane [{product_type}] page {page} -> {new_count} new (cat total: {added}, grand: {len(all_products)})")

                if added >= max_per_category:
                    break

            if added >= max_per_category:
                break

        logger.info(f"HomeLane [{product_type}] -> {added} added (total: {len(all_products)})")

    logger.info(f"HomeLane scraping complete: {len(all_products)} products")
    return all_products
