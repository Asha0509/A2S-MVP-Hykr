"""
Main Crawler Runner.

Runs all configured scrapers (IKEA, Amazon, Flipkart, Pepperfry,
Urban Ladder, WoodenStreet, HomeLane, Nilkamal, Godrej Interio,
MiradorHome), merges results, cleans the data, and exports to Excel.

Usage:
    python -m scraper.run_crawler
    python -m scraper.run_crawler --sites ikea amazon
    python -m scraper.run_crawler --sites flipkart --max 20
    python -m scraper.run_crawler --sites homelane nilkamal

Output:
    scraped_products_YYYYMMDD_HHMMSS.xlsx  (in project root)
"""

import argparse
import re
import sys
import os
import json
import math
from datetime import datetime

import pandas as pd
import requests

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.base import logger
from utils.product_mapper import map_product_type_to_room_types


ROOM_TYPE_NORMALIZATION = {
    "living room": "Living Room",
    "livingroom": "Living Room",
    "living": "Living Room",
    "bedroom": "Bedroom",
    "master bedroom": "Bedroom",
    "guest bedroom": "Bedroom",
    "dining": "Dining Room",
    "dining room": "Dining Room",
    "kitchen": "Kitchen",
    "office": "Home Office",
    "home office": "Home Office",
    "home-office": "Home Office",
    "study": "Home Office",
    "bathroom": "Bathroom",
    "balcony": "Balcony",
    "pooja room": "Pooja Room",
    "pooja": "Pooja Room",
}


def safe_str(value, fallback=""):
    if value is None:
        return fallback
    if isinstance(value, float) and math.isnan(value):
        return fallback
    text = str(value).strip()
    return text if text else fallback


def safe_float(value, fallback=0.0):
    try:
        if value is None:
            return fallback
        if isinstance(value, float) and math.isnan(value):
            return fallback
        return float(value)
    except Exception:
        return fallback


def normalize_room_type(value: str) -> str:
    raw = safe_str(value, "Living Room")
    key = raw.lower().replace("_", " ").strip()
    return ROOM_TYPE_NORMALIZATION.get(key, raw.title())


def run_scraper(sites: list[str], max_per_category: int = 200) -> pd.DataFrame:
    """
    Run selected scrapers and return combined DataFrame.

    Args:
        sites: List of site names to scrape ("ikea", "amazon", "flipkart", "pepperfry", "urbanladder", "woodenstreet").
        max_per_category: Max products per category per site.

    Returns:
        Combined and cleaned DataFrame.
    """
    all_products = []

    if "ikea" in sites:
        from scraper.ikea_scraper import scrape_ikea
        products = scrape_ikea(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"IKEA: {len(products)} products")

    if "amazon" in sites:
        from scraper.amazon_scraper import scrape_amazon
        products = scrape_amazon(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"Amazon: {len(products)} products")

    if "flipkart" in sites:
        from scraper.flipkart_scraper import scrape_flipkart
        products = scrape_flipkart(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"Flipkart: {len(products)} products")

    if "pepperfry" in sites:
        from scraper.pepperfry_scraper import scrape_pepperfry
        products = scrape_pepperfry(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"Pepperfry: {len(products)} products")

    if "urbanladder" in sites:
        from scraper.urbanladder_scraper import scrape_urbanladder
        products = scrape_urbanladder(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"Urban Ladder: {len(products)} products")

    if "woodenstreet" in sites:
        from scraper.woodenstreet_scraper import scrape_woodenstreet
        products = scrape_woodenstreet(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"WoodenStreet: {len(products)} products")

    if "homelane" in sites:
        from scraper.homelane_scraper import scrape_homelane
        products = scrape_homelane(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"HomeLane: {len(products)} products")

    if "nilkamal" in sites:
        from scraper.nilkamal_scraper import scrape_nilkamal
        products = scrape_nilkamal(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"Nilkamal: {len(products)} products")

    if "godrejinterio" in sites:
        from scraper.godrejinterio_scraper import scrape_godrejinterio
        products = scrape_godrejinterio(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"Godrej Interio: {len(products)} products")

    if "miradorhome" in sites:
        from scraper.miradorhome_scraper import scrape_miradorhome
        products = scrape_miradorhome(max_per_category=max_per_category)
        all_products.extend(products)
        logger.info(f"MiradorHome: {len(products)} products")

    if not all_products:
        logger.warning("No products scraped from any site!")
        return pd.DataFrame()

    # ── Build DataFrame ──
    df = pd.DataFrame(all_products)

    # ── Clean ──
    df = _clean_dataframe(df)

    logger.info(f"Total after cleaning: {len(df)} products")
    return df


def _parse_dimensions(dim_str: str) -> dict:
    """Parse dimension string into W x D x H."""
    result = {"width_cm": None, "depth_cm": None, "height_cm": None}
    if not dim_str or pd.isna(dim_str) or dim_str == "":
        return result
    dim_str = str(dim_str).lower().replace("cm", "").strip()
    numbers = re.findall(r"(\d+(?:\.\d+)?)", dim_str)
    if len(numbers) >= 3:
        result["width_cm"] = float(numbers[0])
        result["depth_cm"] = float(numbers[1])
        result["height_cm"] = float(numbers[2])
    elif len(numbers) == 2:
        result["width_cm"] = float(numbers[0])
        result["depth_cm"] = float(numbers[1])
    elif len(numbers) == 1:
        result["width_cm"] = float(numbers[0])
    return result


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and enrich the scraped DataFrame."""

    # Drop rows with no name or price
    df = df.dropna(subset=["product_name"])
    df = df[df["price_value"].notna() & (df["price_value"] >= 100)]

    # Remove duplicates by product_id
    df = df.drop_duplicates(subset=["product_id"], keep="first")

    # Remove duplicates by product_name + price (catch near-dupes)
    df = df.drop_duplicates(subset=["product_name", "price_value"], keep="first")

    # Clean product names
    df["product_name"] = df["product_name"].apply(lambda x: re.sub(r"\s+", " ", str(x)).strip()[:200])

    # Clean brand
    df["brand"] = df["brand"].fillna("Unknown").apply(
        lambda x: "Unknown" if not x or len(str(x)) > 50 else str(x).strip()
    )
    
    # Clean color, material, aesthetic_style with defaults
    df["color"] = df["color"].fillna("Multi-tone").apply(lambda x: str(x).strip() if x else "Multi-tone")
    # Keep null hex values as None without triggering pandas fillna validation errors.
    df["color_hex"] = df["color_hex"].where(df["color_hex"].notna(), None)
    df["material"] = df["material"].fillna("Premium").apply(lambda x: str(x).strip() if x else "Premium")
    df["aesthetic_style"] = df["aesthetic_style"].fillna("Contemporary").apply(
        lambda x: str(x).strip() if x else "Contemporary"
    )

    # Parse dimensions
    dim_parsed = df["dimensions"].apply(_parse_dimensions).apply(pd.Series)
    df["width_cm"] = dim_parsed["width_cm"]
    df["depth_cm"] = dim_parsed["depth_cm"]
    df["height_cm"] = dim_parsed["height_cm"]

    # Add metadata
    df["price_currency"] = "INR"
    df["scraped_date"] = datetime.now().strftime("%Y-%m-%d")

    # Ensure room_type exists and is mapped from product_type when missing.
    if "room_type" not in df.columns:
        df["room_type"] = None

    df["room_type"] = df.apply(
        lambda row: safe_str(row.get("room_type"))
        or map_product_type_to_room_types(safe_str(row.get("product_type"), "misc"))[0],
        axis=1,
    )
    df["room_type"] = df["room_type"].apply(normalize_room_type)

    # Sort by source then price
    df = df.sort_values(["source", "product_type", "price_value"]).reset_index(drop=True)

    return df


def export_to_excel(df: pd.DataFrame, output_dir: str = ".") -> str:
    """Export DataFrame to Excel file with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"scraped_products_{timestamp}.xlsx"
    filepath = os.path.join(output_dir, filename)

    # Select and order columns for export
    export_cols = [
        "product_id", "product_name", "brand", "price_value", "price_currency",
        "product_type", "room_type", "color", "color_hex", "material", "aesthetic_style",
        "dimensions", "width_cm", "depth_cm", "height_cm",
        "image_url", "affiliate_url", "source_url", "source", "scraped_date",
    ]

    # Only include columns that exist
    cols = [c for c in export_cols if c in df.columns]
    df[cols].to_excel(filepath, index=False, engine="openpyxl")

    logger.info(f"Exported {len(df)} products to {filepath}")
    return filepath


def export_to_json(df: pd.DataFrame, output_dir: str = ".") -> str:
    """Export DataFrame to JSON file with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"scraped_products_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)

    # Normalize fields for backend import payload
    payload = []
    for row in df.to_dict(orient="records"):
        img = safe_str(row.get("image_url"))
        payload.append({
            "name":             safe_str(row.get("product_name")),
            "brand":            safe_str(row.get("brand"), "Unknown"),
            "model":            safe_str(row.get("model")),
            "category":         safe_str(row.get("product_type"), "decor"),
            "roomType":         safe_str(row.get("room_type"), "Living Room"),
            "aestheticStyle":   safe_str(row.get("aesthetic_style"), "Contemporary"),
            "price":            safe_float(row.get("price_value"), 0.0),
            "dimensions":       safe_str(row.get("dimensions")),
            "color":            safe_str(row.get("color"), "Multi-tone"),
            "colorHex":         safe_str(row.get("color_hex")) or None,
            "material":         safe_str(row.get("material"), "Premium"),
            "vendor":           safe_str(row.get("source"), "Marketplace").replace(".com", "").upper(),
            "sourceUrl":        safe_str(row.get("source_url")),
            "description":      safe_str(row.get("description")),
            "affiliateLink":    safe_str(row.get("affiliate_url")) or safe_str(row.get("source_url")),
            "image":            img,
            "gallery":          [img] if img else [],
            "rating":           row.get("rating") if isinstance(row.get("rating"), (int, float)) else None,
            "reviewCount":      row.get("review_count") if isinstance(row.get("review_count"), int) else None,
            "seaterCount":      row.get("seater_count") if isinstance(row.get("seater_count"), int) else None,
            "pieceCount":       row.get("piece_count") if isinstance(row.get("piece_count"), int) else None,
            "warrantyMonths":   row.get("warranty_months") if isinstance(row.get("warranty_months"), int) else None,
            "assemblyRequired": row.get("assembly_required") if isinstance(row.get("assembly_required"), bool) else None,
            "featureTags":      row.get("feature_tags") if isinstance(row.get("feature_tags"), list) else [],
        })

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    logger.info(f"Exported {len(payload)} products to {filepath}")
    return filepath


def _jsafe_num(value):
    """NaN and Inf are not JSON-encodable; coerce to None."""
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
            return None
        return value
    return None


def _jsafe_int(value):
    n = _jsafe_num(value)
    if n is None or isinstance(n, bool):
        return None
    try:
        return int(n)
    except Exception:
        return None


def _jsafe_bool(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, float) and math.isnan(value):
        return None
    return None


def push_to_backend(df: pd.DataFrame, backend_url: str, batch_size: int = 500) -> dict:
    """Push scraped records to backend import API.

    Sanitizes NaN/Inf (Python's requests defaults to allow_nan=True but the
    backend rejects those) and chunks into batches so large catalog imports
    don't blow request size or timeouts.
    """
    payload = []
    for row in df.to_dict(orient="records"):
        img = safe_str(row.get("image_url"))
        payload.append({
            "name":             safe_str(row.get("product_name")),
            "brand":            safe_str(row.get("brand"), "Unknown"),
            "model":            safe_str(row.get("model")) or None,
            "category":         safe_str(row.get("product_type"), "decor"),
            "roomType":         safe_str(row.get("room_type"), "Living Room"),
            "aestheticStyle":   safe_str(row.get("aesthetic_style"), "Contemporary"),
            "price":            safe_float(row.get("price_value"), 0.0),
            "dimensions":       safe_str(row.get("dimensions")) or None,
            "color":            safe_str(row.get("color"), "Multi-tone"),
            "colorHex":         safe_str(row.get("color_hex")) or None,
            "material":         safe_str(row.get("material"), "Premium"),
            "vendor":           safe_str(row.get("source"), "Marketplace").replace(".com", "").upper(),
            "sourceUrl":        safe_str(row.get("source_url")),
            "description":      safe_str(row.get("description")) or None,
            "affiliateLink":    safe_str(row.get("affiliate_url")) or safe_str(row.get("source_url")),
            "image":            img or None,
            "gallery":          [img] if img else [],
            "rating":           _jsafe_num(row.get("rating")),
            "reviewCount":      _jsafe_int(row.get("review_count")),
            "seaterCount":      _jsafe_int(row.get("seater_count")),
            "pieceCount":       _jsafe_int(row.get("piece_count")),
            "warrantyMonths":   _jsafe_int(row.get("warranty_months")),
            "assemblyRequired": _jsafe_bool(row.get("assembly_required")),
            "featureTags":      row.get("feature_tags") if isinstance(row.get("feature_tags"), list) else [],
        })

    # Drop rows the backend would reject anyway (no name or no price)
    payload = [p for p in payload if p["name"] and p["price"]]

    created_total = 0
    updated_total = 0
    final_total = 0
    for i in range(0, len(payload), batch_size):
        batch = payload[i:i + batch_size]
        response = requests.post(
            f"{backend_url.rstrip('/')}/api/products/import",
            json=batch,
            timeout=180,
        )
        response.raise_for_status()
        result = response.json()
        created_total += int(result.get("created", 0))
        updated_total += int(result.get("updated", 0))
        final_total = int(result.get("total", 0))
        logger.info(
            "Batch %d/%d pushed: created=%d updated=%d running_total=%d",
            (i // batch_size) + 1,
            (len(payload) + batch_size - 1) // batch_size,
            result.get("created", 0),
            result.get("updated", 0),
            final_total,
        )

    aggregate = {"created": created_total, "updated": updated_total, "total": final_total}
    logger.info(f"Backend import complete: {aggregate}")
    return aggregate


def print_summary(df: pd.DataFrame, min_per_room: int = 200) -> None:
    """Print a human-readable summary of scraped data."""
    print("\n" + "=" * 60)
    print("  SCRAPING RESULTS SUMMARY")
    print("=" * 60)
    print(f"  Total products:  {len(df)}")

    if df.empty:
        print("  No data scraped.")
        return

    print(f"\n  By source:")
    for src, count in df["source"].value_counts().items():
        print(f"    {src:20s} {count:4d} products")

    print(f"\n  By product type:")
    for ptype, count in df["product_type"].value_counts().items():
        print(f"    {ptype:20s} {count:4d} products")

    print(f"\n  By room type:")
    room_counts = df["room_type"].fillna("Unknown").apply(normalize_room_type).value_counts()
    for room, count in room_counts.items():
        print(f"    {room:20s} {count:4d} products")

    below_min = room_counts[room_counts < min_per_room]
    if len(below_min) == 0:
        print(f"\n  Room minimum check (>= {min_per_room}): PASS")
    else:
        print(f"\n  Room minimum check (>= {min_per_room}): WARNING")
        for room, count in below_min.items():
            print(f"    {room:20s} {count:4d} products (below minimum)")

    print(f"\n  Price range: ₹{df['price_value'].min():,.0f} – ₹{df['price_value'].max():,.0f}")
    print(f"  Avg price:   ₹{df['price_value'].mean():,.0f}")

    brands = df[df["brand"] != "Unknown"]["brand"].nunique()
    print(f"  Known brands: {brands}")

    has_dims = df["width_cm"].notna().sum()
    print(f"  With dimensions: {has_dims}/{len(df)}")

    has_images = df["image_url"].fillna("").str.startswith("http").sum()
    print(f"  With images: {has_images}/{len(df)}")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="A2S Product Scraper")
    parser.add_argument(
        "--sites",
        nargs="+",
        choices=["ikea", "amazon", "flipkart", "pepperfry", "urbanladder", "woodenstreet",
                 "homelane", "nilkamal", "godrejinterio", "miradorhome"],
        default=["ikea", "amazon", "flipkart", "pepperfry", "urbanladder", "woodenstreet",
                 "homelane", "nilkamal", "godrejinterio", "miradorhome"],
        help="Sites to scrape (default: all)",
    )
    parser.add_argument(
        "--max",
        type=int,
        default=200,
        help="Max products per category per site (default: 200)",
    )
    parser.add_argument(
        "--min-per-room",
        type=int,
        default=200,
        help="Minimum expected products per room type for summary validation (default: 200)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=".",
        help="Output directory (default: current)",
    )
    parser.add_argument(
        "--push-backend",
        action="store_true",
        help="Push scraped records to backend /api/products/import",
    )
    parser.add_argument(
        "--backend-url",
        type=str,
        default="http://localhost:8080",
        help="Backend base URL for import (default: http://localhost:8080)",
    )

    args = parser.parse_args()

    print(f"\n🕷️  A2S Product Crawler")
    print(f"   Sites: {', '.join(args.sites)}")
    print(f"   Max per category: {args.max}\n")

    df = run_scraper(sites=args.sites, max_per_category=args.max)

    if not df.empty:
        filepath = export_to_excel(df, output_dir=args.output)
        json_path = export_to_json(df, output_dir=args.output)
        print_summary(df, min_per_room=args.min_per_room)
        print(f"📁 Data saved to: {filepath}")
        print(f"📁 JSON payload saved to: {json_path}")

        if args.push_backend:
            try:
                import_result = push_to_backend(df, args.backend_url)
                print(f"✅ Backend import: created={import_result.get('created', 0)} updated={import_result.get('updated', 0)} total={import_result.get('total', 0)}")
            except Exception as exc:
                print(f"❌ Backend import failed: {exc}")
    else:
        print("❌ No products were scraped. Sites may be blocking requests.")
        print("   Try again later or with different settings.")


if __name__ == "__main__":
    main()
