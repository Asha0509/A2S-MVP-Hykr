"""
WoodenStreet Product Scraper.

Strategy:
1. Read listing pages and collect product URLs.
2. Fetch each product URL and parse Product JSON-LD for reliable price/name/image.
"""

import json
import re

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

WOODENSTREET_LISTINGS = {
    "sofa": [
        "https://www.woodenstreet.com/sofa-sets",
        "https://www.woodenstreet.com/l-shaped-sofas",
        "https://www.woodenstreet.com/recliners",
    ],
    "bed": [
        "https://www.woodenstreet.com/beds",
        "https://www.woodenstreet.com/bunk-beds",
    ],
    "table": [
        "https://www.woodenstreet.com/coffee-tables",
        "https://www.woodenstreet.com/dining-tables",
        "https://www.woodenstreet.com/console-tables",
        "https://www.woodenstreet.com/side-tables",
    ],
    "storage": [
        "https://www.woodenstreet.com/wardrobes",
        "https://www.woodenstreet.com/bookshelves",
        "https://www.woodenstreet.com/tv-units",
        "https://www.woodenstreet.com/chest-of-drawers",
    ],
    "decor": [
        "https://www.woodenstreet.com/home-decors",
        "https://www.woodenstreet.com/mirrors",
    ],
    "chair": [
        "https://www.woodenstreet.com/chairs",
        "https://www.woodenstreet.com/dining-chairs",
    ],
    "drawing_room": [
        "https://www.woodenstreet.com/display-units",
    ],
    "outdoor": [
        "https://www.woodenstreet.com/outdoor-furniture",
    ],
}


def _collect_product_urls(listing_html: str) -> list[str]:
    soup = BeautifulSoup(listing_html, "lxml")
    urls = []

    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if "/product/" not in href:
            continue
        if href.startswith("/"):
            href = "https://www.woodenstreet.com" + href
        if href.startswith("https://www.woodenstreet.com/product/"):
            urls.append(href.split("?")[0])

    # Preserve order while deduping.
    return list(dict.fromkeys(urls))


def _parse_product_page(product_url: str, product_type: str, session) -> dict | None:
    html = fetch_page(product_url, session=session, delay=1.2)
    if not html:
        return None

    soup = BeautifulSoup(html, "lxml")
    scripts = soup.find_all("script", type="application/ld+json")

    parsed = None
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
            if isinstance(payload, dict) and payload.get("@type") == "Product":
                parsed = payload
                break
        if parsed:
            break

    if not parsed:
        return None

    name = clean_text(parsed.get("name", ""))
    if not name:
        return None

    brand = "WoodenStreet"
    brand_raw = parsed.get("brand")
    if isinstance(brand_raw, dict):
        brand = clean_text(brand_raw.get("name", "")) or brand
    elif isinstance(brand_raw, str):
        brand = clean_text(brand_raw) or brand

    offers = parsed.get("offers", {}) if isinstance(parsed.get("offers", {}), dict) else {}
    price = clean_price(offers.get("price", ""))
    if not price or price < 100:
        # Fallback: attempt price extraction from page text.
        price_match = re.search(r"₹\s*([\d,]+)", soup.get_text(" "))
        price = float(price_match.group(1).replace(",", "")) if price_match else None

    if not price or price < 100:
        return None

    image = parsed.get("image", "")
    if isinstance(image, list):
        image = image[0] if image else ""

    description = clean_text(parsed.get("description", ""))
    color_name, color_hex = extract_color(name + " " + description)
    material = extract_material(name + " " + description)
    style = map_aesthetic_style(product_type, name, description)

    # Try reading dimensions from product page text.
    full_text = soup.get_text(" ")
    dim_match = re.search(r"(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?:\s*[xX×]\s*(\d+(?:\.\d+)?))?\s*cm", full_text)
    dimensions = ""
    if dim_match:
        parts = [p for p in dim_match.groups() if p]
        dimensions = " x ".join(parts) + " cm"

    pid = f"WS_{abs(hash((name, product_url))) % 100000000}"
    room_types = map_product_type_to_room_types(product_type)
    
    return {
        "product_id": pid,
        "product_name": name,
        "brand": brand,
        "price_value": price,
        "price_currency": "INR",
        "product_type": product_type,
        "room_type": room_types[0] if room_types else "Living Room",  # Primary room type
        "image_url": image,
        "affiliate_url": build_affiliate_url(product_url, "woodenstreet.com"),
        "source_url": product_url,
        "dimensions": dimensions,
        "color": color_name,
        "color_hex": color_hex,
        "material": material,
        "aesthetic_style": style,
        "source": "woodenstreet.com",
    }


def scrape_woodenstreet(max_per_category: int = 200) -> list[dict]:
    logger.info("Starting WoodenStreet scraper...")
    session = get_session()
    all_products = []
    seen_ids = set()

    for product_type, listing_urls in WOODENSTREET_LISTINGS.items():
        product_urls = []
        for listing in listing_urls:
            html = fetch_page(listing, session=session, delay=2.0)
            if not html:
                continue
            product_urls.extend(_collect_product_urls(html))

        product_urls = list(dict.fromkeys(product_urls))[:max_per_category]
        added = 0

        for url in product_urls:
            product = _parse_product_page(url, product_type, session=session)
            if not product:
                continue
            pid = product["product_id"]
            if pid in seen_ids:
                continue
            seen_ids.add(pid)
            all_products.append(product)
            added += 1

        logger.info(f"WoodenStreet [{product_type}] -> {added} added (total: {len(all_products)})")

    logger.info(f"WoodenStreet scraping complete: {len(all_products)} products")
    return all_products
