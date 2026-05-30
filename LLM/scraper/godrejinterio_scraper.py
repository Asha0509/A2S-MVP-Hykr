"""
Godrej Interio Product Scraper.

Parses Godrej Interio (https://www.godrejinterio.com) category pages,
preferring JSON-LD Product blocks when present.
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


# NOTE on URL paths: Godrej Interio's category paths are guessed from public
# navigation conventions (home-furniture / office-furniture sections) since we
# do not hit the network at scrape-config time. Inline comments mark guesses;
# operators should verify in production before enabling.
GODREJ_INTERIO_SEARCHES: dict[str, list[str]] = {
    "sofa": [
        "https://www.godrejinterio.com/home-furniture/living-room/sofas",
        "https://www.godrejinterio.com/home-furniture/living-room/recliners",
        "https://www.godrejinterio.com/home-furniture/living-room/sofa-cum-beds",
    ],
    "bed": [
        "https://www.godrejinterio.com/home-furniture/bedroom/beds",
        "https://www.godrejinterio.com/home-furniture/bedroom/mattresses",
    ],
    "table": [
        "https://www.godrejinterio.com/home-furniture/dining/dining-tables",
        "https://www.godrejinterio.com/home-furniture/living-room/coffee-tables",
        "https://www.godrejinterio.com/home-furniture/living-room/side-tables",
    ],
    "storage": [
        "https://www.godrejinterio.com/home-furniture/wardrobes",
        "https://www.godrejinterio.com/home-furniture/storage/bookshelves",
        "https://www.godrejinterio.com/home-furniture/storage/shoe-racks",
        # Godrej Interio's safes line — best-guess path
        "https://www.godrejinterio.com/security-solutions/home-lockers",
    ],
    "lighting": [
        # Godrej Interio lighting is sparse; best-guess paths
        "https://www.godrejinterio.com/home-furniture/lighting",
        "https://www.godrejinterio.com/home-furniture/lighting/floor-lamps",
    ],
    "decor": [
        "https://www.godrejinterio.com/home-furniture/home-decor",
        "https://www.godrejinterio.com/home-furniture/home-decor/mirrors",
    ],
    "chair": [
        "https://www.godrejinterio.com/home-furniture/dining/dining-chairs",
        "https://www.godrejinterio.com/office-furniture/chairs",
        "https://www.godrejinterio.com/office-furniture/chairs/executive-chairs",
    ],
    "drawing_room": [
        "https://www.godrejinterio.com/home-furniture/living-room/display-units",
        "https://www.godrejinterio.com/home-furniture/living-room/accent-chairs",
    ],
    "outdoor": [
        # Best-guess; Godrej Interio outdoor catalogue is limited
        "https://www.godrejinterio.com/home-furniture/outdoor-furniture",
    ],
}


def _parse_json_ld(soup: BeautifulSoup, product_type: str) -> list[dict]:
    """Parse JSON-LD Product blocks from a Godrej Interio category page."""
    products: list[dict] = []

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

            # Support a single Product, or an ItemList wrapping Products
            candidates: list[dict] = []
            if payload.get("@type") == "Product":
                candidates.append(payload)
            elif payload.get("@type") == "ItemList":
                for item in payload.get("itemListElement", []) or []:
                    if isinstance(item, dict):
                        if item.get("@type") == "Product":
                            candidates.append(item)
                        elif isinstance(item.get("item"), dict) and item["item"].get("@type") == "Product":
                            candidates.append(item["item"])

            for prod in candidates:
                name = clean_text(prod.get("name", ""))
                url = prod.get("url", "") or ""
                image = prod.get("image", "")
                offers = prod.get("offers", {}) if isinstance(prod.get("offers", {}), dict) else {}
                price = clean_price(offers.get("price", ""))

                if not name or not url or not price or price < 100:
                    continue

                if url.startswith("/"):
                    url = "https://www.godrejinterio.com" + url

                if isinstance(image, list):
                    image = image[0] if image else ""
                if not isinstance(image, str):
                    image = ""

                color_name, color_hex = extract_color(name)
                material = extract_material(name)
                style = map_aesthetic_style(product_type, name, "")

                pid = f"GI_{abs(hash((name, url))) % 100000000}"
                room_types = map_product_type_to_room_types(product_type)

                products.append({
                    "product_id": pid,
                    "product_name": name,
                    "brand": "Godrej Interio",
                    "price_value": price,
                    "price_currency": "INR",
                    "product_type": product_type,
                    "room_type": room_types[0] if room_types else "Living Room",
                    "image_url": image,
                    "affiliate_url": build_affiliate_url(url, "godrejinterio.com"),
                    "source_url": url,
                    "dimensions": "",
                    "color": color_name,
                    "color_hex": color_hex,
                    "material": material,
                    "aesthetic_style": style,
                    "source": "godrejinterio.com",
                })

    return products


def scrape_godrejinterio(max_per_category: int = 200) -> list[dict]:
    """Entry point: walk every configured category, paginate, and return products."""
    logger.info("Starting Godrej Interio scraper...")
    session = get_session()
    all_products: list[dict] = []
    seen: set[str] = set()

    for product_type, urls in GODREJ_INTERIO_SEARCHES.items():
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
                    logger.info(f"  → No products on page {page} for GI [{product_type}], stopping")
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
                    f"GodrejInterio [{product_type}] page {page} -> {new_count} new "
                    f"(cat total: {added}, grand: {len(all_products)})"
                )

                if added >= max_per_category:
                    break

            if added >= max_per_category:
                break

        logger.info(f"GodrejInterio [{product_type}] -> {added} added (total: {len(all_products)})")

    logger.info(f"Godrej Interio scraping complete: {len(all_products)} products")
    return all_products
