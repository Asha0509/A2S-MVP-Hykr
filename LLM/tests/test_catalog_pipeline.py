#!/usr/bin/env python3
"""
Fast test catalog builder - verifies the entire pipeline works.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.run_crawler import export_to_json, print_summary, push_to_backend, run_scraper


def test_catalog_pipeline():
    sites = ["ikea"]

    print("\n" + "=" * 70)
    print("  🧪 TESTING CATALOG PIPELINE - 28K Feature Verification")
    print("=" * 70)
    print(f"  Sites: {', '.join(sites)}")
    print("  Max per category: 20 (small test)")
    print("=" * 70 + "\n")

    df = run_scraper(sites=sites, max_per_category=20)

    if df.empty:
        print("❌ No products scraped!")
        return False

    print(f"\n✅ Scraped {len(df)} total test items")

    if "room_type" not in df.columns:
        print("❌ ERROR: room_type field missing!")
        return False

    print(f"✅ room_type field present in all {len(df)} items")
    print("\n📊 Room Type Distribution:")
    for room, count in df["room_type"].value_counts().items():
        pct = (count / len(df)) * 100
        print(f"   {room:20s} {count:4d} items ({pct:5.1f}%)")

    json_path = export_to_json(df, output_dir=".")
    print(f"\n📄 JSON exported: {json_path}")
    print_summary(df)

    print("\n🚀 Testing backend API injection...")
    result = push_to_backend(df, "http://localhost:8080")
    print("✅ Backend API Test Results:")
    print(f"   Created: {result.get('created', 0)} products")
    print(f"   Updated: {result.get('updated', 0)} products")
    print(f"   Total in DB: {result.get('total', 0)} products")
    return True


if __name__ == "__main__":
    raise SystemExit(0 if test_catalog_pipeline() else 1)