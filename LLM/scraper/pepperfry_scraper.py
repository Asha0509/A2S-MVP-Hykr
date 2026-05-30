"""
Pepperfry India Product Scraper.

Uses category search pages and parses both JSON-LD and card HTML.
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

PEPPERFRY_SEARCHES = {
    "sofa": [
        "https://www.pepperfry.com/site_product/search?q=sofa",
        "https://www.pepperfry.com/site_product/search?q=l%20shape%20sofa",
        "https://www.pepperfry.com/site_product/search?q=3%20seater%20sofa",
    ],
    "bed": [
        "https://www.pepperfry.com/site_product/search?q=bed",
        "https://www.pepperfry.com/site_product/search?q=queen%20bed",
        "https://www.pepperfry.com/site_product/search?q=king%20bed%20with%20storage",
    ],
    "table": [
        "https://www.pepperfry.com/site_product/search?q=coffee%20table",
        "https://www.pepperfry.com/site_product/search?q=dining%20table",
        "https://www.pepperfry.com/site_product/search?q=center%20table",
    ],
    "storage": [
        "https://www.pepperfry.com/site_product/search?q=wardrobe",
        "https://www.pepperfry.com/site_product/search?q=bookshelf",
        "https://www.pepperfry.com/site_product/search?q=tv%20unit",
    ],
    "decor": [
        "https://www.pepperfry.com/site_product/search?q=mirror",
        "https://www.pepperfry.com/site_product/search?q=wall%20decor",
        "https://www.pepperfry.com/site_product/search?q=show%20piece",
    ],
    "lighting": [
        "https://www.pepperfry.com/site_product/search?q=lamp",
        "https://www.pepperfry.com/site_product/search?q=ceiling%20light",
        "https://www.pepperfry.com/site_product/search?q=pendant%20light",
    ],
    "chair": [
        "https://www.pepperfry.com/site_product/search?q=dining%20chair",
        "https://www.pepperfry.com/site_product/search?q=accent%20chair",
    ],
    "drawing_room": [
        "https://www.pepperfry.com/site_product/search?q=drawing%20room%20sofa",
        "https://www.pepperfry.com/site_product/search?q=display%20cabinet",
        "https://www.pepperfry.com/site_product/search?q=console%20table",
    ],
    "outdoor": [
        "https://www.pepperfry.com/site_product/search?q=outdoor%20furniture",
        "https://www.pepperfry.com/site_product/search?q=garden%20chair",
        "https://www.pepperfry.com/site_product/search?q=balcony%20furniture",
    ],
}


def _parse_json_ld(soup: BeautifulSoup, product_type: str) -> list[dict]:
    products = []

    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text() or ""
        if not raw.strip():
            continue

        try:
            data = json.loads(raw)
        except Exception:
            continue

        if isinstance(data, dict) and data.get("@type") == "ItemList":
            items = data.get("itemListElement", [])
        elif isinstance(data, list):
            items = []
            for entry in data:
                if isinstance(entry, dict) and entry.get("@type") == "ItemList":
                    items.extend(entry.get("itemListElement", []))
        else:
            items = []

        for item in items:
            obj = item.get("item") if isinstance(item, dict) else None
            if not isinstance(obj, dict):
                continue

            name = clean_text(obj.get("name", ""))
            url = obj.get("url", "")
            image = obj.get("image", "")
            offers = obj.get("offers", {}) if isinstance(obj.get("offers", {}), dict) else {}
            price = clean_price(offers.get("price", ""))

            if not name or not url or not price or price < 100:
                continue

            if url.startswith("/"):
                url = "https://www.pepperfry.com" + url

            color_name, color_hex = extract_color(name)
            material = extract_material(name)
            style = map_aesthetic_style(product_type, name, "")

            pid = f"PF_{abs(hash((name, url))) % 100000000}"
            room_types = map_product_type_to_room_types(product_type)
            
            products.append({
                "product_id": pid,
                "product_name": name,
                "brand": "Pepperfry",
                "price_value": price,
                "price_currency": "INR",
                "product_type": product_type,
                "room_type": room_types[0] if room_types else "Living Room",  # Primary room type
                "image_url": image,
                "affiliate_url": build_affiliate_url(url, "pepperfry.com"),
                "source_url": url,
                "dimensions": "",
                "color": color_name,
                "color_hex": color_hex,
                "material": material,
                "aesthetic_style": style,
                "source": "pepperfry.com",
            })

    return products


def scrape_pepperfry(max_per_category: int = 200) -> list[dict]:
    logger.info("Starting Pepperfry scraper...")
    session = get_session()
    all_products = []
    seen = set()

    for product_type, urls in PEPPERFRY_SEARCHES.items():
        for base_url in urls:
            collected_for_url = 0
            max_pages = (max_per_category // 30) + 1  # ~30 per page

            for page in range(1, max_pages + 1):
                url = f"{base_url}&page={page}" if page > 1 else base_url
                html = fetch_page(url, session=session, delay=2.2)
                if not html:
                    break

                soup = BeautifulSoup(html, "lxml")
                products = _parse_json_ld(soup, product_type)

                if not products:
                    logger.info(f"  → No products on page {page} for [{product_type}], stopping")
                    break

                new_count = 0
                for p in products:
                    if p["product_id"] in seen:
                        continue
                    seen.add(p["product_id"])
                    all_products.append(p)
                    collected_for_url += 1
                    new_count += 1

                logger.info(f"Pepperfry [{product_type}] page {page} -> {new_count} new (url total: {collected_for_url}, grand: {len(all_products)})")

                if collected_for_url >= max_per_category:
                    break

    logger.info(f"Pepperfry scraping complete: {len(all_products)} products")
    return all_products
