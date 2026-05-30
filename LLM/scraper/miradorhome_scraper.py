"""
MiradorHome Product Scraper.

Parses MiradorHome collection pages, expecting Shopify-style JSON-LD Product blocks.
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

# Base domain assumption: MiradorHome appears to operate at miradorhome.com.
# Boutique Indian decor brands commonly run on Shopify, so collection-style URLs
# (/collections/<slug>) are the safest default. Each entry below is a best-guess
# slug — flagged inline where uncertainty is highest.
MIRADOR_HOME_SEARCHES: dict[str, list[str]] = {
    "sofa": [
        "https://www.miradorhome.com/collections/sofas",
        "https://www.miradorhome.com/collections/seating",  # fallback slug guess
    ],
    "bed": [
        "https://www.miradorhome.com/collections/beds",
        "https://www.miradorhome.com/collections/bedroom",  # fallback slug guess
    ],
    "table": [
        "https://www.miradorhome.com/collections/tables",
        "https://www.miradorhome.com/collections/coffee-tables",
        "https://www.miradorhome.com/collections/side-tables",
    ],
    "storage": [
        "https://www.miradorhome.com/collections/storage",
        "https://www.miradorhome.com/collections/cabinets",  # slug guess
    ],
    "lighting": [
        "https://www.miradorhome.com/collections/lighting",
        "https://www.miradorhome.com/collections/lamps",  # slug guess
    ],
    "decor": [
        "https://www.miradorhome.com/collections/decor",
        "https://www.miradorhome.com/collections/home-decor",
        "https://www.miradorhome.com/collections/wall-decor",  # slug guess
    ],
    "chair": [
        "https://www.miradorhome.com/collections/chairs",
        "https://www.miradorhome.com/collections/accent-chairs",  # slug guess
    ],
    "drawing_room": [
        # Drawing-room is rarely an explicit collection on Shopify stores;
        # closest curated collections are "living-room" or accent pieces.
        "https://www.miradorhome.com/collections/living-room",
        "https://www.miradorhome.com/collections/accent-furniture",  # slug guess
    ],
    "outdoor": [
        "https://www.miradorhome.com/collections/outdoor",
        "https://www.miradorhome.com/collections/garden",  # slug guess
    ],
}


def _parse_json_ld(soup: BeautifulSoup, product_type: str) -> list[dict]:
    """Parse JSON-LD Product blocks from a MiradorHome listing page."""
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
                price = clean_price(offers.get("price", ""))

                if not name or not url or not price or price < 100:
                    continue

                # Absolute-URL normalization — MiradorHome links may be relative.
                if url.startswith("/"):
                    url = "https://www.miradorhome.com" + url

                # Image may be a list in some Shopify JSON-LD payloads.
                if isinstance(image, list):
                    image = image[0] if image else ""

                color_name, color_hex = extract_color(name)
                material = extract_material(name)
                style = map_aesthetic_style(product_type, name, "")

                pid = f"MH_{abs(hash((name, url))) % 100000000}"
                room_types = map_product_type_to_room_types(product_type)

                products.append({
                    "product_id": pid,
                    "product_name": name,
                    "brand": "MiradorHome",
                    "price_value": price,
                    "price_currency": "INR",
                    "product_type": product_type,
                    "room_type": room_types[0] if room_types else "Living Room",
                    "image_url": image if isinstance(image, str) else "",
                    "affiliate_url": build_affiliate_url(url, "miradorhome.com"),
                    "source_url": url,
                    "dimensions": "",
                    "color": color_name,
                    "color_hex": color_hex,
                    "material": material,
                    "aesthetic_style": style,
                    "source": "miradorhome.com",
                })

    return products


def scrape_miradorhome(max_per_category: int = 200) -> list[dict]:
    """Entrypoint: walk all MiradorHome collections and return product records."""
    logger.info("Starting MiradorHome scraper...")
    session = get_session()
    all_products = []
    seen = set()

    for product_type, urls in MIRADOR_HOME_SEARCHES.items():
        added = 0
        for base_url in urls:
            # Shopify collections paginate via ?page=N; ~24 products per page is typical.
            max_pages = (max_per_category // 20) + 1

            for page in range(1, max_pages + 1):
                url = f"{base_url}?page={page}" if page > 1 else base_url
                html = fetch_page(url, session=session, delay=2.0)
                if not html:
                    break

                soup = BeautifulSoup(html, "lxml")
                products = _parse_json_ld(soup, product_type)

                if not products:
                    logger.info(f"  → No products on page {page} for MH [{product_type}], stopping")
                    break

                new_count = 0
                for p in products:
                    if p["product_id"] in seen:
                        continue
                    seen.add(p["product_id"])
                    all_products.append(p)
                    added += 1
                    new_count += 1

                logger.info(
                    f"MiradorHome [{product_type}] page {page} -> {new_count} new "
                    f"(cat total: {added}, grand: {len(all_products)})"
                )

                if added >= max_per_category:
                    break

            if added >= max_per_category:
                break

        logger.info(f"MiradorHome [{product_type}] -> {added} added (total: {len(all_products)})")

    logger.info(f"MiradorHome scraping complete: {len(all_products)} products")
    return all_products
