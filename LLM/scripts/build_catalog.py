#!/usr/bin/env python3
"""
High-volume product catalog builder for A2S.
Runs all scrapers with optimized settings to build a 28k+ item catalog.

Usage:
    python scripts/build_catalog.py
    python scripts/build_catalog.py --output /path/to/output
    python scripts/build_catalog.py --max 500
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.run_crawler import export_to_excel, export_to_json, print_summary, push_to_backend, run_scraper
from scraper.base import logger


DEFAULT_SITES = ["ikea", "amazon", "flipkart", "pepperfry", "urbanladder", "woodenstreet"]


def build_catalog(
    max_per_category: int = 500,
    output_dir: str = ".",
    push_backend: bool = False,
    backend_url: str = "http://localhost:8080",
    sites: list[str] | None = None,
):
    selected_sites = sites or DEFAULT_SITES

    print("\n" + "=" * 70)
    print("  🛒  A2S CATALOG BUILDER - 28K+ Item Target")
    print("=" * 70)
    print(f"  Sites: {', '.join(selected_sites)}")
    print(f"  Max per category: {max_per_category}")
    print(f"  Estimated volume: ~{len(selected_sites) * 8 * max_per_category} items before dedup")
    print(f"  Output: {output_dir}")
    print("=" * 70 + "\n")

    logger.info("Starting high-volume catalog build...")
    df = run_scraper(sites=selected_sites, max_per_category=max_per_category)

    if df.empty:
        print("❌ No products scraped!")
        return None, None, None

    print(f"\n✅ Scraped {len(df)} total items")
    excel_path = export_to_excel(df, output_dir=output_dir)
    json_path = export_to_json(df, output_dir=output_dir)

    print(f"📊 Excel export: {excel_path}")
    print(f"📄 JSON export: {json_path}")
    print_summary(df)

    if "room_type" in df.columns:
        print("\n  Room Type Distribution:")
        for room, count in df["room_type"].value_counts().items():
            pct = (count / len(df)) * 100
            print(f"    {room:20s} {count:6d} products ({pct:5.1f}%)")

    if push_backend:
        print("\n  Pushing to backend API...")
        try:
            result = push_to_backend(df, backend_url)
            print("  ✅ Backend import complete:")
            print(f"     Created: {result.get('created', 0)}")
            print(f"     Updated: {result.get('updated', 0)}")
            print(f"     Total: {result.get('total', 0)}")
        except Exception as exc:
            logger.error(f"Backend import failed: {exc}")
            print(f"  ❌ Backend import failed: {exc}")

    print("\n" + "=" * 70)
    print(f"  ✅ Catalog build complete: {len(df)} items with room_type mapping")
    print("=" * 70 + "\n")
    return df, excel_path, json_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="A2S High-Volume Catalog Builder")
    parser.add_argument(
        "--sites",
        nargs="+",
        choices=DEFAULT_SITES,
        default=None,
        help="Sites to scrape (default: all)",
    )
    parser.add_argument("--max", type=int, default=500, help="Max products per category per site (default: 500)")
    parser.add_argument("--output", type=str, default=".", help="Output directory (default: current)")
    parser.add_argument("--push-backend", action="store_true", help="Push scraped records to backend /api/products/import")
    parser.add_argument("--backend-url", type=str, default="http://localhost:8080", help="Backend base URL (default: http://localhost:8080)")

    args = parser.parse_args()
    build_catalog(
        max_per_category=args.max,
        output_dir=args.output,
        push_backend=args.push_backend,
        backend_url=args.backend_url,
        sites=args.sites,
    )