"""
Smart Filter Engine.

Applies multi-criteria filtering to the product catalog based on
user requirements extracted by the AI agent.  Supports fuzzy/partial
matching for text fields and range queries for numeric fields.

Supported filter keys:
    room_type       – exact or fuzzy match
    style           – exact or fuzzy match
    color_palette   – exact or fuzzy match
    product_type    – exact or fuzzy match
    brand           – exact or fuzzy match (case-insensitive)
    budget_min      – numeric: products with price >= value
    budget_max      – numeric: products with price <= value
    min_width       – numeric: width_cm >= value
    max_width       – numeric: width_cm <= value
    min_depth       – numeric: depth_cm >= value
    max_depth       – numeric: depth_cm <= value
    min_height      – numeric: height_cm >= value
    max_height      – numeric: height_cm <= value
    decor_type      – exact or fuzzy match
    role_in_design  – exact or fuzzy match
    keyword         – free-text search across product_name
"""

from __future__ import annotations
from typing import Any

import pandas as pd


def _fuzzy_match(series: pd.Series, value: str) -> pd.Series:
    """Case-insensitive substring match on a text Series."""
    value = str(value).strip().lower()
    return series.fillna("").str.lower().str.contains(value, regex=False)


def filter_products(
    catalog: pd.DataFrame,
    filters: dict[str, Any],
) -> pd.DataFrame:
    """
    Apply a dictionary of filters to the catalog and return matching rows.

    Args:
        catalog:  The full product catalog DataFrame.
        filters:  Dict of filter_key → value(s).  Supports:
                  - str values for text columns (fuzzy matched)
                  - int/float for numeric columns
                  - list[str] for multi-value text matching (OR)

    Returns:
        Filtered DataFrame (may be empty).
    """
    if not filters:
        return catalog.copy()

    mask = pd.Series(True, index=catalog.index)

    # ── Text filters (fuzzy / substring) ──────
    text_filters = {
        "room_type": "room_type",
        "style": "style",
        "color_palette": "color_palette",
        "product_type": "product_type",
        "brand": "brand",
        "decor_type": "decor_type",
        "role_in_design": "role_in_design",
    }

    for filter_key, col_name in text_filters.items():
        if filter_key in filters and filters[filter_key] and col_name in catalog.columns:
            value = filters[filter_key]
            if isinstance(value, list):
                # OR match: any of the listed values
                sub_mask = pd.Series(False, index=catalog.index)
                for v in value:
                    sub_mask = sub_mask | _fuzzy_match(catalog[col_name], v)
                mask = mask & sub_mask
            else:
                mask = mask & _fuzzy_match(catalog[col_name], value)

    # ── Budget / Price filters ────────────────
    if "budget_min" in filters and filters["budget_min"] is not None:
        val = float(filters["budget_min"])
        if "price_value" in catalog.columns:
            mask = mask & (catalog["price_value"] >= val)

    if "budget_max" in filters and filters["budget_max"] is not None:
        val = float(filters["budget_max"])
        if "price_value" in catalog.columns:
            mask = mask & (catalog["price_value"] <= val)

    # ── Dimension filters ─────────────────────
    dimension_filters = {
        "min_width": ("width_cm", ">="),
        "max_width": ("width_cm", "<="),
        "min_depth": ("depth_cm", ">="),
        "max_depth": ("depth_cm", "<="),
        "min_height": ("height_cm", ">="),
        "max_height": ("height_cm", "<="),
    }

    for filter_key, (col_name, op) in dimension_filters.items():
        if filter_key in filters and filters[filter_key] is not None:
            val = float(filters[filter_key])
            if col_name in catalog.columns:
                col = catalog[col_name]
                if op == ">=":
                    mask = mask & (col >= val)
                elif op == "<=":
                    mask = mask & (col <= val)

    # ── Keyword / free-text search ────────────
    if "keyword" in filters and filters["keyword"]:
        keyword = str(filters["keyword"]).strip().lower()
        
        name_col = "product_name" if "product_name" in catalog.columns else "name" if "name" in catalog.columns else None
        if name_col:
            name_match = catalog[name_col].fillna("").str.lower().str.contains(keyword, regex=False)
        else:
            name_match = pd.Series(False, index=catalog.index)
            
        if "brand" in catalog.columns:
            brand_match = catalog["brand"].fillna("").str.lower().str.contains(keyword, regex=False)
        else:
            brand_match = pd.Series(False, index=catalog.index)
            
        mask = mask & (name_match | brand_match)

    return catalog[mask].copy()
