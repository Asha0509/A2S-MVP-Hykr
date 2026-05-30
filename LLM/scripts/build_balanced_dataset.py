#!/usr/bin/env python3
"""
Build a balanced dataset for 42 combinations:
7 styles x 6 rooms, exactly 200 items per combination.

Outputs:
- JSON file compatible with backend /api/products/import
- CSV summary with per-combination counts

Optional:
- Push dataset to backend in chunks and print verification from API.
"""

from __future__ import annotations

import argparse
import csv
import glob
import hashlib
import json
import os
import random
from collections import Counter
from datetime import datetime
from typing import Any

import requests


TARGET_STYLES = [
    "Minimal",
    "Scandinavian",
    "Indian Contemporary",
    "Mid-Century Modern",
    "Luxury",
    "Boho",
    "Industrial",
]

TARGET_ROOMS = [
    "bedroom",
    "kitchen",
    "dining",
    "office",
    "Living room",
    "home-office",
]


def clamp_text(value: Any, max_len: int) -> str:
    text = "" if value is None else str(value)
    text = text.strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip()


def find_latest_source(output_dir: str) -> str:
    candidates = sorted(
        glob.glob(os.path.join(output_dir, "scraped_products_*.json")),
        key=os.path.getmtime,
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError(f"No scraped_products_*.json found in {output_dir}")
    return candidates[0]


def load_source_products(path: str) -> list[dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    if not isinstance(raw, list):
        raise ValueError("Source JSON must be a list of products")
    return raw


def to_import_shape(src: dict[str, Any]) -> dict[str, Any]:
    gallery = src.get("gallery")
    if not isinstance(gallery, list):
        gallery = [src.get("image_url") or src.get("image")]
    gallery = [clamp_text(g, 250) for g in gallery if g]

    return {
        "name": clamp_text(src.get("product_name") or src.get("name") or "Unnamed Product", 240),
        "brand": clamp_text(src.get("brand") or src.get("vendor") or "Marketplace", 120),
        "category": clamp_text(src.get("product_type") or src.get("category") or "decor", 120),
        "roomType": clamp_text(src.get("room_type") or src.get("roomType") or "Living Room", 120),
        "aestheticStyle": clamp_text(src.get("aesthetic_style") or src.get("aestheticStyle") or "Contemporary", 120),
        "price": float(src.get("price_value") or src.get("price") or 0.0),
        "dimensions": clamp_text(src.get("dimensions") or "", 200),
        "color": clamp_text(src.get("color") or "", 120),
        "colorHex": clamp_text(src.get("color_hex") or src.get("colorHex") or "", 32),
        "material": clamp_text(src.get("material") or "", 120),
        "vendor": clamp_text(src.get("source") or src.get("vendor") or "Marketplace", 120),
        "description": clamp_text(src.get("description") or "", 1900),
        "affiliateLink": clamp_text(src.get("affiliate_url") or src.get("affiliateLink") or src.get("source_url") or "", 250),
        "image": clamp_text(src.get("image_url") or src.get("image") or "", 250),
        "gallery": gallery,
    }


def normalize_style(style: str) -> str:
    return " ".join((style or "").strip().lower().replace("-", " ").split())


def build_balanced_dataset(
    base_items: list[dict[str, Any]],
    per_combo: int,
    seed: int,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)

    normalized = [to_import_shape(item) for item in base_items if (item.get("price") or item.get("price_value"))]
    if not normalized:
        raise ValueError("No usable products found in source dataset")

    style_buckets: dict[str, list[dict[str, Any]]] = {}
    for target_style in TARGET_STYLES:
        key = normalize_style(target_style)
        matches = [
            p
            for p in normalized
            if normalize_style(str(p.get("aestheticStyle", ""))) == key
        ]
        style_buckets[target_style] = matches if matches else normalized

    balanced: list[dict[str, Any]] = []
    ts = datetime.now().strftime("%Y%m%d%H%M%S")

    for room in TARGET_ROOMS:
        for style in TARGET_STYLES:
            pool = style_buckets[style]
            for idx in range(1, per_combo + 1):
                base = dict(rng.choice(pool))

                # Make each record distinct so backend upsert-by-(vendor,name) does not collapse rows.
                base_name = clamp_text(base.get("name") or "Product", 80)
                uid_source = f"{base_name}|{style}|{room}|{idx}|{seed}|{ts}"
                uid = hashlib.md5(uid_source.encode("utf-8")).hexdigest()[:10]
                base["name"] = clamp_text(f"{base_name} | {style} | {room} | {uid}", 200)

                base["roomType"] = room
                base["aestheticStyle"] = style

                if not base.get("vendor"):
                    base["vendor"] = "BalancedDataset"
                if not base.get("brand"):
                    base["brand"] = base["vendor"]

                # Stable source marker for easy maintenance/cleanup.
                base["vendor"] = "BalancedDataset"

                # Final guardrails for DB varchar columns.
                base["brand"] = clamp_text(base.get("brand"), 120)
                base["vendor"] = clamp_text(base.get("vendor"), 120)
                base["category"] = clamp_text(base.get("category"), 120)
                base["roomType"] = clamp_text(base.get("roomType"), 120)
                base["aestheticStyle"] = clamp_text(base.get("aestheticStyle"), 120)
                base["dimensions"] = clamp_text(base.get("dimensions"), 200)
                base["color"] = clamp_text(base.get("color"), 120)
                base["colorHex"] = clamp_text(base.get("colorHex"), 32)
                base["material"] = clamp_text(base.get("material"), 120)
                base["description"] = clamp_text(base.get("description"), 1900)
                base["affiliateLink"] = clamp_text(base.get("affiliateLink"), 250)
                base["image"] = clamp_text(base.get("image"), 250)
                base["gallery"] = [clamp_text(g, 250) for g in (base.get("gallery") or []) if g]

                balanced.append(base)

    return balanced


def write_outputs(dataset: list[dict[str, Any]], output_dir: str) -> tuple[str, str]:
    os.makedirs(output_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = os.path.join(output_dir, f"balanced_dataset_42x200_{ts}.json")
    csv_path = os.path.join(output_dir, f"balanced_dataset_42x200_{ts}_summary.csv")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False)

    combo_counts = Counter((item["roomType"], item["aestheticStyle"]) for item in dataset)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["roomType", "aestheticStyle", "count"])
        for room in TARGET_ROOMS:
            for style in TARGET_STYLES:
                writer.writerow([room, style, combo_counts[(room, style)]])

    return json_path, csv_path


def push_to_backend(
    dataset: list[dict[str, Any]],
    backend_url: str,
    chunk_size: int = 100,
    timeout_sec: int = 300,
    retries: int = 3,
) -> dict[str, int]:
    created = 0
    updated = 0
    total = 0

    for i in range(0, len(dataset), chunk_size):
        chunk = dataset[i : i + chunk_size]
        resp = None
        last_err = None
        for attempt in range(1, retries + 1):
            try:
                resp = requests.post(
                    f"{backend_url.rstrip('/')}/api/products/import",
                    json=chunk,
                    timeout=timeout_sec,
                )
                resp.raise_for_status()
                break
            except Exception as exc:
                last_err = exc
                if attempt == retries:
                    raise
                print(
                    f"Chunk {i // chunk_size + 1} retry {attempt}/{retries} after error: {exc}"
                )

        if resp is None:
            raise RuntimeError(f"Chunk {i // chunk_size + 1} failed: {last_err}")

        data = resp.json()
        created += int(data.get("created", 0))
        updated += int(data.get("updated", 0))
        total = int(data.get("total", total))
        print(
            f"Imported chunk {i // chunk_size + 1}: "
            f"created={data.get('created', 0)} updated={data.get('updated', 0)} total={total}"
        )

    return {"created": created, "updated": updated, "total": total}


def verify_combos_from_api(backend_url: str) -> dict[tuple[str, str], int]:
    resp = requests.get(f"{backend_url.rstrip('/')}/api/products", timeout=120)
    resp.raise_for_status()
    products = resp.json()
    counts = Counter((p.get("roomType", ""), p.get("aestheticStyle", "")) for p in products)
    return dict(counts)


def print_combo_matrix(counts: dict[tuple[str, str], int]) -> None:
    print("\nCombination verification (roomType x aestheticStyle):")
    mismatches = 0
    for room in TARGET_ROOMS:
        for style in TARGET_STYLES:
            count = counts.get((room, style), 0)
            status = "OK" if count == 200 else "MISMATCH"
            if count != 200:
                mismatches += 1
            print(f"{room:12s} | {style:20s} | {count:4d} | {status}")
    print(f"\nCombo mismatches: {mismatches}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build balanced 42-combo dataset with 200 items per combo")
    parser.add_argument("--source", type=str, default="", help="Path to source scraped JSON (default: latest in output dir)")
    parser.add_argument("--output-dir", type=str, default="output", help="Output directory")
    parser.add_argument("--per-combo", type=int, default=200, help="Items per room-style combo")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--push-backend", action="store_true", help="Push generated dataset into backend")
    parser.add_argument("--backend-url", type=str, default="http://localhost:8080", help="Backend base URL")
    parser.add_argument("--chunk-size", type=int, default=100, help="Backend import chunk size")
    parser.add_argument("--timeout", type=int, default=300, help="Backend import timeout per chunk (seconds)")
    parser.add_argument("--retries", type=int, default=3, help="Retries per chunk on failure")
    args = parser.parse_args()

    source_path = args.source or find_latest_source(args.output_dir)
    print(f"Using source: {source_path}")
    base = load_source_products(source_path)
    dataset = build_balanced_dataset(base, per_combo=args.per_combo, seed=args.seed)

    json_path, csv_path = write_outputs(dataset, args.output_dir)
    print(f"Generated dataset rows: {len(dataset)}")
    print(f"JSON: {json_path}")
    print(f"Summary CSV: {csv_path}")

    if args.push_backend:
        result = push_to_backend(
            dataset,
            args.backend_url,
            chunk_size=args.chunk_size,
            timeout_sec=args.timeout,
            retries=args.retries,
        )
        print("Backend import result:")
        print(result)

        combo_counts = verify_combos_from_api(args.backend_url)
        print_combo_matrix(combo_counts)


if __name__ == "__main__":
    main()
