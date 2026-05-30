"""
Nilkamal Product Scraper.

Parses Nilkamal (Shopify-backed) collection pages via JSON-LD blocks.
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

# Collection URLs on https://www.nilkamalfurniture.com.
# Paths are best-effort guesses based on Nilkamal's Shopify storefront
# collection conventions; verify and adjust during integration if needed.
NILKAMAL_SEARCHES: dict[str, list[str]] = {
    "sofa": [
        "https://www.nilkamalfurniture.com/collections/sofas",
        "https://www.nilkamalfurniture.com/collections/sofa-cum-beds",
        "https://www.nilkamalfurniture.com/collections/recliners",
    ],
    "bed": [
        "https://www.nilkamalfurniture.com/collections/beds",
        "https://www.nilkamalfurniture.com/collections/king-size-beds",
        "https://www.nilkamalfurniture.com/collections/queen-size-beds",
    ],
    "table": [
        "https://www.nilkamalfurniture.com/collections/dining-tables",
        "https://www.nilkamalfurniture.com/collections/coffee-tables",
        "https://www.nilkamalfurniture.com/collections/study-tables",
    ],
    "storage": [
        "https://www.nilkamalfurniture.com/collections/wardrobes",
        "https://www.nilkamalfurniture.com/collections/almirahs",
        "https://www.nilkamalfurniture.com/collections/shoe-racks",
    ],
    "lighting": [
        # Nilkamal lighting catalog is limited; collection slug guessed.
        "https://www.nilkamalfurniture.com/collections/lighting",
        "https://www.nilkamalfurniture.com/collections/lamps",
    ],
    "decor": [
        "https://www.nilkamalfurniture.com/collections/home-decor",
        "https://www.nilkamalfurniture.com/collections/mirrors",
    ],
    "chair": [
        "https://www.nilkamalfurniture.com/collections/office-chairs",
        "https://www.nilkamalfurniture.com/collections/dining-chairs",
        "https://www.nilkamalfurniture.com/collections/plastic-chairs",
    ],
    "drawing_room": [
        # Drawing room / formal seating sets — slug guessed.
        "https://www.nilkamalfurniture.com/collections/living-room",
        "https://www.nilkamalfurniture.com/collections/accent-chairs",
    ],
    "outdoor": [
        "https://www.nilkamalfurniture.com/collections/outdoor",
        "https://www.nilkamalfurniture.com/collections/garden-furniture",
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
                offers_raw = payload.get("offers", {})
                offers = offers_raw if isinstance(offers_raw, dict) else {}
                # Shopify can also emit offers as a list — pick the first entry.
                if isinstance(offers_raw, list) and offers_raw:
                    first = offers_raw[0]
                    if isinstance(first, dict):
                        offers = first
                price = clean_price(offers.get("price", ""))

                if not name or not url or not price or price < 100:
                    continue

                if url.startswith("/"):
                    url = "https://www.nilkamalfurniture.com" + url

                # image can be a list on Shopify JSON-LD; normalise to first string.
                if isinstance(image, list):
                    image = image[0] if image else ""
                if not isinstance(image, str):
                    image = ""

                color_name, color_hex = extract_color(name)
                material = extract_material(name)
                style = map_aesthetic_style(product_type, name, "")

                pid = f"NK_{abs(hash((name, url))) % 100000000}"
                room_types = map_product_type_to_room_types(product_type)

                products.append({
                    "product_id": pid,
                    "product_name": name,
                    "brand": "Nilkamal",
                    "price_value": price,
                    "price_currency": "INR",
                    "product_type": product_type,
                    "room_type": room_types[0] if room_types else "Living Room",
                    "image_url": image,
                    "affiliate_url": build_affiliate_url(url, "nilkamal.com"),
                    "source_url": url,
                    "dimensions": "",
                    "color": color_name,
                    "color_hex": color_hex,
                    "material": material,
                    "aesthetic_style": style,
                    "source": "nilkamal.com",
                })

    return products


def scrape_nilkamal(max_per_category: int = 200) -> list[dict]:
    logger.info("Starting Nilkamal scraper...")
    session = get_session()
    all_products = []
    seen = set()

    for product_type, urls in NILKAMAL_SEARCHES.items():
        added = 0
        for base_url in urls:
            max_pages = (max_per_category // 20) + 1  # ~20 products per page

            for page in range(1, max_pages + 1):
                # Shopify-style pagination uses ?page=N
                url = f"{base_url}?page={page}" if page > 1 else base_url
                html = fetch_page(url, session=session, delay=2.0)
                if not html:
                    break

                soup = BeautifulSoup(html, "lxml")
                products = _parse_json_ld(soup, product_type)

                if not products:
                    logger.info(f"  → No products on page {page} for NK [{product_type}], stopping")
                    break

                new_count = 0
                for p in products:
                    if p["product_id"] in seen:
                        continue
                    seen.add(p["product_id"])
                    all_products.append(p)
                    added += 1
                    new_count += 1

                logger.info(f"Nilkamal [{product_type}] page {page} -> {new_count} new (cat total: {added}, grand: {len(all_products)})")

                if added >= max_per_category:
                    break

            if added >= max_per_category:
                break

        logger.info(f"Nilkamal [{product_type}] -> {added} added (total: {len(all_products)})")

    logger.info(f"Nilkamal scraping complete: {len(all_products)} products")
    return all_products
