"""
Data Loader & Merger Module.

Loads both original Excel data sources AND the scraped product data,
merges them, cleans the data, parses dimensions, and produces a
single clean Pandas DataFrame that serves as the product catalog.

Pipeline:
    Excel File 1 + Excel File 2 + Scraped Data
        → Merge & Deduplicate
        → Clean (nulls, brands, column names)
        → Enrich (parse WxDxH, extract brand from name)
        → Product Catalog DataFrame
"""

import re
import pandas as pd
# import streamlit as st

from config import CANONICAL_COLUMNS


# ──────────────────────────────────────────────
# Dimension parser
# ──────────────────────────────────────────────
def _parse_dimensions(dim_str: str) -> dict:
    """
    Parse dimension strings into width, depth, height (cm).

    Supported formats:
        "322x98x48"         → W=322, D=98, H=48
        "160 x 200 cm"      → W=160, D=200, H=None
        "33x38x33 cm"       → W=33, D=38, H=33
        "60x27x74 cm"       → W=60, D=27, H=74

    Returns:
        dict with keys: width_cm, depth_cm, height_cm (None if missing)
    """
    result = {"width_cm": None, "depth_cm": None, "height_cm": None}

    if not dim_str or pd.isna(dim_str):
        return result

    dim_str = str(dim_str).strip().lower().replace("cm", "").strip()

    # Match numbers separated by 'x' or ' x '
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


# ──────────────────────────────────────────────
# Brand cleaner
# ──────────────────────────────────────────────
_JUNK_BRAND_PATTERNS = [
    r"Browse\s+Type",
    r"Discount\s+Set",
    r"Microwave\s+safe",
    r"Primary\s+Material",
    r"Shade\s+material",
    r"Frame\s+Material",
    r"Power\s+source",
]

# Words that are NOT brands (colors, shapes, generic terms)
_NOT_BRANDS = {
    "black", "white", "gold", "silver", "brown", "grey", "gray",
    "red", "blue", "green", "yellow", "beige", "pink", "orange", "purple",
    "multicolor", "round", "oval", "rectangle", "square", "designer",
    "modern", "classic", "vintage", "premium", "luxury", "set",
    "pack", "combo", "pair", "single", "double", "large", "small", "medium",
}

# Known real brands from Amazon/Flipkart
_KNOWN_BRANDS = {
    "amazon basics", "amazonbasics", "solimo", "nilkamal", "wakefit",
    "furny", "duroflex", "godrej", "zuari", "royaloak", "hometown",
    "urban ladder", "urbanladder", "pepperfry", "fabindia",
    "crosscut", "exclusivelane", "craft art india",
    "satyam kraft", "sehaz artworks", "art street",
    "divine trends", "wallmantra", "walldesign",
    "ganpati arts", "the attic", "home elements",
    "sleepyhead", "springtek", "centuary", "kurl-on",
    "wipro", "syska", "philips", "havells", "crompton",
    "asian paints", "berger", "nerolac",
}


def _clean_brand(brand: str, product_name: str = "") -> str:
    """
    Return cleaned brand name. Falls back to extracting brand
    from product_name if the brand field is junk.
    """
    if not brand or pd.isna(brand):
        brand = "Marketplace"
    else:
        brand = str(brand).strip()

    # Check for junk HTML patterns
    for pattern in _JUNK_BRAND_PATTERNS:
        if re.search(pattern, brand, re.IGNORECASE):
            brand = "Marketplace"
            break

    # Check for false brands (colors, shapes, etc.)
    if brand.lower() in _NOT_BRANDS:
        brand = "Marketplace"

    # If still fallback, try to extract from product_name
    if brand == "Marketplace" and product_name:
        name = str(product_name).strip()

        # Check if a known brand appears in the name
        name_lower = name.lower()
        for kb in _KNOWN_BRANDS:
            if kb in name_lower:
                # Capitalize properly
                brand = kb.title()
                break

        # If still fallback, try the first word/phrase before common separators
        if brand == "Marketplace":
            # Common patterns: "BrandName ProductType..." or "Brand Name - Product"
            first_part = re.split(r"\s+(?:for|with|in|and|set|\d|[-|])", name, maxsplit=1)[0]
            # Take first 1-2 words that look like a brand
            words = first_part.split()
            if words and len(words[0]) > 2:
                candidate = words[0]
                if len(words) > 1 and len(words[1]) > 2 and words[1][0].isupper():
                    candidate = words[0] + " " + words[1]
                if candidate.lower() not in _NOT_BRANDS and len(candidate) < 30:
                    brand = candidate

    return brand


# ──────────────────────────────────────────────
# Load scraped data
# ──────────────────────────────────────────────
def _load_scraped_data() -> pd.DataFrame:
    """Load the most recent scraped product file if it exists."""
    # Legacy Excel loading disabled. All data is in Azure SQL.
    return pd.DataFrame()


# ──────────────────────────────────────────────
# Main loader — Azure SQL Server
# ──────────────────────────────────────────────
import pymssql
import pandas as pd
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SERVER = os.environ.get("SERVER", "")
DATABASE = os.environ.get("DATABASE", "")
USERNAME = os.environ.get("DB_USERNAME", "")
PASSWORD = os.environ.get("DB_PASSWORD", "")


def get_connection():
    if not all([SERVER, DATABASE, USERNAME, PASSWORD]):
        raise RuntimeError(
            "Missing Azure SQL credentials. "
            "Set SERVER, DATABASE, DB_USERNAME, DB_PASSWORD in .env or environment."
        )
    return pymssql.connect(
        server=SERVER, user=USERNAME,
        password=PASSWORD, database=DATABASE,
    )


def load_product_catalog() -> pd.DataFrame:
    """
    Fetch the product catalog from Azure SQL Server.
    Falls back to mock data if connection fails.
    """
    try:
        conn = get_connection()
        query = """
            SELECT
                p.id as product_id, p.name as product_name, p.brand, p.category as product_type,
                p.price as price_value, p.dimensions, p.color as color_palette, p.vendor,
                p.affiliate_link as affiliate_url, p.image as image_url, p.design_id,
                p.room_type, p.aesthetic_style as style, d.total_cost as cost_total_design
            FROM products p
            LEFT JOIN designs d ON p.design_id = d.id
        """
        df = pd.read_sql(query, conn)
        conn.close()

        if df.empty:
            return pd.DataFrame()

        # ── Tag source ────────────────
        df["source"] = df["vendor"].apply(lambda x: x if x else "azure_sql")

        # ── Clean & Extract Brands ────
        df["brand"] = df.apply(
            lambda row: _clean_brand(str(row.get("brand", "")), str(row.get("product_name", ""))),
            axis=1
        )

        # ── Parse dimensions ──────────
        if "dimensions" in df.columns:
            dim_parsed = df["dimensions"].apply(_parse_dimensions).apply(pd.Series)
            df["width_cm"] = dim_parsed["width_cm"]
            df["depth_cm"] = dim_parsed["depth_cm"]
            df["height_cm"] = dim_parsed["height_cm"]

        # ── Normalize text columns ────
        text_cols = ["room_type", "style", "color_palette", "product_type",
                     "product_name", "vendor"]
        for col in text_cols:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip().str.lower()
                df[col] = df[col].replace("nan", None)

        # ── Ensure numeric columns ────
        numeric_cols = ["price_value", "width_cm", "depth_cm", "height_cm"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # ── Deduplicate by product_id ──
        df = df.drop_duplicates(subset=["product_id"], keep="first")

        # ── Select canonical columns ──
        available = [c for c in CANONICAL_COLUMNS if c in df.columns]
        df = df[available].reset_index(drop=True)

        return df

    except Exception as e:
        print(f"Failed to load catalog from Azure SQL: {e}")
        # --- Fallback to Mock Data if DB is blocked by firewall ---
        print("[Loader] Returning MOCK CATALOG data because Azure DB connection failed.", repr(e))
        mock_data = {
            "product_id": [
                "mock_1", "mock_2", "mock_3", "mock_4", "mock_5", 
                "mock_6", "mock_7", "mock_8", "mock_9", "mock_10",
                "mock_11", "mock_12", "mock_13", "mock_14", "mock_15"
            ],
            "product_name": [
                "Modern Luxury Sofa", "Classic Oak Dining Table", "Minimalist Floor Lamp", "Velvet Accent Chair", "Marble Coffee Table",
                "Italian Leather Sectional", "Scandinavian Sideboard", "Crystal Chandelier", "Abstract Wall Art", "Industrial Bookshelf",
                "Moroccan Area Rug", "Ceramic Table Lamp", "Teak Patio Set", "Plush Ottoman", "Walnut TV Unit"
            ],
            "brand": [
                "Solimo", "Urban Ladder", "Philips", "Pepperfry", "Home Centre",
                "Natuzzi", "IKEA", "Tanishq", "Art Street", "Godrej Interio",
                "Jaipur Rugs", "Sehaz Artworks", "RoyalOak", "Sleepyhead", "Nilkamal"
            ],
            "product_type": [
                "sofa", "table", "lighting", "chair", "table",
                "sofa", "storage", "lighting", "decor", "storage",
                "textile", "lighting", "table", "chair", "storage"
            ],
            "price_value": [
                45000, 32000, 4500, 12000, 18000,
                125000, 28000, 55000, 8500, 15000,
                22000, 3200, 42000, 6500, 19500
            ],
            "price_currency": ["₹"] * 15,
            "style": [
                "modern", "classic", "minimalist", "contemporary", "luxurious",
                "modern", "scandinavian", "luxurious", "abstract", "industrial",
                "ethnic", "handmade", "outdoor", "comfortable", "modern"
            ],
            "color_palette": [
                "neutral", "warm oak", "black", "emerald green", "white marble",
                "charcoal", "light wood", "sparkle", "multi-color", "rustic brown",
                "burnt orange", "cream", "honey", "blush pink", "deep walnut"
            ],
            "room_type": [
                "living_room", "dining_room", "bedroom", "living_room", "living_room",
                "living_room", "dining_room", "dining_room", "living_room", "study",
                "living_room", "bedroom", "outdoor", "bedroom", "living_room"
            ],
            "image_url": [""] * 15
        }
        return pd.DataFrame(mock_data)


def get_catalog_summary(catalog: pd.DataFrame) -> dict:
    """
    Return a summary dict for displaying catalog stats.
    """
    summary = {
        "total_products": len(catalog),
        "brands": sorted(catalog["brand"].dropna().unique().tolist()),
        "price_range": {
            "min": float(catalog["price_value"].min()) if not catalog["price_value"].isna().all() else 0,
            "max": float(catalog["price_value"].max()) if not catalog["price_value"].isna().all() else 0,
        },
    }

    # Optional fields
    for col_key in ["room_type", "style", "product_type", "color_palette"]:
        if col_key in catalog.columns:
            vals = catalog[col_key].dropna().unique().tolist()
            summary[f"{col_key}s" if not col_key.endswith("e") else f"{col_key}s"] = sorted(vals)
        else:
            summary[f"{col_key}s"] = []

    # Source breakdown
    if "source" in catalog.columns:
        summary["by_source"] = catalog["source"].value_counts().to_dict()
    else:
        summary["by_source"] = {"original_data": len(catalog)}

    return summary
