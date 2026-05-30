"""
Amazon India Product Scraper.

Scrapes furniture product data from amazon.in.
Uses search result pages with category-specific queries.

Note: Amazon has aggressive anti-bot measures. This scraper uses
rotating headers and polite delays. If blocked, it gracefully
returns empty results.
"""

import re
import json
import logging
from typing import Optional

from bs4 import BeautifulSoup

from scraper.base import get_session, get_headers, fetch_page, clean_price, clean_text, logger, extract_color, extract_material, map_aesthetic_style, build_affiliate_url

# ──────────────────────────────────────────────
# Amazon India search URLs
# ──────────────────────────────────────────────
AMAZON_SEARCHES = {
    "sofa": [
        "https://www.amazon.in/s?k=sofa+set&i=furniture&rh=p_36%3A500000-10000000",
        "https://www.amazon.in/s?k=3+seater+sofa&i=furniture",
        "https://www.amazon.in/s?k=L+shape+sofa&i=furniture",
    ],
    "bed": [
        "https://www.amazon.in/s?k=king+size+bed+with+storage&i=furniture",
        "https://www.amazon.in/s?k=queen+size+bed&i=furniture",
        "https://www.amazon.in/s?k=single+bed+with+storage&i=furniture",
    ],
    "lighting": [
        "https://www.amazon.in/s?k=ceiling+light+for+living+room&i=lighting",
        "https://www.amazon.in/s?k=table+lamp+for+bedroom&i=lighting",
        "https://www.amazon.in/s?k=floor+lamp+modern&i=lighting",
    ],
    "table": [
        "https://www.amazon.in/s?k=study+table+with+storage&i=furniture",
        "https://www.amazon.in/s?k=coffee+table+for+living+room&i=furniture",
        "https://www.amazon.in/s?k=dining+table+set+4+seater&i=furniture",
    ],
    "decor": [
        "https://www.amazon.in/s?k=wall+mirror+decorative&i=furniture",
        "https://www.amazon.in/s?k=curtains+for+living+room&i=furniture",
        "https://www.amazon.in/s?k=flower+vase+for+home+decoration&i=furniture",
    ],
    "storage": [
        "https://www.amazon.in/s?k=bookshelf+for+home&i=furniture",
        "https://www.amazon.in/s?k=wardrobe+for+bedroom&i=furniture",
        "https://www.amazon.in/s?k=tv+unit+for+living+room&i=furniture",
    ],
    "drawing_room": [
        "https://www.amazon.in/s?k=accent+chair+for+living+room&i=furniture",
        "https://www.amazon.in/s?k=display+cabinet+showcase+for+home&i=furniture",
        "https://www.amazon.in/s?k=console+table+for+entryway&i=furniture",
        "https://www.amazon.in/s?k=show+piece+for+home+decoration&i=furniture",
    ],
    "appliance": [
        "https://www.amazon.in/s?k=smart+tv+43+inch&i=electronics",
        "https://www.amazon.in/s?k=split+ac+1.5+ton+5+star&i=appliances",
        "https://www.amazon.in/s?k=double+door+refrigerator&i=appliances",
        "https://www.amazon.in/s?k=microwave+oven+solo&i=appliances",
        "https://www.amazon.in/s?k=ro+water+purifier&i=appliances",
    ],
    "kitchen_accessory": [
        "https://www.amazon.in/s?k=pressure+cooker+stainless+steel&i=kitchen",
        "https://www.amazon.in/s?k=non+stick+kadhai+set&i=kitchen",
        "https://www.amazon.in/s?k=cutting+board+set&i=kitchen",
        "https://www.amazon.in/s?k=stainless+steel+bowl+set&i=kitchen",
        "https://www.amazon.in/s?k=kitchen+utensils+set&i=kitchen",
    ],
    "outdoor": [
        "https://www.amazon.in/s?k=balcony+bistro+set+chairs+table",
        "https://www.amazon.in/s?k=outdoor+garden+chair+foldable",
        "https://www.amazon.in/s?k=hammock+for+home+balcony",
        "https://www.amazon.in/s?k=planter+pots+for+balcony",
        "https://www.amazon.in/s?k=fairy+lights+for+balcony+outdoor",
        "https://www.amazon.in/s?k=outdoor+rug+mat+for+balcony",
    ],
}


def _parse_amazon_results(html: str, product_type: str) -> list[dict]:
    """Parse Amazon search results page HTML."""
    products = []
    soup = BeautifulSoup(html, "html.parser")

    # Amazon product cards
    cards = soup.select("[data-component-type='s-search-result']")

    if not cards:
        # Fallback selectors
        cards = soup.select(".s-result-item[data-asin]")

    for card in cards:
        try:
            asin = card.get("data-asin", "")
            if not asin or asin == "":
                continue

            # Product name
            title_el = card.select_one("h2 a span, h2 span, .a-text-normal")
            name = clean_text(title_el.get_text()) if title_el else ""
            if not name or len(name) < 5:
                continue

            # Price
            price = None
            price_el = card.select_one(".a-price .a-offscreen, .a-price-whole")
            if price_el:
                price = clean_price(price_el.get_text())

            if not price or price < 100:
                continue

            # Image
            img_el = card.select_one("img.s-image, img[data-image-latency='s-product-image']")
            image_url = img_el.get("src", "") if img_el else ""

            # Product URL
            link_el = card.select_one("h2 a, a.a-link-normal[href*='/dp/']")
            product_url = ""
            if link_el:
                href = link_el.get("href", "")
                if href.startswith("/"):
                    product_url = "https://www.amazon.in" + href
                elif href.startswith("http"):
                    product_url = href
                # Clean tracking params
                product_url = product_url.split("/ref=")[0]

            # Rating
            rating_el = card.select_one(".a-icon-alt")
            rating = ""
            if rating_el:
                rating = clean_text(rating_el.get_text())

            # Brand (sometimes in a separate span)
            brand = "Unknown"
            brand_el = card.select_one("[class*='brand'], .a-row .a-size-base-plus")
            if brand_el:
                b = clean_text(brand_el.get_text())
                if b and len(b) < 50:
                    brand = b

            # Dimensions from title
            dimensions = ""
            dim_match = re.search(r"(\d+)\s*[xX×]\s*(\d+)(?:\s*[xX×]\s*(\d+))?", name)
            if dim_match:
                parts = [g for g in dim_match.groups() if g]
                dimensions = " x ".join(parts) + " cm"

            # Extract color and material
            color_name, color_hex = extract_color(name)
            material = extract_material(name)
            aesthetic_style = map_aesthetic_style(product_type, name, "")

            products.append({
                "product_id": f"AMZ_{asin}",
                "product_name": name,
                "brand": brand,
                "price_value": price,
                "price_currency": "INR",
                "product_type": product_type,
                "image_url": image_url,
                "affiliate_url": build_affiliate_url(product_url, "amazon.in"),
                "source_url": product_url,
                "dimensions": dimensions,
                "color": color_name,
                "color_hex": color_hex,
                "material": material,
                "aesthetic_style": aesthetic_style,
                "rating": rating,
                "source": "amazon.in",
            })

        except Exception as e:
            logger.debug(f"Failed to parse Amazon card: {e}")
            continue

    return products


def scrape_amazon(max_per_category: int = 200) -> list[dict]:
    """
    Scrape products from Amazon India with pagination.

    Args:
        max_per_category: Target products per search URL (paginated).

    Returns:
        List of product dicts.
    """
    logger.info("Starting Amazon India scraper (with pagination)...")
    session = get_session()
    all_products = []
    seen_ids = set()

    for product_type, urls in AMAZON_SEARCHES.items():
        for base_url in urls:
            collected_for_url = 0
            max_pages = (max_per_category // 20) + 1  # ~20-30 per page

            for page in range(1, max_pages + 1):
                url = f"{base_url}&page={page}" if page > 1 else base_url
                logger.info(f"Scraping Amazon [{product_type}] page {page}: {url[:80]}...")
                html = fetch_page(url, session=session, delay=3.0)
                if not html:
                    logger.warning(f"  → Failed to fetch page {page} (possibly blocked)")
                    break

                products = _parse_amazon_results(html, product_type)

                if not products:
                    logger.info(f"  → No products on page {page}, stopping pagination")
                    break

                new_count = 0
                for p in products:
                    pid = p["product_id"]
                    if pid not in seen_ids:
                        seen_ids.add(pid)
                        all_products.append(p)
                        collected_for_url += 1
                        new_count += 1

                logger.info(f"  → Page {page}: {new_count} new products (url total: {collected_for_url}, grand total: {len(all_products)})")

                if collected_for_url >= max_per_category:
                    break

    logger.info(f"Amazon scraping complete: {len(all_products)} products")
    return all_products
