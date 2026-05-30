"""
Product Ranking Engine.

After filtering, this module scores and ranks the remaining products
to surface the most relevant results to the user.

Scoring factors (weighted):
    1. Exact match on product_type          (30%)
    2. Price closeness to budget midpoint   (20%)
    3. Keyword match in product name        (20%)
    4. Exact match on room_type             (10%)
    5. Exact match on style                 (5%)
    6. Exact match on color_palette         (5%)
    7. Has valid image URL                  (5%)
    8. Has dimension data                   (5%)
"""

from __future__ import annotations
from typing import Any

import pandas as pd
import numpy as np

from config import MAX_RESULTS_PER_QUERY


def rank_products(
    products: pd.DataFrame,
    filters: dict[str, Any],
    top_n: int = MAX_RESULTS_PER_QUERY,
) -> pd.DataFrame:
    """
    Score and rank filtered products by relevance.

    Args:
        products:  Pre-filtered DataFrame of products.
        filters:   The same filter dict used for filtering (provides context).
        top_n:     Number of top results to return.

    Returns:
        Top-N products sorted by relevance score (descending).
    """
    if products.empty:
        return products

    df = products.copy()
    df["_score"] = 0.0

    # ── 1. Exact match on product_type (30%) — HIGHEST WEIGHT ──
    if filters.get("product_type") and "product_type" in df.columns:
        target = str(filters["product_type"]).lower()
        exact = df["product_type"].fillna("").str.lower() == target
        contains = df["product_type"].fillna("").str.lower().str.contains(target, regex=False)
        df["_score"] += exact.astype(float) * 0.30
        df["_score"] += (~exact & contains).astype(float) * 0.15

    # ── 2. Price closeness to budget midpoint (20%) ──
    budget_min = filters.get("budget_min")
    budget_max = filters.get("budget_max")

    if budget_min is not None or budget_max is not None:
        b_min = float(budget_min or 0)
        b_max = float(budget_max or df["price_value"].max())
        midpoint = (b_min + b_max) / 2

        if "price_value" in df.columns:
            distance = (df["price_value"] - midpoint).abs()
            # Normalize: closer = higher score (0 to 1)
            price_score = 1 - (distance / max(distance.max(), 1))
            df["_score"] += price_score * 0.20
    else:
        # No budget filter → small bonus for moderate prices (not extremes)
        if "price_value" in df.columns and not df["price_value"].isna().all():
            max_price = df["price_value"].max()
            if max_price > 0:
                df["_score"] += (1 - df["price_value"] / max_price) * 0.05

    # ── 3. Keyword match in product_name (20%) ──
    keyword = filters.get("keyword")
    ptype = filters.get("product_type")
    search_terms = []
    if keyword:
        search_terms.append(str(keyword).lower())
    if ptype:
        search_terms.append(str(ptype).lower())

    if search_terms:
        # Check if product_name OR name column exists
        name_col = "product_name" if "product_name" in df.columns else "name" if "name" in df.columns else None
        
        if name_col:
            name_lower = df[name_col].fillna("").str.lower()
            for term in search_terms:
                df["_score"] += name_lower.str.contains(term, regex=False).astype(float) * 0.10

    # ── 4. Exact match on room_type (10%) ──
    if filters.get("room_type") and "room_type" in df.columns:
        target = str(filters["room_type"]).lower()
        df["_score"] += (df["room_type"].fillna("").str.lower() == target).astype(float) * 0.10

    # ── 5. Exact match on style (5%) ──
    if filters.get("style") and "style" in df.columns:
        target = str(filters["style"]).lower()
        df["_score"] += (df["style"].fillna("").str.lower() == target).astype(float) * 0.05

    # ── 6. Exact match on color_palette (5%) ──
    if filters.get("color_palette") and "color_palette" in df.columns:
        target = str(filters["color_palette"]).lower()
        df["_score"] += (df["color_palette"].fillna("").str.lower() == target).astype(float) * 0.05

    # ── 7. Has valid image URL (5%) ──
    if "image_url" in df.columns:
        df["_score"] += df["image_url"].fillna("").str.startswith("http").astype(float) * 0.05

    # ── 8. Has dimension data (5%) ──
    if "width_cm" in df.columns:
        df["_score"] += df["width_cm"].notna().astype(float) * 0.05

    # ── Sort and return top N ──
    df = df.sort_values("_score", ascending=False).head(top_n)
    df = df.drop(columns=["_score"])

    return df.reset_index(drop=True)
